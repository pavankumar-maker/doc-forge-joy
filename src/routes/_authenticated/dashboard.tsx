import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Download, Loader2, Search, Zap, BarChart3, User } from "lucide-react";

// The QR image encodes the public share URL. Inside the editor/preview
// iframe, window.location.origin is an ephemeral preview host that isn't
// reachable from a phone scan, so we always fall back to the published
// origin for preview / localhost / lovableproject hosts.
const PUBLISHED_ORIGIN = "https://doc-forge-joy.lovable.app";
function getShareOrigin(): string {
  if (typeof window === "undefined") return PUBLISHED_ORIGIN;
  const host = window.location.hostname;
  if (
    host === "localhost" ||
    host.endsWith("lovableproject.com") ||
    host.includes("id-preview--")
  ) {
    return PUBLISHED_ORIGIN;
  }
  return window.location.origin;
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — UniQR" },
      { name: "description", content: "Manage every QR code you have saved to UniQR — preview, download as PNG or delete campaigns you no longer need." },
      { property: "og:title", content: "Dashboard — UniQR" },
      { property: "og:description", content: "Preview, download and manage all of the QR codes saved to your UniQR account." },
      { property: "og:url", content: "https://doc-forge-joy.lovable.app/dashboard" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://doc-forge-joy.lovable.app/dashboard" }],
  }),
  component: DashboardPage,
});

interface SavedQr {
  id: string;
  name: string;
  qr_type: string;
  content: { value: string };
  design: { fg?: string; bg?: string; ecl?: "L" | "M" | "Q" | "H" };
  created_at: string;
}

interface DynamicQr {
  id: string;
  name: string;
  file_kind: string;
  scans: number;
  created_at: string;
}

function DashboardPage() {
  const [items, setItems] = useState<SavedQr[] | null>(null);
  const [dynamics, setDynamics] = useState<DynamicQr[] | null>(null);
  const [email, setEmail] = useState<string>("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "static" | "dynamic">("all");

  const load = async () => {
    const [s, d] = await Promise.all([
      supabase
      .from("saved_qrs")
      .select("id, name, qr_type, content, design, created_at")
      .order("created_at", { ascending: false }),
      supabase
      .from("dynamic_qrs")
      .select("id, name, file_kind, scans, created_at")
      .order("created_at", { ascending: false }),
    ]);
    if (s.error) toast.error(s.error.message);
    setItems((s.data as unknown as SavedQr[]) ?? []);
    if (d.error) toast.error(d.error.message);
    setDynamics((d.data as unknown as DynamicQr[]) ?? []);
  };

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const remove = async (id: string) => {
    const prev = items;
    setItems((x) => x?.filter((i) => i.id !== id) ?? null);
    const { error } = await supabase.from("saved_qrs").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      setItems(prev);
    } else {
      toast.success("QR deleted");
    }
  };

  const removeDynamic = async (id: string) => {
    const prev = dynamics;
    setDynamics((x) => x?.filter((i) => i.id !== id) ?? null);
    const { error } = await supabase.from("dynamic_qrs").delete().eq("id", id);
    if (error) { toast.error(error.message); setDynamics(prev); }
    else toast.success("Dynamic QR deleted");
  };

  const q = query.trim().toLowerCase();
  const filteredStatic = useMemo(
    () => (items ?? []).filter((i) => (!q || i.name.toLowerCase().includes(q) || i.qr_type.toLowerCase().includes(q))),
    [items, q]
  );
  const filteredDynamic = useMemo(
    () => (dynamics ?? []).filter((i) => (!q || i.name.toLowerCase().includes(q) || i.file_kind.toLowerCase().includes(q))),
    [dynamics, q]
  );
  const showStatic = filter !== "dynamic";
  const showDynamic = filter !== "static";
  const totalScans = (dynamics ?? []).reduce((n, d) => n + (d.scans ?? 0), 0);
  const loading = items === null || dynamics === null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-sm font-medium text-primary">Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Your QR codes</h1>
          {email && <p className="mt-1 text-sm text-muted-foreground">Signed in as {email}</p>}
        </div>
        <div className="flex gap-2">
          <Link to="/profile" className="inline-flex items-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 px-4 py-3 text-sm font-medium transition">
            <User className="w-4 h-4" /> Profile
          </Link>
          <Link to="/generator" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> New QR
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Static QRs" value={items?.length ?? 0} />
        <Stat label="Dynamic QRs" value={dynamics?.length ?? 0} icon={Zap} />
        <Stat label="Total scans" value={totalScans} icon={BarChart3} />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or type…"
            className="w-full rounded-xl bg-input border border-border/60 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
        <div className="inline-flex rounded-xl bg-secondary p-1">
          {(["all", "static", "dynamic"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                filter === f ? "bg-gradient-brand text-primary-foreground shadow" : "text-muted-foreground"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filteredStatic.length === 0 && filteredDynamic.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-16 text-center">
          <h2 className="text-lg font-semibold">Nothing to show</h2>
          <p className="mt-2 text-sm text-muted-foreground">{query ? "Try a different search." : "Create your first QR and save it here."}</p>
          <Link
            to="/generator"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> Create QR
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {showDynamic && filteredDynamic.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 inline-flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Dynamic QRs</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDynamic.map((it) => (
                  <DynamicCard key={it.id} item={it} onDelete={() => removeDynamic(it.id)} />
                ))}
              </div>
            </div>
          )}
          {showStatic && filteredStatic.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Static QRs</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStatic.map((it) => (
                  <QrCard key={it.id} item={it} onDelete={() => remove(it.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
      <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wide">
        <span>{label}</span>
        {Icon && <Icon className="w-4 h-4 text-primary" />}
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function DynamicCard({ item, onDelete }: { item: DynamicQr; onDelete: () => void }) {
  const [dataUrl, setDataUrl] = useState("");
  const shareUrl = `${getShareOrigin()}/d/${item.id}`;
  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, { width: 512, margin: 2, errorCorrectionLevel: "H" }).then(setDataUrl);
  }, [shareUrl]);
  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a"); a.href = dataUrl; a.download = `${item.name.replace(/\s+/g, "-")}.png`; a.click();
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4 hover:border-primary/40 transition">
      <div className="relative rounded-xl bg-white aspect-square grid place-items-center overflow-hidden">
        {dataUrl && <img src={dataUrl} alt={item.name} className="w-full h-full p-3" />}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-primary/90 text-primary-foreground px-2 py-0.5 text-[10px] font-semibold">
          <Zap className="w-3 h-3" /> Dynamic
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{item.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">{item.file_kind} · {item.scans} scans</p>
        </div>
        <div className="flex gap-1">
          <a href={`/d/${item.id}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition text-xs" aria-label="Open">↗</a>
          <button onClick={download} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition" aria-label="Download">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition" aria-label="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function QrCard({ item, onDelete }: { item: SavedQr; onDelete: () => void }) {
  const [dataUrl, setDataUrl] = useState("");
  const value = item.content?.value ?? "";

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: 512,
      margin: 2,
      color: { dark: item.design?.fg ?? "#0b0b12", light: item.design?.bg ?? "#ffffff" },
      errorCorrectionLevel: item.design?.ecl ?? "H",
    }).then(setDataUrl);
  }, [value, item.design]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${item.name.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  return (
    <div className="group rounded-2xl border border-border/60 bg-card/50 p-4 hover:border-primary/40 transition">
      <div className="rounded-xl bg-white aspect-square grid place-items-center overflow-hidden">
        {dataUrl && <img src={dataUrl} alt={item.name} className="w-full h-full p-3" />}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{item.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">{item.qr_type}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={download}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition"
            aria-label="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}