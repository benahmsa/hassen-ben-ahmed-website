import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Pagination, usePaged } from "@/components/site/Pagination";
import { useLanguage, localized, formatDate } from "@/lib/i18n";
import { breadcrumbLd, buildRouteHead } from "@/lib/seo";


const postsQuery = queryOptions({
  queryKey: ["posts-list"],
  queryFn: async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, slug, title_ar, title_fr, title_en, excerpt_ar, excerpt_fr, excerpt_en, cover_url, published_at, created_at")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(60);
    return data ?? [];
  },
});

export const Route = createFileRoute("/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  head: () =>
    buildRouteHead({
      path: "/blog",
      title: "Blog - Hassen Ben Ahmed | مدونة حسن بن أحمد",
      description:
        "Articles, chroniques et prises de position du journaliste Hassen Ben Ahmed en arabe, français et anglais.",
      jsonLd: [
        breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Blog", path: "/blog" },
        ]),
      ],
    }),
  component: BlogPage,
});


function BlogPage() {
  const posts = useSuspenseQuery(postsQuery).data;
  const { t, lang } = useLanguage();
  const [page, setPage] = useState(1);
  const { pageItems, totalPages, current } = usePaged(posts, page);

  return (
    <SiteLayout>
      <PageHeader kicker={t("navBlog")} title={t("blogTitle")} intro={t("blogIntro")} />
      <div className="container-site pb-10">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">{t("noContent")}</p>
        ) : (
          <>
            <div className="space-y-8">
              {pageItems.map((post) => (
                <Link
                  key={post.id}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group grid gap-5 border-b border-border pb-8 md:grid-cols-[240px_1fr]"
                >
                  {post.cover_url ? (
                    <img
                      src={post.cover_url}
                      alt={localized(post, "title", lang)}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="hidden aspect-[4/3] rounded-md bg-muted md:block" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(post.published_at ?? post.created_at, lang)}
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold leading-snug group-hover:text-primary">
                      {localized(post, "title", lang)}
                    </h2>
                    <p className="mt-3 line-clamp-3 leading-relaxed text-muted-foreground">
                      {localized(post, "excerpt", lang)}
                    </p>
                    <span className="mt-3 inline-block text-sm font-semibold text-primary">
                      {t("readMore")} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination page={current} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </SiteLayout>
  );
}
