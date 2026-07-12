import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Connexion - Hassen Ben Ahmed" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/admin" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Identifiants invalides. / بيانات الدخول غير صحيحة.");
    } else {
      navigate({ to: "/admin" });
    }
    setBusy(false);
  };

  const inputCls =
    "w-full rounded-md border border-input bg-card px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

  return (
    <SiteLayout>
      <div className="container-site flex justify-center py-16">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="rule-top pt-4 font-display text-2xl font-bold">{t("admin")}</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("formEmail")}</label>
              <input
                type="email"
                dir="ltr"
                className={inputCls}
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Mot de passe / كلمة السر
              </label>
              <input
                type="password"
                dir="ltr"
                className={inputCls}
                value={password}
                required
                minLength={8}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {t("signIn")}
            </button>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}
