import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { z } from "zod";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useLanguage } from "@/lib/i18n";
import { getTurnstileSiteKey, submitContactMessage } from "@/lib/contact.functions";
import { breadcrumbLd, buildRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    buildRouteHead({
      path: "/contact",
      title: "Contact - Hassen Ben Ahmed | اتصل بحسن بن أحمد",
      description:
        "Écrivez au journaliste Hassen Ben Ahmed via le formulaire de contact sécurisé.",
      jsonLd: [
        breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Contact", path: "/contact" },
        ]),
      ],
    }),
  loader: () => getTurnstileSiteKey(),
  component: ContactPage,
});


const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(200),
  message: z.string().trim().min(1).max(5000),
});

type Status = "idle" | "sending" | "sent" | "error" | "turnstile";

function ContactPage() {
  const { t } = useLanguage();
  const { siteKey } = Route.useLoaderData();
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [token, setToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setStatus("error");
      return;
    }
    if (!token) {
      setStatus("turnstile");
      return;
    }
    setStatus("sending");
    try {
      const res = await submitContactMessage({
        data: { ...parsed.data, turnstileToken: token },
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else if (res.reason === "turnstile") {
        setStatus("turnstile");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setToken("");
      turnstileRef.current?.reset();
    }
  };

  const inputCls =
    "w-full rounded-md border border-input bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

  return (
    <SiteLayout>
      <PageHeader kicker={t("navContact")} title={t("contactTitle")} intro={t("contactIntro")} />
      <div className="container-site max-w-2xl pb-10">
        <form onSubmit={submit} className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("formName")} *</label>
              <input
                className={inputCls}
                value={form.name}
                maxLength={100}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("formEmail")} *</label>
              <input
                type="email"
                className={inputCls}
                value={form.email}
                maxLength={255}
                required
                dir="ltr"
                lang="fr"
                style={{ textAlign: "left" }}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("formSubject")}</label>
            <input
              className={inputCls}
              value={form.subject}
              maxLength={200}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("formMessage")} *</label>
            <textarea
              className={inputCls}
              rows={6}
              value={form.message}
              maxLength={5000}
              required
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          {siteKey ? (
            <Turnstile
              ref={turnstileRef}
              siteKey={siteKey}
              onSuccess={(t) => setToken(t)}
              onExpire={() => setToken("")}
              onError={() => setToken("")}
              options={{ theme: "light" }}
            />
          ) : null}
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex items-center rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {status === "sending" ? "…" : t("formSend")}
          </button>
          {status === "sent" && (
            <p className="rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-foreground">
              {t("formSent")}
            </p>
          )}
          {status === "error" && (
            <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {t("formError")}
            </p>
          )}
          {status === "turnstile" && (
            <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              Veuillez confirmer que vous n'êtes pas un robot. / يرجى تأكيد أنك لست روبوتًا.
            </p>
          )}
        </form>
      </div>
    </SiteLayout>
  );
}
