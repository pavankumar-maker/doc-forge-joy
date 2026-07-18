import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { QrCode, LayoutGrid } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "UniQR — One QR code. Infinite destinations." },
      { name: "description", content: "Enterprise-grade platform to generate, customize and track static & dynamic QR codes — websites, payments, vCards, WiFi and more." },
      { name: "author", content: "UniQR" },
      { property: "og:title", content: "UniQR — One QR code. Infinite destinations." },
      { property: "og:description", content: "Enterprise-grade platform to generate, customize and track static & dynamic QR codes — websites, payments, vCards, WiFi and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "UniQR — One QR code. Infinite destinations." },
      { name: "twitter:description", content: "Enterprise-grade platform to generate, customize and track static & dynamic QR codes — websites, payments, vCards, WiFi and more." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/906aaa2a-4998-4912-ba68-1ee6fe8ef95d/id-preview-9d2279be--e6720110-ea92-43ce-b546-f7cf81680d1e.lovable.app-1784361550744.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/906aaa2a-4998-4912-ba68-1ee6fe8ef95d/id-preview-9d2279be--e6720110-ea92-43ce-b546-f7cf81680d1e.lovable.app-1784361550744.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </QueryClientProvider>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-gradient-brand shadow-lg shadow-primary/20">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </span>
          <span className="font-semibold text-lg tracking-tight">UniQR<span className="text-primary">.</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="/#features" className="hover:text-foreground transition">Features</a>
          <a href="/#types" className="hover:text-foreground transition">QR Types</a>
          <Link to="/generator" className="hover:text-foreground transition">Generator</Link>
        </nav>
        <Link
          to="/generator"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition"
        >
          <LayoutGrid className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/50 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-md bg-gradient-brand">
            <QrCode className="w-4 h-4 text-primary-foreground" />
          </span>
          <span>© {new Date().getFullYear()} UniQR. All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <a href="/#features" className="hover:text-foreground">Features</a>
          <Link to="/generator" className="hover:text-foreground">Generator</Link>
        </div>
      </div>
    </footer>
  );
}
