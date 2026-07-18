import { useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Pagination, usePaged } from "@/components/site/Pagination";
import { useLanguage, localized } from "@/lib/i18n";
import { getInterviewsByCategory } from "@/lib/public-content.functions";

export type InterviewCategory = "commentary" | "media";

export const interviewsListQuery = (category: InterviewCategory) =>
  queryOptions({
    queryKey: ["interviews-list", category],
    queryFn: () => getInterviewsByCategory({ data: { category } }),
  });

export function InterviewsList({ category }: { category: InterviewCategory }) {
  const { data } = useSuspenseQuery(interviewsListQuery(category));
  const { t, lang } = useLanguage();
  const [page, setPage] = useState(1);
  const { pageItems, totalPages, current } = usePaged(data, page);

  if (data.length === 0) {
    return <p className="text-muted-foreground">{t("noContent")}</p>;
  }

  return (
    <>
      <div className="grid gap-10">
        {pageItems.map((v) => {
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
      <Pagination page={current} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
