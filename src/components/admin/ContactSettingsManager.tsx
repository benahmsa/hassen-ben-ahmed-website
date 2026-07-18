import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary } from "./ui";

export function ContactSettingsManager() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-contact-recipient"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", "contact_recipient_email")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (data?.content_fr) setEmail(data.content_fr);
  }, [data]);

  const save = async () => {
    setBusy(true);
    setErr(null);
    setSaved(false);
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setBusy(false);
      setErr("Adresse e-mail invalide / بريد إلكتروني غير صالح");
      return;
    }
    const { error } = await supabase.from("site_content").upsert({
      key: "contact_recipient_email",
      content_ar: value,
      content_fr: value,
      content_en: value,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setSaved(true);
    qc.invalidateQueries({ queryKey: ["admin-contact-recipient"] });
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h3 className="font-display text-xl font-bold">
          Paramètres du contact / إعدادات الاتصال
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Adresse e-mail qui reçoit les messages envoyés depuis le formulaire de contact.
          <br />
          البريد الإلكتروني الذي يستقبل الرسائل المرسلة من نموذج الاتصال.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">
          E-mail destinataire / البريد الإلكتروني للمستلم
        </label>
        <input
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
          className="w-full rounded-md border border-input bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
          placeholder="nom@exemple.com"
        />
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      {saved && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm">
          Enregistré ✓ / تم الحفظ
        </p>
      )}
      <button className={btnPrimary} disabled={busy} onClick={save}>
        Enregistrer / حفظ
      </button>
    </div>
  );
}
