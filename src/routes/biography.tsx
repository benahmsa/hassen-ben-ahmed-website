import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useLanguage, localized } from "@/lib/i18n";

const bioQuery = queryOptions({
  queryKey: ["biography"],
  queryFn: async () => {
    const { data } = await supabase
      .from("site_content")
      .select("*")
      .eq("key", "biography")
      .maybeSingle();
    return data;
  },
});

export const Route = createFileRoute("/biography")({
  loader: ({ context }) => context.queryClient.ensureQueryData(bioQuery),
  head: () => ({
    meta: [
      { title: "Biographie - Hassen Ben Ahmed | سيرة حسن بن أحمد" },
      {
        name: "description",
        content:
          "Parcours du journaliste tunisien Hassen Ben Ahmed : presse écrite, pages arts et culture, football, télévision et festivals.",
      },
      { property: "og:title", content: "Biographie - Hassen Ben Ahmed" },
      { property: "og:description", content: "Le parcours du journaliste tunisien Hassen Ben Ahmed depuis 1979." },
    ],
  }),
  component: BiographyPage,
});

const MILESTONES = [
  { year: "1979", ar: "بداية المسيرة في الصحافة المكتوبة", fr: "Débuts dans la presse écrite", en: "Career start in print journalism" },
  { year: "1982", ar: "الترسيم في جريدة «البيان» - صفحات الفنون والثقافة", fr: "Titularisation à « Al Bayane » - pages arts et culture", en: "Permanent role at “Al Bayane” - arts & culture pages" },
  { year: "1986", ar: "من مؤسسي مهرجان الأغنية التونسية", fr: "Co-fondateur du Festival de la Chanson", en: "Co-founder of the Song Festival" },
  { year: "1999", ar: "إصدار كتاب عن الراحل نجيب الخطاب", fr: "Publication d'un livre sur Najib El Khattab", en: "Published a book on Najib El Khattab" },
  { year: "2013", ar: "نهاية مرحلة «البيان» بعد أكثر من 30 سنة", fr: "Fin du chapitre « Al Bayane » après plus de 30 ans", en: "End of the “Al Bayane” chapter after 30+ years" },
];

function BiographyPage() {
  const bio = useSuspenseQuery(bioQuery).data;
  const { t, lang } = useLanguage();

  return (
    <SiteLayout>
      <PageHeader kicker={t("siteName")} title={t("bioTitle")} intro={t("tagline")} />
      <div className="container-site grid gap-10 pb-10 lg:grid-cols-[1fr_300px]">
        <article className="prose-article max-w-3xl">
          {bio ? localized(bio, "content", lang) : t("noContent")}
        </article>
        <aside className="h-fit rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="rule-top pt-3 font-display text-xl font-bold">
            {lang === "ar" ? "محطات بارزة" : lang === "fr" ? "Repères" : "Milestones"}
          </h2>
          <ul className="mt-4 space-y-4">
            {MILESTONES.map((m) => (
              <li key={m.year} className="flex gap-3">
                <span className="font-display text-lg font-bold text-primary">{m.year}</span>
                <span className="pt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {m[lang]}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </SiteLayout>
  );
}
