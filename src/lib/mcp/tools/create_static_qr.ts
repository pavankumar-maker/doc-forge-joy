import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_static_qr",
  title: "Save a static QR code",
  description: "Create and save a static QR code to the signed-in user's dashboard. `value` is the exact string to encode (URL, WIFI: string, BEGIN:VCARD block, etc).",
  inputSchema: {
    name: z.string().trim().min(1).max(80),
    qr_type: z.string().trim().min(1).max(40).describe("Type label, e.g. website, text, vcard, wifi, upi, multilink."),
    value: z.string().trim().min(1).describe("The exact payload to encode."),
    foreground: z.string().default("#0b0b12"),
    background: z.string().default("#ffffff"),
    error_correction: z.enum(["L", "M", "Q", "H"]).default("H"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ name, qr_type, value, foreground, background, error_correction }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx)
      .from("saved_qrs")
      .insert({
        user_id: ctx.getUserId(),
        name,
        qr_type,
        content: { value },
        design: { fg: foreground, bg: background, ecl: error_correction },
      })
      .select("id, name, qr_type, created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Saved static QR "${data.name}" (id ${data.id}).` }],
      structuredContent: { qr: data },
    };
  },
});