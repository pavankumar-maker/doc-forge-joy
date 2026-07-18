import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Download } from "lucide-react";

export const Route = createFileRoute("/d/$id")({
  head: () => ({
    meta: [
      { title: "Dynamic QR — UniQR" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DynamicViewer,
});

interface Row {
  id: string;
  name: string;
  file_kind: "image" | "video" | "pdf" | "file";
  file_path: string;
  mime_type: string | null;
}

function DynamicViewer() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<Row | null>(null);
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("dynamic_qrs")
        .select("id,name,file_kind,file_path,mime_type")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setError("This QR link is invalid or has been removed.");
        return;
      }
      setRow(data as Row);
      const { data: signed } = await supabase.storage
        .from("dynamic-qr")
        .createSignedUrl(data.file_path, 60 * 60);
      if (!cancelled && signed?.signedUrl) setUrl(signed.signedUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Link unavailable</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </section>
    );
  }

  if (!row || !url) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 grid place-items-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold mb-6 break-words">{row.name}</h1>
      <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
        {row.file_kind === "image" && (
          <img src={url} alt={row.name} className="w-full h-auto rounded-lg" />
        )}
        {row.file_kind === "video" && (
          <video src={url} controls className="w-full rounded-lg" />
        )}
        {row.file_kind === "pdf" && (
          <iframe src={url} title={row.name} className="w-full h-[80vh] rounded-lg bg-white" />
        )}
        {row.file_kind === "file" && (
          <div className="flex items-center gap-3 p-6">
            <FileText className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <p className="font-medium">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.mime_type}</p>
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <a
            href={url}
            download
            className="inline-flex items-center gap-2 rounded-lg bg-secondary hover:bg-secondary/80 px-4 py-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      </div>
    </section>
  );
}