import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useLanguage, type Lang, type DictKey } from "@/lib/i18n";

const NAV: { key: DictKey; to: string }[] = [
  { key: "navHome", to: "/" },
  { key: "navBlog", to: "/blog" },
  { key: "navBio", to: "/biography" },
  { key: "navArchives", to: "/archives" },
  { key: "navInterviews", to: "/interviews" },
  { key: "navPress", to: "/press" },
  { key: "navNews", to: "/news" },
  { key: "navContact", to: "/contact" },
];

const LANGS: { code: Lang; label: string }[] = [
  { code: "ar", label: "عربي" },
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
];

export function SiteLayout({ children }: { children: ReactNode }) {
  const { lang, setLang, t, dir } = useLanguage();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div dir={dir} className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container-site flex flex-col gap-2 py-3 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
          {/* Mobile: controls (menu + lang) at start, title at end. Desktop: title, nav, langs at end. */}
          <div className="order-1 flex items-center justify-between gap-2 lg:order-none lg:contents">
            <div className="flex items-center gap-1 lg:order-3">
              <button
                className="rounded-md p-2 text-foreground lg:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-label="Menu"
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>

              <div className="relative">
                <select
                  aria-label="Language"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="appearance-none rounded-md border border-border bg-card px-3 py-1.5 pe-7 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-muted-foreground"
                >
                  ▾
                </span>
              </div>
            </div>

            <Link
              to="/"
              className="block min-w-0 text-end lg:order-1 lg:flex-none lg:text-start"
            >
              <span className="block font-display text-lg font-bold leading-tight text-foreground sm:text-xl">
                {t("siteName")}
              </span>
              <span className="block text-[11px] leading-snug tracking-wide text-muted-foreground">
                {t("tagline")}
              </span>
            </Link>

            <nav className="hidden items-center gap-6 lg:order-2 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.to ? "text-primary" : "text-foreground"
                  }`}
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border bg-card lg:hidden">
            <div className="container-site flex flex-col py-2">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`border-b border-border/60 py-3 text-sm font-medium last:border-0 ${
                    pathname === item.to ? "text-primary" : "text-foreground"
                  }`}
                >
                  {t(item.key)}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t-4 border-foreground bg-card">
        <div className="container-site flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="text-center md:text-start">
            <p className="font-display text-lg font-bold">{t("siteName")}</p>
            <p className="text-sm text-muted-foreground">{t("tagline")}</p>
          </div>
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:gap-5">
            <div className="flex items-center gap-5">
              <Link to="/contact" className="hover:text-primary">
                {t("navContact")}
              </Link>
              <Link to="/auth" className="hover:text-primary">
                {t("admin")}
              </Link>
            </div>
            <span className="text-center text-xs md:text-sm">
              © {new Date().getFullYear()} · {t("footerRights")}
            </span>

          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ kicker, title, intro }: { kicker?: string; title: string; intro?: string }) {
  return (
    <div className="container-site pt-12 pb-8">
      <div className="rule-top pt-5">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="font-display text-4xl font-bold md:text-5xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{intro}</p>}
      </div>
    </div>
  );
}
