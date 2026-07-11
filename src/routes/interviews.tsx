import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useLanguage, localized } from "@/lib/i18n";

const interviewsQuery = queryOptions({
  queryKey: ["interviews-list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("interviews")
      .select("id, youtube_id, title_ar, title_fr, title_en, description_ar, description_fr, description_en, created_at")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Interviews / حوارات - Hassen Ben Ahmed" },
      {
        name: "description",
        content:
          "Entretiens télévisés et interviews vidéo avec le journaliste Hassen Ben Ahmed.",
      },
      { property: "og:title", content: "Interviews - Hassen Ben Ahmed" },
      {
        property: "og:description",
        content:
          "Entretiens télévisés et interviews vidéo avec le journaliste Hassen Ben Ahmed.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(interviewsQuery),
  component: InterviewsPage,
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="container-site py-16 text-center text-destructive">{error.message}</div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-site py-16 text-center">404</div>
    </SiteLayout>
  ),
});

function InterviewsPage() {
  const { data } = useSuspenseQuery(interviewsQuery);
  const { t, lang } = useLanguage();

  return (
    <SiteLayout>
      <PageHeader
        kicker={t("navInterviews")}
        title={t("interviewsTitle")}
        intro={t("interviewsIntro")}
      />
      <div className="container-site pb-16">
        {data.length === 0 ? (
          <p className="text-muted-foreground">{t("noContent")}</p>
        ) : (
          <div className="grid gap-10">
            {data.map((v) => {
              const title = localized(v, "title", lang);
              const description = localized(v, "description", lang);
              return (
                <article
                  key={v.id}
                  className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]"
                >
                  <div className="relative aspect-video w-full bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${v.youtube_id}`}
                      title={title || "Interview"}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                  <div className="p-5 md:p-6">
                    {title && (
                      <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>
                    )}
                    {description && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground md:text-base">
                        {description}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
