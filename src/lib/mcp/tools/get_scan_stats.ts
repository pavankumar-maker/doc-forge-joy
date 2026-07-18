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
  name: "get_scan_stats",
  title: "Get scan analytics for a dynamic QR",
  description: "Return recent scan events and total scan count for one dynamic QR the user owns.",
  inputSchema: {
    qr_id: z.string().uuid(),
    limit: z.number().int().min(1).max(500).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ qr_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = sb(ctx);
    const { data: qr, error: qrErr } = await client
      .from("dynamic_qrs")
      .select("id, name, scans, file_kind")
      .eq("id", qr_id)
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (qrErr) return { content: [{ type: "text", text: qrErr.message }], isError: true };
    if (!qr) return { content: [{ type: "text", text: "QR not found or not owned by you." }], isError: true };
    const { data: events, error: evErr } = await client
      .from("scan_events")
      .select("created_at, referrer, user_agent")
      .eq("qr_id", qr_id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (evErr) return { content: [{ type: "text", text: evErr.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify({ qr, events }, null, 2) }],
      structuredContent: { qr, events: events ?? [] },
    };
  },
});