import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TriTextField, inputCls, btnPrimary, btnGhost, emptyTri, Field, type TriValue } from "./ui";
import { Trash2, Pencil, Plus } from "lucide-react";

type Category = "commentary" | "media";
type Row = {
  id: string;
  youtube_id: string;
  title_ar: string; title_fr: string; title_en: string;
  description_ar: string; description_fr: string; description_en: string;
  published: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  category: Category;
};

// Extract YouTube video id from a full URL or return the id as-is.
function parseYouTubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  // Direct id (11 chars, alnum/_/-)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace(/^\//, "").split("/")[0];
    }
    const v = u.searchParams.get("v");
    if (v) return v;
    // /embed/<id> or /shorts/<id>
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "embed" || p === "shorts");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    // not a URL
  }
  return trimmed;
}

export function InterviewsManager() {
  const qc = useQueryClient();
  const { data: items = [], refetch } = useQuery({
    queryKey: ["admin-interviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const [editing, setEditing] = useState<Row | null | "new">(null);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [title, setTitle] = useState<TriValue>(emptyTri());
  const [description, setDescription] = useState<TriValue>(emptyTri());
  const [sortOrder, setSortOrder] = useState(0);
  const [publishedAt, setPublishedAt] = useState("");
  const [published, setPublished] = useState(true);
  const [category, setCategory] = useState<Category>("media");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openNew = () => {
    setEditing("new");
    setYoutubeInput("");
    setTitle(emptyTri());
    setDescription(emptyTri());
    setSortOrder(0);
    setPublishedAt(toLocalInput(new Date().toISOString()));
    setPublished(true);
    setCategory("media");
    setErr(null);
  };
  const openEdit = (r: Row) => {
    setEditing(r);
    setYoutubeInput(r.youtube_id);
    setTitle({ ar: r.title_ar, fr: r.title_fr, en: r.title_en });
    setDescription({ ar: r.description_ar, fr: r.description_fr, en: r.description_en });
    setSortOrder(r.sort_order);
    setPublishedAt(toLocalInput(r.published_at));
    setPublished(r.published);
    setCategory(r.category ?? "media");
    setErr(null);
  };

  const save = async () => {
    setBusy(true); setErr(null);
    const yt = parseYouTubeId(youtubeInput);
    if (!yt) {
      setBusy(false);
      setErr("Identifiant YouTube invalide / معرّف يوتيوب غير صالح");
      return;
    }
    const payload = {
      youtube_id: yt,
      title_ar: title.ar, title_fr: title.fr, title_en: title.en,
      description_ar: description.ar, description_fr: description.fr, description_en: description.en,
      sort_order: sortOrder,
      published,
      category,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
    };
    const res =
      editing === "new"
        ? await supabase.from("interviews").insert(payload)
        : await supabase.from("interviews").update(payload).eq("id", (editing as Row).id);
    setBusy(false);
    if (res.error) { setErr(res.error.message); return; }
    setEditing(null);
    refetch();
    qc.invalidateQueries({ queryKey: ["interviews-list"] });
  };

  const remove = async (r: Row) => {
    if (!confirm("Supprimer ? / حذف؟")) return;
    await supabase.from("interviews").delete().eq("id", r.id);
    refetch();
    qc.invalidateQueries({ queryKey: ["interviews-list"] });
  };

  if (editing !== null) {
    const previewId = parseYouTubeId(youtubeInput);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">
            {editing === "new" ? "Nouvelle vidéo / فيديو جديد" : "Modifier / تعديل"}
          </h3>
          <button className={btnGhost} onClick={() => setEditing(null)}>← Retour</button>
        </div>

        <Field label="URL ou ID YouTube / رابط يوتيوب">
          <input
            dir="ltr"
            className={inputCls}
            placeholder="https://youtu.be/Q01GPMsaPGU"
            value={youtubeInput}
            onChange={(e) => setYoutubeInput(e.target.value)}
          />
          {previewId && (
            <div className="mt-3 aspect-video w-full max-w-lg overflow-hidden rounded-md bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${previewId}`}
                title="Aperçu"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}
        </Field>

        <TriTextField label="Titre / العنوان" value={title} onChange={setTitle} />
        <TriTextField label="Description / الوصف" value={description} onChange={setDescription} rows={5} />

        <Field label="Date de publication YouTube / تاريخ النشر على يوتيوب">
          <input
            type="datetime-local"
            className={inputCls}
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
        </Field>

        <Field label="Ordre d'affichage / الترتيب">
          <input
            type="number"
            className={inputCls}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          />
        </Field>

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
        <h3 className="font-display text-xl font-bold">Interviews / حوارات</h3>
        <button className={btnPrimary} onClick={openNew}><Plus size={16} /> Nouveau</button>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={`https://i.ytimg.com/vi/${r.youtube_id}/mqdefault.jpg`}
                alt=""
                className="h-14 w-24 shrink-0 rounded object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {r.title_ar || r.title_fr || r.title_en || r.youtube_id}
                </p>
                <p dir="ltr" className="truncate text-xs text-muted-foreground">
                  {r.youtube_id} · {r.published ? "✓ Publié" : "Brouillon"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button className={btnGhost} onClick={() => openEdit(r)}><Pencil size={14} /></button>
              <button className={btnGhost} onClick={() => remove(r)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Aucune vidéo.</p>}
      </div>
    </div>
  );
}
