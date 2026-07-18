import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getDynamicQr = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("dynamic_qrs")
      .select("id,name,file_kind,file_path,mime_type,content")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) return { ok: false as const };
    let signedUrl: string | null = null;
    if (row.file_path && ["image", "video", "pdf", "file"].includes(row.file_kind)) {
      const { data: signed } = await supabaseAdmin.storage
        .from("dynamic-qr")
        .createSignedUrl(row.file_path, 60 * 60);
      signedUrl = signed?.signedUrl ?? null;
    }
    return {
      ok: true as const,
      row: {
        id: row.id,
        name: row.name,
        file_kind: row.file_kind,
        mime_type: row.mime_type,
        content: row.content,
      },
      signedUrl,
    };
  });