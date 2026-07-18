import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDynamicQr } from "@/lib/dynamic-qr.functions";
import { Loader2, FileText, Download, ExternalLink, Mail, Phone, Building } from "lucide-react";

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
  file_kind: "image" | "video" | "pdf" | "file" | "multilink" | "vcard" | "link";
  file_path: string | null;
  mime_type: string | null;
  content: Record<string, unknown> | null;
}

function DynamicViewer() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<Row | null>(null);
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getDynamicQr({ data: { id } }).catch(() => null);
      if (cancelled) return;
      if (!res || !res.ok) {
        setError("This QR link is invalid or has been removed.");
        return;
      }
      const data = res.row;
      setRow(data as Row);
      // Fire-and-forget scan tracking
      supabase.rpc("record_scan", {
        _qr_id: data.id,
        _referrer: document.referrer || undefined,
        _user_agent: navigator.userAgent || undefined,
      });
      if (data.file_kind === "link") {
        const target = (data.content as { value?: string } | null)?.value;
        if (target) {
          window.location.replace(target);
          return;
        }
      }
      if (res.signedUrl) setUrl(res.signedUrl);
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

  const needsFile = row && ["image", "video", "pdf", "file"].includes(row.file_kind);
  if (!row || (needsFile && !url)) {
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
        {row.file_kind === "multilink" && <MultiLinkView content={row.content} />}
        {row.file_kind === "vcard" && <VCardView content={row.content} />}
        {needsFile && (
        <div className="mt-4 flex justify-end">
          <a
            href={url}
            download
            className="inline-flex items-center gap-2 rounded-lg bg-secondary hover:bg-secondary/80 px-4 py-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
        )}
      </div>
    </section>
  );
}

function MultiLinkView({ content }: { content: Record<string, unknown> | null }) {
  const links = (content?.links as { label: string; url: string }[] | undefined) ?? [];
  const bio = (content?.bio as string | undefined) ?? "";
  return (
    <div className="p-4">
      {bio && <p className="text-center text-muted-foreground mb-6">{bio}</p>}
      <div className="space-y-3 max-w-md mx-auto">
        {links.map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl bg-gradient-brand text-primary-foreground px-5 py-4 font-medium hover:opacity-90 transition"
          >
            <span>{l.label}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        ))}
        {links.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No links yet.</p>
        )}
      </div>
    </div>
  );
}

function VCardView({ content }: { content: Record<string, unknown> | null }) {
  const c = (content ?? {}) as {
    fullName?: string; title?: string; org?: string;
    phone?: string; email?: string; website?: string; address?: string; bio?: string;
  };
  const download = () => {
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:${c.fullName ?? ""}\nORG:${c.org ?? ""}\nTITLE:${c.title ?? ""}\nTEL:${c.phone ?? ""}\nEMAIL:${c.email ?? ""}\nURL:${c.website ?? ""}\nADR:;;${c.address ?? ""}\nNOTE:${c.bio ?? ""}\nEND:VCARD`;
    const blob = new Blob([vcf], { type: "text/vcard" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(c.fullName || "contact").replace(/\s+/g, "_")}.vcf`;
    a.click();
  };
  return (
    <div className="p-6 max-w-md mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground text-2xl font-bold mx-auto mb-4">
        {(c.fullName ?? "?").slice(0, 1).toUpperCase()}
      </div>
      <h2 className="text-xl font-bold">{c.fullName}</h2>
      {c.title && <p className="text-muted-foreground">{c.title}</p>}
      {c.org && (
        <p className="text-sm text-muted-foreground inline-flex items-center gap-1 justify-center mt-1">
          <Building className="w-3.5 h-3.5" /> {c.org}
        </p>
      )}
      {c.bio && <p className="mt-4 text-sm">{c.bio}</p>}
      <div className="mt-6 space-y-2 text-left text-sm">
        {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2"><Phone className="w-4 h-4 text-primary" />{c.phone}</a>}
        {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2"><Mail className="w-4 h-4 text-primary" />{c.email}</a>}
        {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2"><ExternalLink className="w-4 h-4 text-primary" />{c.website}</a>}
      </div>
      <button onClick={download} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-brand text-primary-foreground px-5 py-2.5 font-medium">
        <Download className="w-4 h-4" /> Save contact
      </button>
    </div>
  );
}