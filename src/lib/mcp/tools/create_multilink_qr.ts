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
  name: "create_multilink_qr",
  title: "Create Multi-Link dynamic QR",
  description: "Create a hosted Multi-Link (linktree-style) dynamic QR. Returns the public /d/:id URL that the QR encodes.",
  inputSchema: {
    name: z.string().trim().min(1).max(80),
    bio: z.string().max(500).default(""),
    links: z
      .array(z.object({ label: z.string().trim().min(1), url: z.string().trim().url() }))
      .min(1),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async ({ name, bio, links }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = sb(ctx);
    const { data: row, error } = await client
      .from("dynamic_qrs")
      .insert({
        user_id: ctx.getUserId(),
        name,
        file_kind: "multilink",
        content: { bio, links },
      })
      .select("id")
      .single();
    if (error || !row) return { content: [{ type: "text", text: error?.message ?? "Insert failed" }], isError: true };
    const shareUrl = `${siteOrigin()}/d/${row.id}`;
    await client.from("dynamic_qrs").update({ file_url: shareUrl }).eq("id", row.id);
    return {
      content: [{ type: "text", text: `Multi-Link QR created: ${shareUrl}` }],
      structuredContent: { id: row.id, share_url: shareUrl },
    };
  },
});