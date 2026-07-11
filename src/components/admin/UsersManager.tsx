import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminUsers, setAdminByEmail } from "@/lib/admin.functions";
import { Field, inputCls, btnPrimary, btnGhost } from "./ui";
import { ShieldCheck, ShieldOff } from "lucide-react";

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const listFn = useServerFn(listAdminUsers);
  const setFn = useServerFn(setAdminByEmail);

  const { data: users = [], refetch, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn(),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const grant = async () => {
    if (!email.trim()) return;
    setBusy(true); setMsg(null); setErr(null);
    try {
      const res = await setFn({
        data: { email: email.trim(), grant: true, password: password.trim() || undefined },
      });
      if (!res.ok && res.reason === "not_found") {
        setErr("Utilisateur introuvable. Fournissez un mot de passe pour créer le compte. / المستخدم غير موجود؛ أدخل كلمة سر لإنشاء الحساب.");
      } else {
        setMsg("Administrateur ajouté ✓ / تمت إضافة المشرف");
        setEmail(""); setPassword("");
        refetch();
      }
    } catch {
      setErr("Erreur / خطأ");
    }
    setBusy(false);
  };

  const revoke = async (userEmail: string) => {
    if (!confirm(`Retirer le rôle admin de ${userEmail} ?`)) return;
    setBusy(true); setMsg(null); setErr(null);
    try {
      const res = await setFn({ data: { email: userEmail, grant: false } });
      if (!res.ok && res.reason === "self") {
        setErr("Vous ne pouvez pas retirer votre propre rôle. / لا يمكنك سحب صلاحياتك.");
      } else {
        refetch();
      }
    } catch {
      setErr("Erreur / خطأ");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-bold">Administrateurs / المشرفون</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajoutez un administrateur par e-mail. Si le compte n'existe pas encore, indiquez aussi un mot de passe pour le créer.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="E-mail">
            <input dir="ltr" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Mot de passe (si nouveau compte)">
            <input dir="ltr" type="password" className={inputCls} value={password} minLength={8} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </div>
        <button className={`${btnPrimary} mt-3`} disabled={busy} onClick={grant}>
          <ShieldCheck size={16} /> Ajouter comme admin / إضافة كمشرف
        </button>
        {msg && <p className="mt-2 rounded-md bg-accent px-3 py-2 text-sm">{msg}</p>}
        {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
            <div className="min-w-0">
              <p dir="ltr" className="truncate text-sm font-semibold">{u.email}</p>
              <p className="text-xs text-muted-foreground">
                {u.isAdmin ? "Administrateur" : "Utilisateur"} · {new Date(u.createdAt).toLocaleDateString()}
                {u.id === currentUserId && " · (vous)"}
              </p>
            </div>
            {u.isAdmin && u.id !== currentUserId && (
              <button className={btnGhost} disabled={busy} onClick={() => revoke(u.email)}>
                <ShieldOff size={14} /> Retirer
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
