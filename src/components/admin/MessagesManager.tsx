import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btnGhost } from "./ui";
import { Trash2, MailOpen, Mail } from "lucide-react";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function MessagesManager() {
  const { data: messages = [], refetch } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Message[];
    },
  });

  const toggleRead = async (m: Message) => {
    await supabase.from("contact_messages").update({ is_read: !m.is_read }).eq("id", m.id);
    refetch();
  };

  const remove = async (m: Message) => {
    if (!confirm("Supprimer ce message ? / حذف هذه الرسالة؟")) return;
    await supabase.from("contact_messages").delete().eq("id", m.id);
    refetch();
  };

  return (
    <div>
      <h3 className="font-display text-xl font-bold">Messages / الرسائل</h3>
      <div className="mt-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-md border p-4 ${m.is_read ? "border-border bg-card" : "border-primary/40 bg-accent/40"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {m.name} <span dir="ltr" className="text-sm font-normal text-muted-foreground">&lt;{m.email}&gt;</span>
                </p>
                {m.subject && <p className="text-sm font-medium text-primary">{m.subject}</p>}
                <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className={btnGhost} onClick={() => toggleRead(m)} title={m.is_read ? "Marquer non lu" : "Marquer lu"}>
                  {m.is_read ? <Mail size={14} /> : <MailOpen size={14} />}
                </button>
                <button className={btnGhost} onClick={() => remove(m)}><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-muted-foreground">Aucun message.</p>}
      </div>
    </div>
  );
}
