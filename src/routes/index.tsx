import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Palette,
  Link2,
  ShieldCheck,
  IdCard,
  Globe,
  MessageCircle,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Video,
  Layers,
  Contact,
  Wifi,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UniQR — One QR code. Infinite destinations." },
      {
        name: "description",
        content:
          "Enterprise-grade platform to generate, customize and track static & dynamic QR codes — websites, payments, vCards, WiFi and more.",
      },
    ],
  }),
  component: LandingPage,
});

const HERO_TABS = [
  { key: "Website", value: "https://uniqr.app" },
  { key: "WhatsApp", value: "https://wa.me/15551234567?text=Hello%20UniQR" },
  { key: "UPI", value: "upi://pay?pa=uniqr@bank&pn=UniQR&am=100&cu=INR" },
  { key: "vCard", value: "BEGIN:VCARD\nVERSION:3.0\nFN:UniQR\nORG:UniQR\nEND:VCARD" },
];

function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Logos />
      <HowItWorks />
      <Quote />
      <QRTypes />
      <CTA />
    </>
  );
}

function Hero() {
  const [tab, setTab] = useState(0);
  const [dataUrl, setDataUrl] = useState<string>("");
  const value = HERO_TABS[tab].value;

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: 512,
      margin: 2,
      color: { dark: "#0b0b12", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setDataUrl);
  }, [value]);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Unified QR Platform · v1.0
          </span>
          <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            One QR code.<br />
            <span className="text-gradient">Infinite destinations.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            UniQR is the enterprise-grade platform to generate, customize, and track static & dynamic
            QR codes — websites, payments, vCards, files and more.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/generator"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 text-sm font-medium text-primary-foreground shadow-xl shadow-primary/20 hover:opacity-90 transition"
            >
              Generate a QR <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-5 py-3 text-sm font-medium hover:bg-card transition"
            >
              Explore features
            </a>
          </div>
          <dl className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
            {[
              ["10M+", "scans tracked"],
              ["50K+", "QRs generated"],
              ["99.99%", "uptime"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-2xl font-semibold text-gradient">{v}</dt>
                <dd className="text-xs text-muted-foreground mt-1">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 shadow-2xl shadow-primary/10">
          <div className="flex flex-wrap gap-2 mb-5">
            {HERO_TABS.map((t, i) => (
              <button
                key={t.key}
                onClick={() => setTab(i)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  i === tab
                    ? "bg-gradient-brand text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.key}
              </button>
            ))}
          </div>
          <div className="aspect-square rounded-2xl bg-white p-6 grid place-items-center">
            {dataUrl && <img src={dataUrl} alt="QR preview" className="w-full h-full" />}
          </div>
          <p className="mt-4 text-xs font-mono text-muted-foreground truncate">{value}</p>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Zap, title: "Static & Dynamic QR", desc: "Create fixed QRs or dynamic ones you can update anytime without reprinting." },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Track scans by location, device, time and referrer with beautiful dashboards." },
  { icon: Palette, title: "Full Customization", desc: "Colors, gradients, logos, frames and shape styles that match your brand." },
  { icon: Link2, title: "Multi-Link QR", desc: "Route one QR to multiple destinations with smart rules and A/B splits." },
  { icon: ShieldCheck, title: "Enterprise Security", desc: "SSO, role-based access, password-protected QRs and audit logs." },
  { icon: IdCard, title: "Digital Business Card", desc: "Share a rich, editable vCard profile from any single QR scan." },
];

function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">
      <p className="text-sm font-medium text-primary">Platform capabilities</p>
      <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
        Everything you need to run QR at scale
      </h2>
      <p className="mt-4 text-muted-foreground max-w-2xl">
        Purpose-built for teams that need reliability, control and insight from every scan.
      </p>
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-border/60 bg-card/50 p-6 hover:border-primary/40 hover:bg-card transition"
          >
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-secondary text-primary group-hover:bg-gradient-brand group-hover:text-primary-foreground transition">
              <f.icon className="w-5 h-5" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Logos() {
  const logos = ["Northwind", "Vertex Labs", "Kairo", "Lumen", "Helix", "Orbita"];
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
        Trusted by fast-moving teams worldwide
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-x-10 gap-y-4 opacity-70">
        {logos.map((l) => (
          <span key={l} className="text-lg font-semibold tracking-tight text-muted-foreground">
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", t: "Choose a type", d: "Pick from 12+ QR types — URL, UPI, WiFi, vCard, WhatsApp and more." },
  { n: "02", t: "Design & customize", d: "Match your brand with colors, logo, frames and error-correction levels." },
  { n: "03", t: "Deploy & track", d: "Download in PNG/SVG/PDF and monitor every scan in real time." },
];

function HowItWorks() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <p className="text-sm font-medium text-primary">How it works</p>
      <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
        Launch a live QR in three steps
      </h2>
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border border-border/60 bg-card/50 p-8">
            <span className="text-5xl font-bold text-gradient">{s.n}</span>
            <h3 className="mt-4 text-xl font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Quote() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16 text-center">
      <p className="text-sm text-primary font-medium">Customer story</p>
      <blockquote className="mt-6 text-2xl md:text-3xl font-semibold tracking-tight leading-snug">
        "UniQR replaced three tools for us. Our marketing team ships branded, trackable QR campaigns
        in minutes — not days. The analytics alone paid for the platform."
      </blockquote>
      <div className="mt-6 text-sm text-muted-foreground">
        <div className="font-semibold text-foreground">Priya Menon</div>
        Head of Growth, Vertex Labs
      </div>
    </section>
  );
}

const QR_TYPES = [
  { icon: Globe, name: "Website" },
  { icon: MessageCircle, name: "WhatsApp" },
  { icon: Phone, name: "Phone" },
  { icon: Mail, name: "Email" },
  { icon: MessageSquare, name: "SMS" },
  { icon: MapPin, name: "Google Maps" },
  { icon: CreditCard, name: "UPI Payment" },
  { icon: FileText, name: "PDF" },
  { icon: ImageIcon, name: "Image" },
  { icon: Video, name: "Video" },
  { icon: Layers, name: "Multi-Link" },
  { icon: Contact, name: "vCard" },
  { icon: Wifi, name: "WiFi" },
];

function QRTypes() {
  return (
    <section id="types" className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
        <div>
          <p className="text-sm font-medium text-primary">12+ QR Types</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Every use case, one platform
          </h2>
        </div>
        <Link
          to="/generator"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-5 py-3 text-sm hover:bg-card transition"
        >
          Try the generator <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {QR_TYPES.map((t) => (
          <div
            key={t.name}
            className="group rounded-2xl border border-border/60 bg-card/50 p-6 flex flex-col items-center gap-3 hover:border-primary/40 hover:bg-card transition"
          >
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-secondary text-primary group-hover:bg-gradient-brand group-hover:text-primary-foreground transition">
              <t.icon className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium">{t.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-12 md:p-16 text-center">
        <div className="absolute inset-0 bg-hero pointer-events-none" />
        <div className="relative">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
            Ready to unify your <span className="text-gradient">QR strategy?</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Launch your first dynamic QR in under a minute. No credit card required.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/generator"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-xl shadow-primary/20 hover:opacity-90 transition"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}