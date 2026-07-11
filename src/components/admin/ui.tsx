import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60";

export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

type TriValue = { ar: string; fr: string; en: string };

export function TriTextField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: TriValue;
  onChange: (v: TriValue) => void;
  rows?: number;
}) {
  const langs: { code: keyof TriValue; name: string; dir: "rtl" | "ltr" }[] = [
    { code: "ar", name: "العربية", dir: "rtl" },
    { code: "fr", name: "Français", dir: "ltr" },
    { code: "en", name: "English", dir: "ltr" },
  ];
  return (
    <div className="rounded-md border border-border p-3">
      <p className="mb-2 text-sm font-bold">{label}</p>
      <div className="space-y-2">
        {langs.map((l) => (
          <div key={l.code}>
            <span className="mb-0.5 block text-[11px] font-semibold text-muted-foreground">
              {l.name}
            </span>
            {rows ? (
              <textarea
                dir={l.dir}
                rows={rows}
                className={inputCls}
                value={value[l.code]}
                onChange={(e) => onChange({ ...value, [l.code]: e.target.value })}
              />
            ) : (
              <input
                dir={l.dir}
                className={inputCls}
                value={value[l.code]}
                onChange={(e) => onChange({ ...value, [l.code]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function emptyTri(): TriValue {
  return { ar: "", fr: "", en: "" };
}

export type { TriValue };
