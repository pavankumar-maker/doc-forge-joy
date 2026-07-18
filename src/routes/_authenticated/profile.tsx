import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — UniQR" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uid, setUid] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return;
      setUid(user.id);
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(data?.display_name ?? "");
      setAvatarUrl(data?.avatar_url ?? "");
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName || null, avatar_url: avatarUrl || null })
      .eq("id", uid);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 grid place-items-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm font-medium text-primary">Account</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Profile</h1>
      <p className="mt-2 text-muted-foreground">Update how your account appears across UniQR.</p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card/50 p-6 space-y-5">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border border-border/60" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground">
              <User className="w-6 h-6" />
            </div>
          )}
          <div>
            <p className="font-semibold">{displayName || "Unnamed user"}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Avatar URL</label>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg bg-input border border-border/60 px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </section>
  );
}