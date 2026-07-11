import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TriTextField, btnPrimary, btnGhost, emptyTri, type TriValue } from "./ui";
import { Trash2, Pencil, Plus } from "lucide-react";

type NewsRow = {
  id: string;
  title_ar: string; title_fr: string; title_en: string;
  content_ar: string; content_fr: string; content_en: string;
  published: boolean;
  created_at: string;
};

export function NewsManager() {
  const qc = useQueryClient();
  const { data: items = [], refetch } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news_items").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as NewsRow[];
    },
  });

  const [editing, setEditing] = useState<NewsRow | null | "new">(null);
  const [title, setTitle] = useState<TriValue>(emptyTri());
  const [content, setContent] = useState<TriValue>(emptyTri());
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openNew = () => {
    setEditing("new"); setTitle(emptyTri()); setContent(emptyTri()); setPublished(true); setErr(null);
  };
  const openEdit = (n: NewsRow) => {
    setEditing(n);
    setTitle({ ar: n.title_ar, fr: n.title_fr, en: n.title_en });
    setContent({ ar: n.content_ar, fr: n.content_fr, en: n.content_en });
    setPublished(n.published); setErr(null);
  };

  const save = async () => {
    setBusy(true); setErr(null);
    const payload = {
      title_ar: title.ar, title_fr: title.fr, title_en: title.en,
      content_ar: content.ar, content_fr: content.fr, content_en: content.en,
      published,
    };
    const res =
      editing === "new"
        ? await supabase.from("news_items").insert(payload)
        : await supabase.from("news_items").update(payload).eq("id", (editing as NewsRow).id);
    setBusy(false);
    if (res.error) { setErr(res.error.message); return; }
    setEditing(null);
    refetch();
    qc.invalidateQueries({ queryKey: ["news-list"] });
    qc.invalidateQueries({ queryKey: ["home-data"] });
  };

  const remove = async (n: NewsRow) => {
    if (!confirm("Supprimer ? / حذف؟")) return;
    await supabase.from("news_items").delete().eq("id", n.id);
    refetch();
  };

  if (editing !== null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">
            {editing === "new" ? "Nouvelle actualité / خبر جديد" : "Modifier / تعديل"}
          </h3>
          <button className={btnGhost} onClick={() => setEditing(null)}>← Retour</button>
        </div>
        <TriTextField label="Titre / العنوان" value={title} onChange={setTitle} />
        <TriTextField label="Contenu / المحتوى" value={content} onChange={setContent} rows={5} />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publié / منشور
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={btnPrimary} disabled={busy} onClick={save}>Enregistrer / حفظ</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Actualités / الأخبار</h3>
        <button className={btnPrimary} onClick={openNew}><Plus size={16} /> Nouveau</button>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{n.title_ar || n.title_fr || n.title_en}</p>
              <p className="text-xs text-muted-foreground">{n.published ? "✓ Publié" : "Brouillon"}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button className={btnGhost} onClick={() => openEdit(n)}><Pencil size={14} /></button>
              <button className={btnGhost} onClick={() => remove(n)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Aucune actualité.</p>}
      </div>
    </div>
  );
}
