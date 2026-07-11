import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact - Hassen Ben Ahmed | اتصل بحسن بن أحمد" },
      {
        name: "description",
        content: "Contactez le journaliste Hassen Ben Ahmed via le formulaire de contact.",
      },
      { property: "og:title", content: "Contact - Hassen Ben Ahmed" },
      { property: "og:description", content: "Formulaire de contact du journaliste Hassen Ben Ahmed." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(200),
  message: z.string().trim().min(1).max(5000),
});

function ContactPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    if (error) {
      setStatus("error");
    } else {
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
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
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex items-center rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {t("formSend")}
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
        </form>
      </div>
    </SiteLayout>
  );
}
