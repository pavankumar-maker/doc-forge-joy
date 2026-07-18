import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — UniQR" },
      { name: "description", content: "Your saved QR codes." },
    ],
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

function DashboardPage() {
  const [items, setItems] = useState<SavedQr[] | null>(null);
  const [email, setEmail] = useState<string>("");

  const load = async () => {
    const { data, error } = await supabase
      .from("saved_qrs")
      .select("id, name, qr_type, content, design, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setItems([]);
      return;
    }
    setItems(data as unknown as SavedQr[]);
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

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-sm font-medium text-primary">Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Your QR codes</h1>
          {email && <p className="mt-1 text-sm text-muted-foreground">Signed in as {email}</p>}
        </div>
        <Link
          to="/generator"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> New QR
        </Link>
      </div>

      {items === null ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-16 text-center">
          <h2 className="text-lg font-semibold">No saved QRs yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create your first QR and save it here.</p>
          <Link
            to="/generator"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> Create QR
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => (
            <QrCard key={it.id} item={it} onDelete={() => remove(it.id)} />
          ))}
        </div>
      )}
    </section>
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