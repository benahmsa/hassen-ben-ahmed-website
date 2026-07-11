import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Connexion — Hassen Ben Ahmed" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/admin" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) setError(error.message);
      else setInfo("Vérifiez votre boîte e-mail pour confirmer votre compte. / تحقق من بريدك الإلكتروني لتأكيد حسابك.");
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
          <div className="mt-5 flex overflow-hidden rounded-md border border-border text-sm font-semibold">
            <button
              className={`flex-1 py-2 ${mode === "login" ? "bg-primary text-primary-foreground" : "bg-background"}`}
              onClick={() => setMode("login")}
            >
              {t("signIn")}
            </button>
            <button
              className={`flex-1 py-2 ${mode === "signup" ? "bg-primary text-primary-foreground" : "bg-background"}`}
              onClick={() => setMode("signup")}
            >
              Inscription / تسجيل
            </button>
          </div>
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
              {mode === "login" ? t("signIn") : "Créer le compte / إنشاء الحساب"}
            </button>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            {info && <p className="rounded-md bg-accent px-3 py-2 text-sm">{info}</p>}
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}
