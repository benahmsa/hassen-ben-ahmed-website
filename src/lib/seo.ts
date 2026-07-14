// Centralized SEO helpers. Absolute URLs for canonical / og:image / og:url are
// required by social crawlers. `SITE_URL` is a server env; on the browser we
// fall back to the same canonical origin so SSR and hydrated markup match.
//
// Note on hreflang: the site currently serves all three languages (ar / fr / en)
// from the same URL — the active language is client-only state. Emitting hreflang
// against a single URL would be invalid, so we intentionally do NOT ship
// hreflang tags. True hreflang requires distinct localized URLs (e.g. /fr, /en,
// /ar prefixes) and is a separate migration.

import ogDefaultAsset from "@/assets/og-default.jpg.asset.json";
import portraitAsset from "@/assets/hassen-portrait.jpg.asset.json";

const FALLBACK_ORIGIN = "https://hassenbenahmed.com";

function resolveSiteUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env?.SITE_URL) || FALLBACK_ORIGIN;
  return raw.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "Hassen Ben Ahmed";
export const DEFAULT_LOCALE = "fr_FR";
export const ALT_LOCALES = ["ar_TN", "en_GB"] as const;

export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path.replace(/\/+$/, "") || "/"}`;
}

export const DEFAULT_OG_IMAGE = absoluteUrl(ogDefaultAsset.url);
export const PORTRAIT_URL = absoluteUrl(portraitAsset.url);

type MetaEntry =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

type LinkEntry = {
  rel: string;
  href: string;
  hrefLang?: string;
  as?: string;
  fetchpriority?: "high" | "low" | "auto";
  crossOrigin?: "anonymous" | "use-credentials";
  type?: string;
};

type ScriptEntry = { type: string; children: string };

export interface RouteHeadInput {
  /** Route path such as "/", "/blog", "/blog/my-slug". */
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "article" | "profile";
  /** Absolute or relative image URL. Falls back to DEFAULT_OG_IMAGE. */
  image?: string | null;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  noindex?: boolean;
  locale?: string;
  /** Extra meta entries (e.g. article:published_time). */
  extraMeta?: MetaEntry[];
  /** Additional JSON-LD blocks. Serialized safely. */
  jsonLd?: Array<Record<string, unknown>>;
}

export interface RouteHead {
  meta: MetaEntry[];
  links: LinkEntry[];
  scripts?: ScriptEntry[];
}

/** Safe JSON stringify for inline <script type="application/ld+json">. */
export function jsonLdString(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildRouteHead(input: RouteHeadInput): RouteHead {
  const url = absoluteUrl(input.path);
  const image = absoluteUrl(input.image || DEFAULT_OG_IMAGE);
  const ogType = input.ogType ?? "website";
  const locale = input.locale ?? DEFAULT_LOCALE;
  const imageAlt = input.imageAlt ?? `${SITE_NAME} - ${input.title}`;
  const imageWidth = input.imageWidth ?? 1200;
  const imageHeight = input.imageHeight ?? 630;

  const meta: MetaEntry[] = [
    { title: input.title },
    { name: "description", content: input.description },

    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: locale },
    { property: "og:type", content: ogType },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:width", content: String(imageWidth) },
    { property: "og:image:height", content: String(imageHeight) },
    { property: "og:image:alt", content: imageAlt },

    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
  ];

  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  if (input.extraMeta && input.extraMeta.length > 0) {
    meta.push(...input.extraMeta);
  }

  const links: LinkEntry[] = input.noindex
    ? []
    : [{ rel: "canonical", href: url }];

  const scripts: ScriptEntry[] | undefined =
    input.jsonLd && input.jsonLd.length > 0
      ? input.jsonLd.map((node) => ({
          type: "application/ld+json",
          children: jsonLdString(node),
        }))
      : undefined;

  const head: RouteHead = { meta, links };
  if (scripts) head.scripts = scripts;
  return head;
}

// --- Reusable JSON-LD builders --------------------------------------------

const AUTHOR_DESCRIPTION_FR =
  "Journaliste tunisien, arts, culture et sport. Plus de trente ans au journal Al Bayane.";

export const PERSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE_NAME,
  alternateName: "حسن بن أحمد",
  url: SITE_URL,
  image: PORTRAIT_URL,
  description: AUTHOR_DESCRIPTION_FR,
} as const;

export const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: ["fr", "ar", "en"],
  publisher: { "@id": `${SITE_URL}/#organization` },
} as const;

// Organization node representing the site itself. Kept minimal and factual:
// no sameAs until the user provides officially-owned social profiles.
export const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: PORTRAIT_URL,
  image: DEFAULT_OG_IMAGE,
} as const;

export function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
