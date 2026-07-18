import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
    ],
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
  | "wifi";

const TYPES: { key: QRType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "website", label: "Website", icon: Globe },
  { key: "text", label: "Text", icon: Type },
  { key: "vcard", label: "vCard", icon: Contact },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
  { key: "maps", label: "Maps", icon: MapPin },
  { key: "upi", label: "UPI", icon: CreditCard },
  { key: "wifi", label: "WiFi", icon: Wifi },
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
};

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

  const value = useMemo(() => buildValue(type, fields), [type, fields]);

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
                : "QR points to a short link you can edit anytime and track scans in real time."}
            </p>
          </Panel>

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
          </Panel>
        </aside>
      </section>
    </>
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