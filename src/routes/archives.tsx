import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useLanguage, localized } from "@/lib/i18n";
import { toEmbedUrl } from "@/lib/storage";
import { Play, X } from "lucide-react";

const mediaQuery = queryOptions({
  queryKey: ["media-list"],
  queryFn: async () => {
    const { data } = await supabase
      .from("media_items")
      .select("*")
      .eq("published", true)
      .in("media_type", ["photo", "video"])
      .order("sort_order")
      .order("created_at", { ascending: false });
    return data ?? [];
  },
});

export const Route = createFileRoute("/archives")({
  loader: ({ context }) => context.queryClient.ensureQueryData(mediaQuery),
  head: () => ({
    meta: [
      { title: "Archives - Hassen Ben Ahmed | أرشيف حسن بن أحمد" },
      {
        name: "description",
        content:
          "Photos, vidéos et anecdotes tirées de la carrière du journaliste Hassen Ben Ahmed : presse, télévision, festivals et sport.",
      },
      { property: "og:title", content: "Archives - Hassen Ben Ahmed" },
      { property: "og:description", content: "Photos, vidéos et anecdotes d'une longue carrière de journaliste." },
    ],
  }),
  component: ArchivesPage,
});

type MediaItem = {
  id: string;
  media_type: string;
  url: string;
  thumbnail_url: string | null;
  caption_ar: string;
  caption_fr: string;
  caption_en: string;
};

function ArchivesPage() {
  const items = useSuspenseQuery(mediaQuery).data as MediaItem[];
  const { t, lang } = useLanguage();
  const [selected, setSelected] = useState<MediaItem | null>(null);

  return (
    <SiteLayout>
      <PageHeader kicker={t("navArchives")} title={t("archivesTitle")} intro={t("archivesIntro")} />
      <div className="container-site pb-10">
        {items.length === 0 ? (
          <p className="text-muted-foreground">{t("noContent")}</p>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
            {items.map((item) => {
              const caption = localized(item, "caption", lang);
              const embed = item.media_type === "video" ? toEmbedUrl(item.url) : null;
              return (
                <figure
                  key={item.id}
                  className="break-inside-avoid overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]"
                >
                  {item.media_type === "video" ? (
                    embed ? (
                      <div className="aspect-video w-full">
                        <iframe
                          src={embed}
                          title={caption || t("videoLabel")}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex aspect-video w-full items-center justify-center bg-foreground/90 text-primary-foreground"
                      >
                        <Play size={40} />
                      </a>
                    )
                  ) : (
                    <button className="block w-full" onClick={() => setSelected(item)}>
                      <img
                        src={item.thumbnail_url || item.url}
                        alt={caption}
                        loading="lazy"
                        className="w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                      />
                    </button>
                  )}
                  {caption && (
                    <figcaption className="border-t border-border p-4 text-sm leading-relaxed text-muted-foreground">
                      <span className="kicker me-2">
                        {item.media_type === "video" ? t("videoLabel") : t("photoLabel")}
                      </span>
                      {caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          onClick={() => setSelected(null)}
        >
          <button className="absolute end-4 top-4 text-primary-foreground" aria-label="Close">
            <X size={28} />
          </button>
          <div className="max-h-full max-w-4xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img src={selected.url} alt={localized(selected, "caption", lang)} className="w-full rounded-md" />
            {localized(selected, "caption", lang) && (
              <p className="mt-3 text-center text-sm text-primary-foreground">
                {localized(selected, "caption", lang)}
              </p>
            )}
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
