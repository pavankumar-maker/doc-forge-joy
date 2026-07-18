import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function siteOrigin() {
  return process.env.SITE_URL ?? "https://doc-forge-joy.lovable.app";
}

export default defineTool({
  name: "create_vcard_qr",
  title: "Create Digital Business Card QR",
  description: "Create a hosted Digital Business Card dynamic QR. Returns the public /d/:id URL that the QR encodes.",
  inputSchema: {
    fullName: z.string().trim().min(1).max(120),
    title: z.string().max(120).default(""),
    org: z.string().max(120).default(""),
    phone: z.string().max(40).default(""),
    email: z.string().max(120).default(""),
    website: z.string().max(240).default(""),
    address: z.string().max(240).default(""),
    bio: z.string().max(500).default(""),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = sb(ctx);
    const { data: row, error } = await client
      .from("dynamic_qrs")
      .insert({
        user_id: ctx.getUserId(),
        name: input.fullName,
        file_kind: "vcard",
        content: input,
      })
      .select("id")
      .single();
    if (error || !row) return { content: [{ type: "text", text: error?.message ?? "Insert failed" }], isError: true };
    const shareUrl = `${siteOrigin()}/d/${row.id}`;
    await client.from("dynamic_qrs").update({ file_url: shareUrl }).eq("id", row.id);
    return {
      content: [{ type: "text", text: `Business Card QR created: ${shareUrl}` }],
      structuredContent: { id: row.id, share_url: shareUrl },
    };
  },
});