import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadMediaFile } from "@/lib/storage";
import { TriTextField, Field, inputCls, btnPrimary, btnGhost, emptyTri, type TriValue } from "./ui";
import { Trash2, Pencil, Plus, Film, Image as ImageIcon } from "lucide-react";

type MediaRow = {
  id: string;
  media_type: string;
  url: string;
  thumbnail_url: string | null;
  caption_ar: string; caption_fr: string; caption_en: string;
  sort_order: number;
  published: boolean;
};

export function MediaManager() {
  const qc = useQueryClient();
  const { data: items = [], refetch } = useQuery({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_items").select("*").order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      return data as MediaRow[];
    },
  });

  const [editing, setEditing] = useState<MediaRow | null | "new">(null);
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState<TriValue>(emptyTri());
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openNew = () => {
    setEditing("new"); setMediaType("photo"); setUrl(""); setCaption(emptyTri());
    setSortOrder(0); setPublished(true); setErr(null);
  };
  const openEdit = (m: MediaRow) => {
    setEditing(m);
    setMediaType(m.media_type === "video" ? "video" : "photo");
    setUrl(m.url);
    setCaption({ ar: m.caption_ar, fr: m.caption_fr, en: m.caption_en });
    setSortOrder(m.sort_order); setPublished(m.published); setErr(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      setUrl(await uploadMediaFile(file, "photos"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    }
    setBusy(false);
  };

  const save = async () => {
    if (!url.trim()) { setErr("URL manquante / الرابط مفقود"); return; }
    setBusy(true); setErr(null);
    const payload = {
      media_type: mediaType,
      url: url.trim(),
      caption_ar: caption.ar, caption_fr: caption.fr, caption_en: caption.en,
      sort_order: sortOrder,
      published,
    };
    const res =
      editing === "new"
        ? await supabase.from("media_items").insert(payload)
        : await supabase.from("media_items").update(payload).eq("id", (editing as MediaRow).id);
    setBusy(false);
    if (res.error) { setErr(res.error.message); return; }
    setEditing(null);
    refetch();
    qc.invalidateQueries({ queryKey: ["media-list"] });
    qc.invalidateQueries({ queryKey: ["home-data"] });
  };

  const remove = async (m: MediaRow) => {
    if (!confirm("Supprimer ? / حذف؟")) return;
    await supabase.from("media_items").delete().eq("id", m.id);
    refetch();
  };

  if (editing !== null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">
            {editing === "new" ? "Nouveau média / وسيط جديد" : "Modifier / تعديل"}
          </h3>
          <button className={btnGhost} onClick={() => setEditing(null)}>← Retour</button>
        </div>
        <div className="flex gap-2">
          <button
            className={`${btnGhost} ${mediaType === "photo" ? "!border-primary !text-primary" : ""}`}
            onClick={() => setMediaType("photo")}
          >
            <ImageIcon size={14} /> Photo
          </button>
          <button
            className={`${btnGhost} ${mediaType === "video" ? "!border-primary !text-primary" : ""}`}
            onClick={() => setMediaType("video")}
          >
            <Film size={14} /> Vidéo
          </button>
        </div>
        {mediaType === "photo" ? (
          <Field label="Fichier photo / ملف الصورة">
            <input type="file" accept="image/*" className={inputCls} onChange={(e) => onFile(e.target.files?.[0])} />
            {url && <img src={url} alt="" className="mt-2 h-28 rounded-md object-cover" />}
          </Field>
        ) : (
          <Field label="Lien vidéo (YouTube…) / رابط الفيديو">
            <input dir="ltr" className={inputCls} value={url} placeholder="https://www.youtube.com/watch?v=..." onChange={(e) => setUrl(e.target.value)} />
          </Field>
        )}
        <TriTextField label="Anecdote / légende - الحكاية" value={caption} onChange={setCaption} rows={3} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ordre / الترتيب">
            <input type="number" dir="ltr" className={inputCls} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Publié / منشور
          </label>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className={btnPrimary} disabled={busy} onClick={save}>Enregistrer / حفظ</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Archives / الأرشيف</h3>
        <button className={btnPrimary} onClick={openNew}><Plus size={16} /> Nouveau</button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-md border border-border bg-card">
            {m.media_type === "photo" ? (
              <img src={m.url} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-muted">
                <Film size={30} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex items-center justify-between p-2">
              <span className="text-[11px] text-muted-foreground">
                {m.published ? "✓" : "◌"} {m.media_type}
              </span>
              <div className="flex gap-1">
                <button className={btnGhost} onClick={() => openEdit(m)}><Pencil size={13} /></button>
                <button className={btnGhost} onClick={() => remove(m)}><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Aucun média.</p>}
    </div>
  );
}
