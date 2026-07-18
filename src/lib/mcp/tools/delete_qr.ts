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
  name: "delete_qr",
  title: "Delete a QR code",
  description: "Delete a QR the signed-in user owns. Set `kind` to \"static\" for saved static QRs or \"dynamic\" for dynamic QRs.",
  inputSchema: {
    id: z.string().uuid(),
    kind: z.enum(["static", "dynamic"]),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, kind }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const table = kind === "static" ? "saved_qrs" : "dynamic_qrs";
    const { error } = await sb(ctx).from(table).delete().eq("id", id);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Deleted ${kind} QR ${id}.` }] };
  },
});