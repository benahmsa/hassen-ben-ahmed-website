import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Pagination, usePaged } from "@/components/site/Pagination";
import { useLanguage, localized, formatDate } from "@/lib/i18n";
import { breadcrumbLd, buildRouteHead } from "@/lib/seo";


const newsQuery = queryOptions({
  queryKey: ["news-list"],
  queryFn: async () => {
    const { data } = await supabase
      .from("news_items")
      .select("id, title_ar, title_fr, title_en, content_ar, content_fr, content_en, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(60);
    return data ?? [];
  },
});

export const Route = createFileRoute("/news")({
  loader: ({ context }) => context.queryClient.ensureQueryData(newsQuery),
  head: () =>
    buildRouteHead({
      path: "/news",
      title: "Actualités - Hassen Ben Ahmed | أخبار حسن بن أحمد",
      description:
        "Annonces, événements et actualités récentes concernant Hassen Ben Ahmed.",
      jsonLd: [
        breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Actualités", path: "/news" },
        ]),
      ],
    }),
  component: NewsPage,
});


function NewsPage() {
  const news = useSuspenseQuery(newsQuery).data;
  const { t, lang } = useLanguage();
  const [page, setPage] = useState(1);
  const { pageItems, totalPages, current } = usePaged(news, page);

  return (
    <SiteLayout>
      <PageHeader kicker={t("navNews")} title={t("newsTitle")} intro={t("newsIntro")} />
      <div className="container-site max-w-3xl pb-10">
        {news.length === 0 ? (
          <p className="text-muted-foreground">{t("noContent")}</p>
        ) : (
          <>
            <div className="space-y-6">
              {pageItems.map((n) => (
                <article
                  key={n.id}
                  className="rounded-lg border border-border border-s-4 border-s-primary bg-card p-6 shadow-[var(--shadow-card)]"
                >
                  <p className="text-xs text-muted-foreground">{formatDate(n.created_at, lang)}</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">{localized(n, "title", lang)}</h2>
                  <p className="prose-article mt-3 !text-base">{localized(n, "content", lang)}</p>
                </article>
              ))}
            </div>
            <Pagination page={current} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </SiteLayout>
  );
}
