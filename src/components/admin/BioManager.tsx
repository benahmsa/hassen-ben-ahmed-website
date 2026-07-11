import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TriTextField, btnPrimary, emptyTri, type TriValue } from "./ui";

export function BioManager() {
  const qc = useQueryClient();
  const { data: bio } = useQuery({
    queryKey: ["admin-bio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").eq("key", "biography").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [value, setValue] = useState<TriValue>(emptyTri());
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (bio) setValue({ ar: bio.content_ar, fr: bio.content_fr, en: bio.content_en });
  }, [bio]);

  const save = async () => {
    setBusy(true); setErr(null); setSaved(false);
    const { error } = await supabase.from("site_content").upsert({
      key: "biography",
      content_ar: value.ar,
      content_fr: value.fr,
      content_en: value.en,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setSaved(true);
    qc.invalidateQueries({ queryKey: ["biography"] });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl font-bold">Biographie / السيرة الذاتية</h3>
      <TriTextField label="Texte de la biographie / نص السيرة" value={value} onChange={setValue} rows={14} />
      {err && <p className="text-sm text-destructive">{err}</p>}
      {saved && <p className="rounded-md bg-accent px-3 py-2 text-sm">Enregistré ✓ / تم الحفظ</p>}
      <button className={btnPrimary} disabled={busy} onClick={save}>Enregistrer / حفظ</button>
    </div>
  );
}
