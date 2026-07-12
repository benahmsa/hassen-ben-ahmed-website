import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const RAW_BASE_URL = process.env.SITE_URL || "https://hassenbenahmed.com";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/biography", changefreq: "monthly", priority: "0.8" },
          { path: "/blog", changefreq: "daily", priority: "0.9" },
          { path: "/archives", changefreq: "weekly", priority: "0.7" },
          { path: "/news", changefreq: "daily", priority: "0.8" },
          { path: "/press", changefreq: "monthly", priority: "0.7" },
          { path: "/interviews", changefreq: "weekly", priority: "0.8" },
          { path: "/interviews/commentary", changefreq: "weekly", priority: "0.7" },
          { path: "/interviews/media", changefreq: "weekly", priority: "0.7" },
          { path: "/contact", changefreq: "yearly", priority: "0.5" },
        ];

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
          );
          const { data: posts } = await supabase
            .from("posts")
            .select("slug, updated_at")
            .eq("published", true);
          for (const p of posts ?? []) {
            if (!p.slug) continue;
            entries.push({
              path: `/blog/${p.slug}`,
              changefreq: "monthly",
              priority: "0.7",
              lastmod: p.updated_at?.slice(0, 10),
            });
          }
        } catch {
          // fallback: static entries only
        }

        // Deduplicate by path
        const seen = new Set<string>();
        const unique = entries.filter((e) => {
          if (seen.has(e.path)) return false;
          seen.add(e.path);
          return true;
        });

        const urls = unique.map((e) =>
          [
            `  <url>`,
            `    <loc>${escapeXml(`${BASE_URL}${e.path}`)}</loc>`,
            e.lastmod ? `    <lastmod>${escapeXml(e.lastmod)}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${escapeXml(e.changefreq)}</changefreq>` : null,
            e.priority ? `    <priority>${escapeXml(e.priority)}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
