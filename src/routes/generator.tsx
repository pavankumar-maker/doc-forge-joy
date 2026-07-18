import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import {
  Globe,
  Type,
  Contact,
  MessageCircle,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  CreditCard,
  Wifi,
  Download,
  Zap,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  File as FileIcon,
  Loader2,
  Copy,
  Check,
  Link2,
  User,
  Plus,
  Trash2,
  Share2,
  Camera,
} from "lucide-react";

export const Route = createFileRoute("/generator")({
  head: () => ({
    meta: [
      { title: "QR Generator — UniQR" },
      {
        name: "description",
        content:
          "Create fully customized static or dynamic QR codes. Pick a type, fill the details, design it, and download in PNG, SVG or PDF.",
      },
      { property: "og:title", content: "QR Generator — UniQR" },
      { property: "og:description", content: "Design custom QR codes for websites, WiFi, UPI, vCards and WhatsApp with a live preview, custom colors and PNG, SVG and PDF exports." },
      { property: "og:url", content: "https://doc-forge-joy.lovable.app/generator" },
    ],
    links: [{ rel: "canonical", href: "https://doc-forge-joy.lovable.app/generator" }],
  }),
  component: GeneratorPage,
});

type QRType =
  | "website"
  | "text"
  | "vcard"
  | "whatsapp"
  | "phone"
  | "email"
  | "sms"
  | "maps"
  | "upi"
  | "wifi"
  | "multilink"
  | "facebook"
  | "instagram"
  | "image"
  | "video"
  | "pdf";

const TYPES: { key: QRType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "website", label: "Website", icon: Globe },
  { key: "text", label: "Text", icon: Type },
  { key: "vcard", label: "vCard", icon: Contact },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "facebook", label: "Facebook", icon: Share2 },
  { key: "instagram", label: "Instagram", icon: Camera },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
  { key: "maps", label: "Maps", icon: MapPin },
  { key: "upi", label: "UPI", icon: CreditCard },
  { key: "wifi", label: "WiFi", icon: Wifi },
  { key: "multilink", label: "Multi-Link", icon: Link2 },
  { key: "image", label: "Image", icon: ImageIcon },
  { key: "video", label: "Video", icon: Video },
  { key: "pdf", label: "PDF", icon: FileText },
];

interface Fields {
  url: string;
  text: string;
  vcard: { name: string; org: string; phone: string; email: string };
  whatsapp: { phone: string; message: string };
  phone: string;
  email: { to: string; subject: string; body: string };
  sms: { phone: string; message: string };
  maps: { query: string };
  upi: { vpa: string; name: string; amount: string };
  wifi: { ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass" };
  multilink: { title: string; links: MLLink[] };
  facebook: string;
  instagram: string;
  image: string;
  video: string;
  pdf: string;
}

const DEFAULTS: Fields = {
  url: "https://uniqr.app",
  text: "Hello from UniQR!",
  vcard: { name: "Ada Lovelace", org: "UniQR", phone: "+15551234567", email: "ada@uniqr.app" },
  whatsapp: { phone: "15551234567", message: "Hi!" },
  phone: "+15551234567",
  email: { to: "hello@uniqr.app", subject: "Hello", body: "Hi there," },
  sms: { phone: "+15551234567", message: "Hi!" },
  maps: { query: "Golden Gate Bridge" },
  upi: { vpa: "uniqr@bank", name: "UniQR", amount: "100" },
  wifi: { ssid: "UniQR-Guest", password: "supersecret", encryption: "WPA" },
  multilink: {
    title: "My Links",
    links: [
      { type: "website", label: "Website", value: "https://uniqr.app", extra: "" },
      { type: "instagram", label: "Instagram", value: "uniqr", extra: "" },
    ],
  },
  facebook: "uniqr",
  instagram: "uniqr",
  image: "https://example.com/photo.jpg",
  video: "https://example.com/clip.mp4",
  pdf: "https://example.com/document.pdf",
};

function socialUrl(base: string, v: string) {
  const t = v.trim();
  if (!t) return base;
  if (/^https?:\/\//i.test(t)) return t;
  return `${base}/${t.replace(/^@/, "")}`;
}

// ============ Multi-Link per-link types ============
export type MLLink = {
  type: string;
  label: string;
  value: string;
  extra?: string;
};

type MLKind = {
  id: string;
  label: string;
  icon: any;
  placeholder: string;
  extraPlaceholder?: string;
  build: (value: string, extra?: string) => string;
};

const ML_KINDS: MLKind[] = [
  { id: "website", label: "Website", icon: Globe, placeholder: "https://example.com", build: (v) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://${v.trim()}`) },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "15551234567 (with country code)", extraPlaceholder: "Prefilled message (optional)", build: (v, x) => `https://wa.me/${v.replace(/\D/g, "")}${x?.trim() ? `?text=${encodeURIComponent(x.trim())}` : ""}` },
  { id: "phone", label: "Phone", icon: Phone, placeholder: "+15551234567", build: (v) => `tel:${v.trim()}` },
  { id: "email", label: "Email", icon: Mail, placeholder: "hello@example.com", extraPlaceholder: "Subject (optional)", build: (v, x) => `mailto:${v.trim()}${x?.trim() ? `?subject=${encodeURIComponent(x.trim())}` : ""}` },
  { id: "sms", label: "SMS", icon: MessageSquare, placeholder: "+15551234567", extraPlaceholder: "Message (optional)", build: (v, x) => `sms:${v.trim()}${x?.trim() ? `?body=${encodeURIComponent(x.trim())}` : ""}` },
  { id: "instagram", label: "Instagram", icon: Camera, placeholder: "username", build: (v) => socialUrl("https://instagram.com", v) },
  { id: "facebook", label: "Facebook", icon: Share2, placeholder: "username or page", build: (v) => socialUrl("https://facebook.com", v) },
  { id: "twitter", label: "X / Twitter", icon: Share2, placeholder: "username", build: (v) => socialUrl("https://x.com", v) },
  { id: "youtube", label: "YouTube", icon: Video, placeholder: "https://youtube.com/@channel", build: (v) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://youtube.com/${v.trim().replace(/^@?/, "@")}`) },
  { id: "linkedin", label: "LinkedIn", icon: User, placeholder: "https://linkedin.com/in/username", build: (v) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://linkedin.com/in/${v.trim()}`) },
  { id: "tiktok", label: "TikTok", icon: Video, placeholder: "username", build: (v) => socialUrl("https://tiktok.com/@", v.replace(/^@/, "")) },
  { id: "maps", label: "Maps", icon: MapPin, placeholder: "Address or place name", build: (v) => `https://maps.google.com/?q=${encodeURIComponent(v.trim())}` },
  { id: "upi", label: "UPI Pay", icon: CreditCard, placeholder: "vpa@bank", extraPlaceholder: "Amount (optional)", build: (v, x) => `upi://pay?pa=${v.trim()}${x?.trim() ? `&am=${x.trim()}` : ""}&cu=INR` },
  { id: "custom", label: "Custom URL", icon: Link2, placeholder: "https://…", build: (v) => v.trim() },
];

function mlKind(id: string) {
  return ML_KINDS.find((k) => k.id === id) || ML_KINDS[0];
}

function buildMLUrl(l: MLLink): string {
  return mlKind(l.type).build(l.value || "", l.extra || "");
}

function buildValue(type: QRType, f: Fields): string {
  switch (type) {
    case "website":
      return f.url;
    case "text":
      return f.text;
    case "vcard":
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${f.vcard.name}\nORG:${f.vcard.org}\nTEL:${f.vcard.phone}\nEMAIL:${f.vcard.email}\nEND:VCARD`;
    case "whatsapp":
      return `https://wa.me/${f.whatsapp.phone.replace(/\D/g, "")}?text=${encodeURIComponent(f.whatsapp.message)}`;
    case "phone":
      return `tel:${f.phone}`;
    case "email":
      return `mailto:${f.email.to}?subject=${encodeURIComponent(f.email.subject)}&body=${encodeURIComponent(f.email.body)}`;
    case "sms":
      return `sms:${f.sms.phone}?body=${encodeURIComponent(f.sms.message)}`;
    case "maps":
      return `https://maps.google.com/?q=${encodeURIComponent(f.maps.query)}`;
    case "upi":
      return `upi://pay?pa=${f.upi.vpa}&pn=${encodeURIComponent(f.upi.name)}&am=${f.upi.amount}&cu=INR`;
    case "wifi":
      return `WIFI:T:${f.wifi.encryption};S:${f.wifi.ssid};P:${f.wifi.password};;`;
    case "multilink": {
      const lines = f.multilink.links
        .map((l) => ({ ...l, url: buildMLUrl(l) }))
        .filter((l) => l.url.trim() && !/^https?:\/\/$/i.test(l.url.trim()))
        .map((l) => (l.label.trim() ? `${l.label}: ${l.url}` : l.url));
      return [f.multilink.title.trim(), ...lines].filter(Boolean).join("\n");
    }
    case "facebook":
      return socialUrl("https://facebook.com", f.facebook);
    case "instagram":
      return socialUrl("https://instagram.com", f.instagram);
    case "image":
      return f.image;
    case "video":
      return f.video;
    case "pdf":
      return f.pdf;
  }
}

function GeneratorPage() {
  const [mode, setMode] = useState<"static" | "dynamic">("static");
  const [type, setType] = useState<QRType>("website");
  const [fields, setFields] = useState<Fields>(DEFAULTS);
  const [fg, setFg] = useState("#0b0b12");
  const [bg, setBg] = useState("#ffffff");
  const [size, setSize] = useState(280);
  const [ecl, setEcl] = useState<"L" | "M" | "Q" | "H">("H");
  const [pngUrl, setPngUrl] = useState("");
  const [svgString, setSvgString] = useState("");
  const [dynamicUrl, setDynamicUrl] = useState<string>("");
  const [dynamicKind, setDynamicKind] = useState<"file" | "multilink" | "vcard" | "link">("link");

  const staticValue = useMemo(() => buildValue(type, fields), [type, fields]);
  const value = mode === "dynamic" ? dynamicUrl || "https://uniqr.app" : staticValue;

  useEffect(() => {
    const opts = { width: 1024, margin: 2, color: { dark: fg, light: bg }, errorCorrectionLevel: ecl };
    QRCode.toDataURL(value, opts).then(setPngUrl).catch(() => setPngUrl(""));
    QRCode.toString(value, { ...opts, type: "svg" }).then(setSvgString).catch(() => setSvgString(""));
  }, [value, fg, bg, ecl]);

  const filename = `uniqr-${type}-${Date.now()}`;

  const download = (dataUrl: string, ext: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filename}.${ext}`;
    a.click();
  };

  const downloadSvg = () => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    download(URL.createObjectURL(blob), "svg");
  };

  const downloadPdf = async () => {
    if (!pngUrl) return;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const s = 320;
    pdf.addImage(pngUrl, "PNG", (pageW - s) / 2, 80, s, s);
    pdf.setFontSize(11);
    pdf.setTextColor(80);
    pdf.text(value.substring(0, 90), pageW / 2, 80 + s + 32, { align: "center" });
    pdf.save(`${filename}.pdf`);
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-8">
          <p className="text-sm font-medium text-primary">Generator</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Create your QR in seconds</h1>
          <p className="mt-3 text-muted-foreground">Pick a type, fill the details, customize, and download.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-6">
          {/* Mode */}
          <Panel>
            <Label>QR Mode</Label>
            <div className="inline-flex rounded-xl bg-secondary p-1">
              {(["static", "dynamic"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5 capitalize ${
                    mode === m ? "bg-gradient-brand text-primary-foreground shadow" : "text-muted-foreground"
                  }`}
                >
                  {m === "dynamic" && <Zap className="w-3.5 h-3.5" />}
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {mode === "static"
                ? "Encodes content directly into the QR. Works offline, cannot be edited or tracked."
                : "Upload an image, video, PDF, or file. The QR points to a stable link that opens your file — replaceable anytime without reprinting."}
            </p>
          </Panel>

          {mode === "static" ? (
            <>
          {/* Type */}
          <Panel>
            <Label>QR Type</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
              {TYPES.map((t) => {
                const active = t.key === type;
                return (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition ${
                      active
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Content */}
          <Panel>
            <Label>Content</Label>
            <ContentFields type={type} fields={fields} setFields={setFields} />
          </Panel>
            </>
          ) : (
            <Panel>
              <Label>Dynamic Content</Label>
              <div className="inline-flex rounded-xl bg-secondary p-1 mb-4 flex-wrap gap-1">
                {([
                  { k: "link", label: "Link / Redirect", icon: Zap },
                  { k: "file", label: "File", icon: Upload },
                  { k: "multilink", label: "Multi-Link", icon: Link2 },
                  { k: "vcard", label: "Business Card", icon: User },
                ] as const).map((t) => (
                  <button
                    key={t.k}
                    onClick={() => { setDynamicKind(t.k); setDynamicUrl(""); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5 ${
                      dynamicKind === t.k ? "bg-gradient-brand text-primary-foreground shadow" : "text-muted-foreground"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
              {dynamicKind === "link" && (
                <LinkRedirectForm
                  type={type}
                  setType={setType}
                  fields={fields}
                  setFields={setFields}
                  onCreated={setDynamicUrl}
                  dynamicUrl={dynamicUrl}
                />
              )}
              {dynamicKind === "file" && <DynamicUploader onUploaded={setDynamicUrl} dynamicUrl={dynamicUrl} />}
              {dynamicKind === "multilink" && <MultiLinkForm onCreated={setDynamicUrl} dynamicUrl={dynamicUrl} />}
              {dynamicKind === "vcard" && <VCardForm onCreated={setDynamicUrl} dynamicUrl={dynamicUrl} />}
            </Panel>
          )}

          {/* Design */}
          <Panel>
            <Label>Design</Label>
            <div className="grid sm:grid-cols-2 gap-5 mt-3">
              <ColorInput label="Foreground" value={fg} onChange={setFg} />
              <ColorInput label="Background" value={bg} onChange={setBg} />
              <div>
                <SubLabel>Size ({size}px)</SubLabel>
                <input
                  type="range"
                  min={128}
                  max={512}
                  value={size}
                  onChange={(e) => setSize(+e.target.value)}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <SubLabel>Error correction</SubLabel>
                <select
                  value={ecl}
                  onChange={(e) => setEcl(e.target.value as typeof ecl)}
                  className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm"
                >
                  <option value="L">L — Low (7%)</option>
                  <option value="M">M — Medium (15%)</option>
                  <option value="Q">Q — Quartile (25%)</option>
                  <option value="H">H — High (30%)</option>
                </select>
              </div>
            </div>
          </Panel>
        </div>

        {/* Preview */}
        <aside className="lg:sticky lg:top-24 self-start">
          <Panel>
            <Label>Preview</Label>
            <div className="mt-3 rounded-2xl bg-white p-5 grid place-items-center aspect-square">
              {pngUrl ? (
                <img src={pngUrl} alt="QR" style={{ width: size, height: size, maxWidth: "100%" }} />
              ) : (
                <span className="text-muted-foreground text-sm">Generating…</span>
              )}
            </div>
            <p className="mt-3 text-xs font-mono text-muted-foreground break-all line-clamp-2">{value}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <DlBtn primary onClick={() => download(pngUrl, "png")}>PNG</DlBtn>
              <DlBtn onClick={downloadSvg}>SVG</DlBtn>
              <DlBtn onClick={downloadPdf}>PDF</DlBtn>
            </div>
            {mode === "static" ? (
              <SaveToDashboard type={type} value={value} fg={fg} bg={bg} ecl={ecl} />
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                Dynamic QRs are saved to your dashboard automatically when you upload a file.
              </p>
            )}
          </Panel>
        </aside>
      </section>
    </>
  );
}

const KIND_MAP: Record<string, "image" | "video" | "pdf" | "file"> = {};
function detectKind(file: File): "image" | "video" | "pdf" | "file" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "file";
}

function DynamicUploader({
  onUploaded,
  dynamicUrl,
}: {
  onUploaded: (url: string) => void;
  dynamicUrl: string;
}) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const kind = file ? detectKind(file) : null;

  const upload = async () => {
    if (!file) return toast.error("Choose a file first");
    if (file.size > 50 * 1024 * 1024) return toast.error("File too large (max 50MB)");
    setUploading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) { setUploading(false); return; }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("dynamic-qr")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const label = (name.trim() || file.name).slice(0, 80);
    const { data: row, error: insErr } = await supabase
      .from("dynamic_qrs")
      .insert({
        user_id: user.id,
        name: label,
        file_kind: detectKind(file),
        file_path: path,
        file_url: "",
        mime_type: file.type,
      })
      .select("id")
      .single();
    if (insErr || !row) {
      setUploading(false);
      return toast.error(insErr?.message || "Save failed");
    }
    const shareUrl = `${window.location.origin}/d/${row.id}`;
    await supabase.from("dynamic_qrs").update({ file_url: shareUrl }).eq("id", row.id);
    onUploaded(shareUrl);
    setUploading(false);
    toast.success("Uploaded — your dynamic QR is ready");
  };

  if (signedIn === null) return null;
  if (!signedIn) {
    return (
      <div className="mt-2 rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
        <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link>{" "}
        to create dynamic QR codes that link to your uploaded files.
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-3">
      <div className="grid grid-cols-4 gap-2 text-xs">
        <KindTile icon={ImageIcon} label="Image" />
        <KindTile icon={Video} label="Video" />
        <KindTile icon={FileText} label="PDF" />
        <KindTile icon={FileIcon} label="File" />
      </div>
      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-secondary/30 hover:bg-secondary/50 transition cursor-pointer p-6 text-center">
        <Upload className="w-6 h-6 text-primary" />
        <span className="text-sm font-medium">
          {file ? file.name : "Click to choose an image, video, PDF or file"}
        </span>
        <span className="text-xs text-muted-foreground">Max 50MB</span>
        <input
          type="file"
          accept="image/*,video/*,application/pdf,*/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {file && (
        <p className="text-xs text-muted-foreground">
          Detected as <span className="text-foreground font-medium">{kind}</span> · {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        placeholder="Name (optional)"
        className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
      />
      <button
        onClick={upload}
        disabled={uploading || !file}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-brand text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "Uploading…" : "Upload & generate QR"}
      </button>
      {dynamicUrl && (
        <div className="rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs">
          <div className="flex items-center gap-2">
            <a href={dynamicUrl} target="_blank" rel="noreferrer" className="flex-1 truncate font-mono text-primary hover:underline">
              {dynamicUrl}
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(dynamicUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-secondary hover:bg-secondary/70 px-2 py-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KindTile({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/40 border border-border/60 py-2">
      <Icon className="w-4 h-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}

function SaveToDashboard({
  type, value, fg, bg, ecl,
}: { type: string; value: string; fg: string; bg: string; ecl: "L"|"M"|"Q"|"H" }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const save = async () => {
    const label = name.trim() || `${type} QR`;
    if (!value) return toast.error("Fill in the details first");
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) { setSaving(false); return; }
    const { error } = await supabase.from("saved_qrs").insert({
      user_id: userRes.user.id,
      name: label.slice(0, 80),
      qr_type: type,
      content: { value },
      design: { fg, bg, ecl },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved to dashboard");
    setName("");
  };

  if (signedIn === null) return null;
  if (!signedIn) {
    return (
      <div className="mt-4 rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
        <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link> to save this QR to your dashboard.
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        placeholder="Name (e.g. My website)"
        className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
      />
      <button
        onClick={save}
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save to dashboard"}
      </button>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border/60 bg-card/50 p-6">{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold mb-3">{children}</h2>;
}
function SubLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-muted-foreground mb-1.5">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
    />
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <SubLabel>{label}</SubLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-11 h-10 rounded-lg bg-input border border-border/60 cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function DlBtn({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        primary
          ? "bg-gradient-brand text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
          : "bg-secondary text-foreground hover:bg-secondary/70"
      }`}
    >
      <Download className="w-4 h-4" />
      {children}
    </button>
  );
}

function ContentFields({
  type,
  fields,
  setFields,
}: {
  type: QRType;
  fields: Fields;
  setFields: React.Dispatch<React.SetStateAction<Fields>>;
}) {
  const upd = <K extends keyof Fields>(k: K, v: Fields[K]) => setFields((f) => ({ ...f, [k]: v }));

  switch (type) {
    case "website":
      return (
        <Field label="Website URL">
          <Input value={fields.url} onChange={(e) => upd("url", e.target.value)} placeholder="https://" />
        </Field>
      );
    case "text":
      return (
        <Field label="Text">
          <Textarea rows={3} value={fields.text} onChange={(e) => upd("text", e.target.value)} />
        </Field>
      );
    case "vcard":
      return (
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          <Field label="Name"><Input value={fields.vcard.name} onChange={(e) => upd("vcard", { ...fields.vcard, name: e.target.value })} /></Field>
          <Field label="Organization"><Input value={fields.vcard.org} onChange={(e) => upd("vcard", { ...fields.vcard, org: e.target.value })} /></Field>
          <Field label="Phone"><Input value={fields.vcard.phone} onChange={(e) => upd("vcard", { ...fields.vcard, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={fields.vcard.email} onChange={(e) => upd("vcard", { ...fields.vcard, email: e.target.value })} /></Field>
        </div>
      );
    case "whatsapp":
      return (
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          <Field label="Phone (with country code)"><Input value={fields.whatsapp.phone} onChange={(e) => upd("whatsapp", { ...fields.whatsapp, phone: e.target.value })} /></Field>
          <Field label="Message"><Input value={fields.whatsapp.message} onChange={(e) => upd("whatsapp", { ...fields.whatsapp, message: e.target.value })} /></Field>
        </div>
      );
    case "phone":
      return (
        <Field label="Phone number">
          <Input value={fields.phone} onChange={(e) => upd("phone", e.target.value)} />
        </Field>
      );
    case "email":
      return (
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          <Field label="To"><Input value={fields.email.to} onChange={(e) => upd("email", { ...fields.email, to: e.target.value })} /></Field>
          <Field label="Subject"><Input value={fields.email.subject} onChange={(e) => upd("email", { ...fields.email, subject: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Body"><Textarea rows={3} value={fields.email.body} onChange={(e) => upd("email", { ...fields.email, body: e.target.value })} /></Field>
          </div>
        </div>
      );
    case "sms":
      return (
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          <Field label="Phone"><Input value={fields.sms.phone} onChange={(e) => upd("sms", { ...fields.sms, phone: e.target.value })} /></Field>
          <Field label="Message"><Input value={fields.sms.message} onChange={(e) => upd("sms", { ...fields.sms, message: e.target.value })} /></Field>
        </div>
      );
    case "maps":
      return (
        <Field label="Location / query">
          <Input value={fields.maps.query} onChange={(e) => upd("maps", { query: e.target.value })} />
        </Field>
      );
    case "upi":
      return (
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          <Field label="VPA"><Input value={fields.upi.vpa} onChange={(e) => upd("upi", { ...fields.upi, vpa: e.target.value })} /></Field>
          <Field label="Payee name"><Input value={fields.upi.name} onChange={(e) => upd("upi", { ...fields.upi, name: e.target.value })} /></Field>
          <Field label="Amount (INR)"><Input value={fields.upi.amount} onChange={(e) => upd("upi", { ...fields.upi, amount: e.target.value })} /></Field>
        </div>
      );
    case "wifi":
      return (
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          <Field label="SSID"><Input value={fields.wifi.ssid} onChange={(e) => upd("wifi", { ...fields.wifi, ssid: e.target.value })} /></Field>
          <Field label="Password"><Input value={fields.wifi.password} onChange={(e) => upd("wifi", { ...fields.wifi, password: e.target.value })} /></Field>
          <Field label="Encryption">
            <select
              value={fields.wifi.encryption}
              onChange={(e) => upd("wifi", { ...fields.wifi, encryption: e.target.value as "WPA" | "WEP" | "nopass" })}
              className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm"
            >
              <option value="WPA">WPA / WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">None</option>
            </select>
          </Field>
        </div>
      );
    case "multilink": {
      const setLinks = (links: MLLink[]) =>
        upd("multilink", { ...fields.multilink, links });
      return (
        <div className="mt-2 space-y-3">
          <Field label="Title">
            <Input
              value={fields.multilink.title}
              onChange={(e) => upd("multilink", { ...fields.multilink, title: e.target.value })}
              placeholder="My Links"
            />
          </Field>
          <MultiLinkEditor links={fields.multilink.links} onChange={setLinks} />
          <p className="text-xs text-muted-foreground">
            Static Multi-Link encodes all your links as text inside the QR — no hosting needed. For a hosted linktree-style page with editing and scan analytics, use Dynamic → Multi-Link.
          </p>
        </div>
      );
    }
    case "facebook":
      return (
        <Field label="Facebook username or profile URL">
          <Input value={fields.facebook} onChange={(e) => upd("facebook", e.target.value)} placeholder="uniqr or https://facebook.com/uniqr" />
        </Field>
      );
    case "instagram":
      return (
        <Field label="Instagram username or profile URL">
          <Input value={fields.instagram} onChange={(e) => upd("instagram", e.target.value)} placeholder="uniqr or https://instagram.com/uniqr" />
        </Field>
      );
    case "image":
      return (
        <Field label="Image URL">
          <Input value={fields.image} onChange={(e) => upd("image", e.target.value)} placeholder="https://…/photo.jpg" />
        </Field>
      );
    case "video":
      return (
        <Field label="Video URL">
          <Input value={fields.video} onChange={(e) => upd("video", e.target.value)} placeholder="https://…/clip.mp4 or YouTube link" />
        </Field>
      );
    case "pdf":
      return (
        <Field label="PDF URL">
          <Input value={fields.pdf} onChange={(e) => upd("pdf", e.target.value)} placeholder="https://…/document.pdf" />
        </Field>
      );
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SubLabel>{label}</SubLabel>
      {children}
    </div>
  );
}

function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return signedIn;
}

function SignInPrompt({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
      <Link to="/auth" className="text-primary hover:underline font-medium">Sign in</Link> {children}
    </div>
  );
}

function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  if (!url) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs">
      <div className="flex items-center gap-2">
        <a href={url} target="_blank" rel="noreferrer" className="flex-1 truncate font-mono text-primary hover:underline">{url}</a>
        <button
          onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="inline-flex items-center gap-1 rounded-md bg-secondary hover:bg-secondary/70 px-2 py-1"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function MultiLinkForm({ onCreated, dynamicUrl }: { onCreated: (u: string) => void; dynamicUrl: string }) {
  const signedIn = useSignedIn();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<MLLink[]>([
    { type: "website", label: "Website", value: "https://", extra: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const clean = links
      .map((l) => ({ label: (l.label || mlKind(l.type).label).trim(), url: buildMLUrl(l), type: l.type }))
      .filter((l) => l.label && l.url && !/^https?:\/\/$/i.test(l.url));
    if (clean.length === 0) return toast.error("Add at least one link");
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) { setSaving(false); return; }
    const { data: row, error } = await supabase.from("dynamic_qrs").insert({
      user_id: user.id,
      name: (name.trim() || "My Links").slice(0, 80),
      file_kind: "multilink",
      content: { bio, links: clean },
      mime_type: null,
    }).select("id").single();
    setSaving(false);
    if (error || !row) return toast.error(error?.message || "Save failed");
    const shareUrl = `${window.location.origin}/d/${row.id}`;
    await supabase.from("dynamic_qrs").update({ file_url: shareUrl }).eq("id", row.id);
    onCreated(shareUrl);
    toast.success("Multi-Link QR created");
  };

  if (signedIn === null) return null;
  if (!signedIn) return <SignInPrompt>to create a Multi-Link QR.</SignInPrompt>;

  return (
    <div className="space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Title (e.g. My Links)" maxLength={80}
        className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm" />
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="Short bio (optional)"
        className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm" />
      <MultiLinkEditor links={links} onChange={setLinks} />
      <button onClick={save} disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-brand text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 px-4 py-2.5 text-sm font-medium disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
        {saving ? "Saving…" : "Create Multi-Link QR"}
      </button>
      <ShareLink url={dynamicUrl} />
    </div>
  );
}

function VCardForm({ onCreated, dynamicUrl }: { onCreated: (u: string) => void; dynamicUrl: string }) {
  const signedIn = useSignedIn();
  const [c, setC] = useState({
    fullName: "", title: "", org: "", phone: "", email: "", website: "", address: "", bio: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setC((v) => ({ ...v, [k]: e.target.value }));

  const save = async () => {
    if (!c.fullName.trim()) return toast.error("Name is required");
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) { setSaving(false); return; }
    const { data: row, error } = await supabase.from("dynamic_qrs").insert({
      user_id: user.id,
      name: c.fullName.slice(0, 80),
      file_kind: "vcard",
      content: c,
      mime_type: null,
    }).select("id").single();
    setSaving(false);
    if (error || !row) return toast.error(error?.message || "Save failed");
    const shareUrl = `${window.location.origin}/d/${row.id}`;
    await supabase.from("dynamic_qrs").update({ file_url: shareUrl }).eq("id", row.id);
    onCreated(shareUrl);
    toast.success("Business card QR created");
  };

  if (signedIn === null) return null;
  if (!signedIn) return <SignInPrompt>to create a Digital Business Card QR.</SignInPrompt>;

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input placeholder="Full name" value={c.fullName} onChange={set("fullName")} />
        <Input placeholder="Job title" value={c.title} onChange={set("title")} />
        <Input placeholder="Organization" value={c.org} onChange={set("org")} />
        <Input placeholder="Phone" value={c.phone} onChange={set("phone")} />
        <Input placeholder="Email" value={c.email} onChange={set("email")} />
        <Input placeholder="Website" value={c.website} onChange={set("website")} />
      </div>
      <Input placeholder="Address" value={c.address} onChange={set("address")} />
      <Textarea placeholder="Short bio" rows={2} value={c.bio} onChange={set("bio")} />
      <button onClick={save} disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-brand text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 px-4 py-2.5 text-sm font-medium disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
        {saving ? "Saving…" : "Create Business Card QR"}
      </button>
      <ShareLink url={dynamicUrl} />
    </div>
  );
}

function LinkRedirectForm({
  type,
  setType,
  fields,
  setFields,
  onCreated,
  dynamicUrl,
}: {
  type: QRType;
  setType: (t: QRType) => void;
  fields: Fields;
  setFields: React.Dispatch<React.SetStateAction<Fields>>;
  onCreated: (u: string) => void;
  dynamicUrl: string;
}) {
  const signedIn = useSignedIn();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const target = useMemo(() => buildValue(type, fields), [type, fields]);

  const save = async () => {
    if (!target.trim()) return toast.error("Fill in the details first");
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) { setSaving(false); return; }
    const { data: row, error } = await supabase.from("dynamic_qrs").insert({
      user_id: user.id,
      name: (name.trim() || `${type} QR`).slice(0, 80),
      file_kind: "link",
      content: { value: target, qr_type: type },
      mime_type: null,
    }).select("id").single();
    setSaving(false);
    if (error || !row) return toast.error(error?.message || "Save failed");
    const shareUrl = `${window.location.origin}/d/${row.id}`;
    await supabase.from("dynamic_qrs").update({ file_url: shareUrl }).eq("id", row.id);
    onCreated(shareUrl);
    toast.success("Dynamic link QR created — edit the target anytime");
  };

  if (signedIn === null) return null;
  if (!signedIn) return <SignInPrompt>to create a dynamic link QR you can edit anytime.</SignInPrompt>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Pick any content type — the QR encodes a stable /d/:id URL that redirects to your target. Update the target later without reprinting.
      </p>
      <div>
        <SubLabel>Content type</SubLabel>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TYPES.map((t) => {
            const active = t.key === type;
            return (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] transition ${
                  active
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <ContentFields type={type} fields={fields} setFields={setFields} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        placeholder="Name (optional)"
        className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm"
      />
      <button
        onClick={save}
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-brand text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {saving ? "Saving…" : "Create dynamic QR"}
      </button>
      <ShareLink url={dynamicUrl} />
    </div>
  );
}