import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useLanguage, localized, formatDate } from "@/lib/i18n";

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      return data;
    },
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params, context }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title_fr || loaderData.title_ar} — Hassen Ben Ahmed` },
          { name: "description", content: (loaderData.excerpt_fr || loaderData.excerpt_ar).slice(0, 155) },
          { property: "og:title", content: loaderData.title_fr || loaderData.title_ar },
          { property: "og:description", content: (loaderData.excerpt_fr || loaderData.excerpt_ar).slice(0, 155) },
          { property: "og:type", content: "article" },
          ...(loaderData.cover_url ? [{ property: "og:image", content: loaderData.cover_url }] : []),
        ]
      : [],
  }),
  notFoundComponent: PostNotFound,
  component: PostPage,
});

function PostNotFound() {
  return (
    <SiteLayout>
      <div className="container-site py-24 text-center">
        <h1 className="font-display text-4xl font-bold">404</h1>
        <Link to="/blog" className="mt-4 inline-block text-primary hover:underline">
          ← Blog
        </Link>
      </div>
    </SiteLayout>
  );
}

function PostPage() {
  const { slug } = Route.useParams();
  const post = useSuspenseQuery(postQuery(slug)).data;
  const { t, lang } = useLanguage();

  if (!post) return <PostNotFound />;

  return (
    <SiteLayout>
      <article className="container-site max-w-3xl py-12">
        <Link to="/blog" className="text-sm font-semibold text-primary hover:underline">
          ← {t("backToBlog")}
        </Link>
        <div className="rule-top mt-4 pt-5">
          <p className="text-sm text-muted-foreground">
            {formatDate(post.published_at ?? post.created_at, lang)}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-5xl">
            {localized(post, "title", lang)}
          </h1>
        </div>
        {post.cover_url && (
          <img
            src={post.cover_url}
            alt={localized(post, "title", lang)}
            className="mt-8 w-full rounded-lg object-cover"
          />
        )}
        <div className="prose-article mt-8">{localized(post, "content", lang)}</div>
      </article>
    </SiteLayout>
  );
}
