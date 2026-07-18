import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type PublicClient = ReturnType<typeof createClient<Database>>;

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createPublicClient(): PublicClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Backend configuration is missing");
  }

  return createClient<Database>(supabaseUrl, publishableKey, {
    global: { fetch: createSupabaseFetch(publishableKey) },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function fetchHomeData() {
  const supabase = createPublicClient();
  const [posts, news, media] = await Promise.all([
    supabase
      .from("posts")
      .select("id, slug, title_ar, title_fr, title_en, excerpt_ar, excerpt_fr, excerpt_en, cover_url, published_at, created_at")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(3),
    supabase
      .from("news_items")
      .select("id, title_ar, title_fr, title_en, content_ar, content_fr, content_en, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("media_items")
      .select("id, media_type, url, thumbnail_url, caption_ar, caption_fr, caption_en")
      .eq("published", true)
      .eq("media_type", "photo")
      .order("sort_order")
      .limit(4),
  ]);

  if (posts.error) throw posts.error;
  if (news.error) throw news.error;
  if (media.error) throw media.error;

  return {
    posts: posts.data ?? [],
    news: news.data ?? [],
    media: media.data ?? [],
  };
}

export async function fetchBiographyContent() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, content_ar, content_fr, content_en, updated_at")
    .eq("key", "biography")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchNewsItems() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("news_items")
    .select("id, title_ar, title_fr, title_en, content_ar, content_fr, content_en, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return data ?? [];
}

export async function fetchPressItems() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("media_items")
    .select("id, url, thumbnail_url, caption_ar, caption_fr, caption_en")
    .eq("published", true)
    .eq("media_type", "article")
    .order("created_at", { ascending: false })
    .limit(120);
  if (error) throw error;
  return data ?? [];
}

export async function fetchArchiveItems() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("media_items")
    .select("id, media_type, url, thumbnail_url, caption_ar, caption_fr, caption_en")
    .eq("published", true)
    .in("media_type", ["photo", "video"])
    .order("created_at", { ascending: false })
    .limit(120);
  if (error) throw error;
  return data ?? [];
}

export async function fetchBlogPosts() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title_ar, title_fr, title_en, excerpt_ar, excerpt_fr, excerpt_en, cover_url, published_at, created_at")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(60);
  if (error) throw error;
  return data ?? [];
}

export async function fetchBlogPostBySlug(slug: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, slug, title_ar, title_fr, title_en, excerpt_ar, excerpt_fr, excerpt_en, content_ar, content_fr, content_en, cover_url, published_at, updated_at, created_at",
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchInterviewsByCategory(category: "commentary" | "media") {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("interviews")
    .select(
      "id, youtube_id, title_ar, title_fr, title_en, description_ar, description_fr, description_en, published_at, created_at",
    )
    .eq("published", true)
    .eq("category", category)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return data ?? [];
}