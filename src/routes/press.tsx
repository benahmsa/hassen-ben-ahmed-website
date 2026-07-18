import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { X } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useLanguage, localized } from "@/lib/i18n";
import { Pagination, usePaged } from "@/components/site/Pagination";
import { breadcrumbLd, buildRouteHead } from "@/lib/seo";
import { getPressItems } from "@/lib/public-content.functions";


const pressQuery = queryOptions({
  queryKey: ["press-list"],
  queryFn: () => getPressItems(),
});

export const Route = createFileRoute("/press")({
  loader: ({ context }) => context.queryClient.ensureQueryData(pressQuery),
  head: () =>
    buildRouteHead({
      path: "/press",
      title: "Presse - Al Bayane | Hassen Ben Ahmed",
      description:
        "Sélection d'articles et d'entretiens signés Hassen Ben Ahmed, parus dans le journal tunisien Al Bayane.",
      jsonLd: [
        breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Presse", path: "/press" },
        ]),
      ],
    }),
  component: PressPage,
});


type Item = {
  id: string;
  url: string;
  thumbnail_url: string | null;
  caption_ar: string;
  caption_fr: string;
  caption_en: string;
};

function PressPage() {
  const items = useSuspenseQuery(pressQuery).data as Item[];
  const { t, lang } = useLanguage();
  const [selected, setSelected] = useState<Item | null>(null);
  const [page, setPage] = useState(1);
  const { pageItems, totalPages, current } = usePaged(items, page);

  return (
    <SiteLayout>
      <PageHeader kicker={t("navPress")} title={t("pressTitle")} intro={t("pressIntro")} />
      <div className="container-site pb-10">
        {items.length === 0 ? (
          <p className="text-muted-foreground">{t("noContent")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((item) => {
                const caption = localized(item, "caption", lang);
                return (
                  <figure
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]"
                  >
                    <button
                      className="block w-full bg-muted"
                      onClick={() => setSelected(item)}
                      aria-label={caption}
                    >
                      <img
                        src={item.thumbnail_url || item.url}
                        alt={caption}
                        loading="lazy"
                        className="h-72 w-full object-cover object-top transition-transform duration-300 hover:scale-[1.02]"
                      />
                    </button>
                    <figcaption className="border-t border-border p-4 text-sm leading-relaxed text-muted-foreground">
                      <span className="kicker me-2">{t("articleLabel")}</span>
                      {caption}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
            <Pagination page={current} totalPages={totalPages} onChange={setPage} />
          </>
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
          <div
            className="max-h-full max-w-5xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.url}
              alt={localized(selected, "caption", lang)}
              className="w-full rounded-md"
            />
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
