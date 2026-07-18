import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useLanguage, localized, formatDate } from "@/lib/i18n";
import { getHomeData } from "@/lib/public-content.functions";
import heroImg from "@/assets/hero-press.jpg";
import portraitAsset from "@/assets/hassen-portrait.jpg.asset.json";

const homeQuery = queryOptions({
  queryKey: ["home-data"],
  queryFn: () => getHomeData(),
});

import { buildRouteHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: () =>
    buildRouteHead({
      path: "/",
      title: "Hassen Ben Ahmed - Journaliste | حسن بن أحمد",
      description:
        "Site officiel de Hassen Ben Ahmed, journaliste tunisien - arts, culture et sport. Articles, biographie, archives, interviews et actualités.",
      ogType: "website",
      jsonLd: [breadcrumbLd([{ name: "Accueil", path: "/" }])],
    }),
  component: HomePage,
});


function HomePage() {
  const { data } = useSuspenseQuery(homeQuery);
  const { t, lang } = useLanguage();

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroImg}
          alt="Bureau de presse - machine à écrire, micro et journaux"
          width={1920}
          height={1088}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background/95" />
        {/* Subtle portrait fade of the journalist */}
        <img
          src={portraitAsset.url}
          alt="Portrait de Hassen Ben Ahmed"
          aria-hidden="true"
          width={1200}
          height={1600}
          decoding="async"
          className="pointer-events-none absolute inset-y-0 end-0 h-full w-full object-cover object-center opacity-25 mix-blend-luminosity md:w-2/3 md:opacity-40"
          style={{
            WebkitMaskImage:
              "linear-gradient(to left, hsl(0 0% 0% / 0.95) 0%, hsl(0 0% 0% / 0.6) 45%, transparent 85%)",
            maskImage:
              "linear-gradient(to left, hsl(0 0% 0% / 0.95) 0%, hsl(0 0% 0% / 0.6) 45%, transparent 85%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent" />
        <div className="container-site relative flex min-h-[70vh] flex-col justify-center py-20">
          <p className="kicker mb-4">{t("tagline")}</p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/85">
            {t("heroText")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/biography"
              className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
            >
              {t("readBio")}
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center rounded-md border border-foreground/30 bg-card/70 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
            >
              {t("navBlog")}
            </Link>
          </div>
        </div>
      </section>

      {/* Latest posts */}
      <section className="container-site py-14">
        <div className="rule-top flex items-baseline justify-between pt-4">
          <h2 className="font-display text-3xl font-bold">{t("latestPosts")}</h2>
          <Link to="/blog" className="text-sm font-semibold text-primary hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
        {data.posts.length === 0 ? (
          <p className="mt-8 text-muted-foreground">{t("noContent")}</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {data.posts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
              >
                {post.cover_url && (
                  <img
                    src={post.cover_url}
                    alt={localized(post, "title", lang)}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/9] w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(post.published_at ?? post.created_at, lang)}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold leading-snug group-hover:text-primary">
                    {localized(post, "title", lang)}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {localized(post, "excerpt", lang)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* News */}
      <section className="border-y border-border bg-card">
        <div className="container-site py-14">
          <div className="rule-top flex items-baseline justify-between pt-4">
            <h2 className="font-display text-3xl font-bold">{t("latestNews")}</h2>
            <Link to="/news" className="text-sm font-semibold text-primary hover:underline">
              {t("viewAll")} →
            </Link>
          </div>
          {data.news.length === 0 ? (
            <p className="mt-8 text-muted-foreground">{t("noContent")}</p>
          ) : (
            <div className="mt-8 space-y-4">
              {data.news.map((n) => (
                <div key={n.id} className="rounded-md border-s-4 border-primary bg-background p-5">
                  <p className="text-xs text-muted-foreground">{formatDate(n.created_at, lang)}</p>
                  <h3 className="mt-1 font-display text-lg font-bold">
                    {localized(n, "title", lang)}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {localized(n, "content", lang)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Archives preview */}
      <section className="container-site py-14">
        <div className="rule-top flex items-baseline justify-between pt-4">
          <h2 className="font-display text-3xl font-bold">{t("fromArchives")}</h2>
          <Link to="/archives" className="text-sm font-semibold text-primary hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
        {data.media.length === 0 ? (
          <p className="mt-8 text-muted-foreground">{t("noContent")}</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.media.map((m) => (
              <Link key={m.id} to="/archives" className="group overflow-hidden rounded-lg">
                <img
                  src={m.thumbnail_url || m.url}
                  alt={localized(m, "caption", lang)}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
