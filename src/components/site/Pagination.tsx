import { useLanguage } from "@/lib/i18n";

export const PAGE_SIZE = 10;

export function usePaged<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    current,
  };
}

const labels = {
  ar: { prev: "السابق", next: "التالي", page: "صفحة" },
  fr: { prev: "Précédent", next: "Suivant", page: "Page" },
  en: { prev: "Previous", next: "Next", page: "Page" },
} as const;

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: Props) {
  const { lang } = useLanguage();
  const l = labels[lang as keyof typeof labels] ?? labels.fr;
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40";
  const activeBtn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-primary-foreground";

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label={l.page}
    >
      <button
        className={btn}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        <span aria-hidden className="hidden sm:inline">← </span>
        {l.prev}
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? activeBtn : btn}
          onClick={() => onChange(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}
      <button
        className={btn}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        {l.next}
        <span aria-hidden className="hidden sm:inline"> →</span>
      </button>
    </nav>
  );
}
