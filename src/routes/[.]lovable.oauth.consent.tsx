import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Loader2 } from "lucide-react";

type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string; redirect_uris?: string[] } | null;
  scope?: string | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

interface SupabaseOAuth {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
}
const oauth = (supabase.auth as unknown as { oauth: SupabaseOAuth }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { redirect: next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md rounded-2xl border border-border/60 bg-card/70 p-6 text-center">
        <h1 className="text-lg font-semibold mb-2">Authorization request failed</h1>
        <p className="text-sm text-muted-foreground break-words">{String((error as Error)?.message ?? error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(approve ? "approve" : "deny");
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) { setBusy(null); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(null); setError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an external app";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <main className="relative min-h-screen grid place-items-center px-6 py-16">
      <div className="absolute inset-0 bg-hero pointer-events-none" />
      <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card/70 backdrop-blur p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-brand shadow-lg shadow-primary/20">
            <QrCode className="w-5 h-5 text-primary-foreground" aria-hidden />
          </div>
          <span className="font-semibold">UniQR</span>
        </div>
        <h1 className="text-xl font-semibold">Connect {clientName} to your UniQR account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This lets {clientName} use UniQR as you — reading and managing your saved static QRs, dynamic QRs, and scan analytics.
        </p>
        {scopes.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
            {scopes.map((s: string) => (<li key={s}>• {s}</li>))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          This does not bypass UniQR's permissions — Row-Level Security keeps each user's data private.
        </p>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => decide(false)}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary hover:bg-secondary/70 px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {busy === "deny" && <Loader2 className="w-4 h-4 animate-spin" />}
            Cancel connection
          </button>
          <button
            onClick={() => decide(true)}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-brand text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {busy === "approve" && <Loader2 className="w-4 h-4 animate-spin" />}
            Approve
          </button>
        </div>
      </div>
    </main>
  );
}