import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadMediaFile } from "@/lib/storage";
import { TriTextField, Field, inputCls, btnPrimary, btnGhost, emptyTri, type TriValue } from "./ui";
import { Trash2, Pencil, Plus } from "lucide-react";

type PostRow = {
  id: string;
  slug: string;
  title_ar: string; title_fr: string; title_en: string;
  excerpt_ar: string; excerpt_fr: string; excerpt_en: string;
  content_ar: string; content_fr: string; content_en: string;
  cover_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

function slugify(s: string) {
  const base = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `post-${Date.now()}`;
}

export function PostsManager() {
  const qc = useQueryClient();
  const { data: posts = [], refetch } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as PostRow[];
    },
  });

  const [editing, setEditing] = useState<PostRow | null | "new">(null);
  const [title, setTitle] = useState<TriValue>(emptyTri());
  const [excerpt, setExcerpt] = useState<TriValue>(emptyTri());
  const [content, setContent] = useState<TriValue>(emptyTri());
  const [slug, setSlug] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openNew = () => {
    setEditing("new");
    setTitle(emptyTri()); setExcerpt(emptyTri()); setContent(emptyTri());
    setSlug(""); setCoverUrl(""); setPublished(true); setErr(null);
  };

  const openEdit = (p: PostRow) => {
    setEditing(p);
    setTitle({ ar: p.title_ar, fr: p.title_fr, en: p.title_en });
    setExcerpt({ ar: p.excerpt_ar, fr: p.excerpt_fr, en: p.excerpt_en });
    setContent({ ar: p.content_ar, fr: p.content_fr, en: p.content_en });
    setSlug(p.slug); setCoverUrl(p.cover_url ?? ""); setPublished(p.published); setErr(null);
  };

  const save = async () => {
    setBusy(true); setErr(null);
    const finalSlug = slug.trim() || slugify(title.fr || title.en || title.ar);
    const payload = {
      slug: finalSlug,
      title_ar: title.ar, title_fr: title.fr, title_en: title.en,
      excerpt_ar: excerpt.ar, excerpt_fr: excerpt.fr, excerpt_en: excerpt.en,
      content_ar: content.ar, content_fr: content.fr, content_en: content.en,
      cover_url: coverUrl || null,
      published,
      published_at: published ? new Date().toISOString() : null,
    };
    const res =
      editing === "new"
        ? await supabase.from("posts").insert(payload)
        : await supabase.from("posts").update(payload).eq("id", (editing as PostRow).id);
    setBusy(false);
    if (res.error) { setErr(res.error.message); return; }
    setEditing(null);
    refetch();
    qc.invalidateQueries({ queryKey: ["posts-list"] });
    qc.invalidateQueries({ queryKey: ["home-data"] });
  };

  const remove = async (p: PostRow) => {
    if (!confirm("Supprimer cet article ? / حذف هذا المقال؟")) return;
    await supabase.from("posts").delete().eq("id", p.id);
    refetch();
  };

  const onCoverFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      setCoverUrl(await uploadMediaFile(file, "covers"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    }
    setBusy(false);
  };

  if (editing !== null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">
            {editing === "new" ? "Nouvel article / مقال جديد" : "Modifier / تعديل"}
          </h3>
          <button className={btnGhost} onClick={() => setEditing(null)}>← Retour</button>
        </div>
        <TriTextField label="Titre / العنوان" value={title} onChange={setTitle} />
        <TriTextField label="Extrait / مقتطف" value={excerpt} onChange={setExcerpt} rows={2} />
        <TriTextField label="Contenu / المحتوى" value={content} onChange={setContent} rows={10} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Slug (URL)">
            <input dir="ltr" className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto" />
          </Field>
          <Field label="Image de couverture / صورة الغلاف">
            <input type="file" accept="image/*" className={inputCls} onChange={(e) => onCoverFile(e.target.files?.[0])} />
            {coverUrl && <img src={coverUrl} alt="" className="mt-2 h-24 rounded-md object-cover" />}
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publié / منشور
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={btnPrimary} disabled={busy} onClick={save}>
          Enregistrer / حفظ
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Articles / المقالات</h3>
        <button className={btnPrimary} onClick={openNew}><Plus size={16} /> Nouveau</button>
      </div>
      <div className="mt-4 space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{p.title_ar || p.title_fr || p.title_en}</p>
              <p className="text-xs text-muted-foreground">
                {p.published ? "✓ Publié" : "Brouillon"} · {p.slug}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button className={btnGhost} onClick={() => openEdit(p)}><Pencil size={14} /></button>
              <button className={btnGhost} onClick={() => remove(p)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-sm text-muted-foreground">Aucun article.</p>}
      </div>
    </div>
  );
}
