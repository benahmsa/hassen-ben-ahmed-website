import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useLanguage } from "@/lib/i18n";
import { PostsManager } from "@/components/admin/PostsManager";
import { InterviewsManager } from "@/components/admin/InterviewsManager";
import { NewsManager } from "@/components/admin/NewsManager";
import { MediaManager } from "@/components/admin/MediaManager";
import { BioManager } from "@/components/admin/BioManager";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Administration - Hassen Ben Ahmed" }, { name: "robots", content: "noindex" }],
  }),
  ssr: false,
  component: AdminPage,
});

const TABS = [
  { id: "posts", label: "Articles / المقالات" },
  { id: "news", label: "Actualités / الأخبار" },
  { id: "media", label: "Archives / الأرشيف" },
  { id: "interviews", label: "Interviews / حوارات" },
  { id: "bio", label: "Biographie / السيرة" },
  { id: "messages", label: "Messages / الرسائل" },
  { id: "users", label: "Admins / المشرفون" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AdminPage() {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabId>("posts");
  const [bootstrapMsg, setBootstrapMsg] = useState<string | null>(null);
  const [becameAdmin, setBecameAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <SiteLayout>
        <div className="container-site py-24 text-center text-muted-foreground">…</div>
      </SiteLayout>
    );
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (!isAdmin && !becameAdmin) {
    const tryBootstrap = async () => {
      const { data, error } = await supabase.rpc("bootstrap_first_admin");
      if (error) {
        setBootstrapMsg("Erreur : " + error.message);
      } else if (data === true) {
        setBecameAdmin(true);
      } else {
        setBootstrapMsg(
          "Un administrateur existe déjà. Demandez-lui de vous ajouter. / يوجد مشرف بالفعل، اطلب منه إضافتك.",
        );
      }
    };

    return (
      <SiteLayout>
        <div className="container-site flex justify-center py-20">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
            <h1 className="font-display text-2xl font-bold">Accès restreint / دخول مقيد</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Votre compte n'a pas le rôle administrateur. Si vous êtes le premier utilisateur du site, activez votre compte administrateur ci-dessous.
            </p>
            <button className={`${btnPrimary} mt-5`} onClick={tryBootstrap}>
              Devenir administrateur / تفعيل حساب المشرف
            </button>
            {bootstrapMsg && <p className="mt-3 text-sm text-muted-foreground">{bootstrapMsg}</p>}
            <button onClick={signOut} className="mt-5 block w-full text-sm text-primary hover:underline">
              {t("signOut")}
            </button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container-site py-10">
        <div className="rule-top flex flex-wrap items-center justify-between gap-3 pt-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t("admin")}</h1>
            <p dir="ltr" className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="text-sm font-semibold text-primary hover:underline">
              {t("navHome")} →
            </Link>
            <button onClick={signOut} className="text-sm font-semibold text-muted-foreground hover:text-primary">
              {t("signOut")}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                tab === tb.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "posts" && <PostsManager />}
          {tab === "news" && <NewsManager />}
          {tab === "media" && <MediaManager />}
          {tab === "interviews" && <InterviewsManager />}
          {tab === "bio" && <BioManager />}
          {tab === "messages" && <MessagesManager />}
          {tab === "users" && <UsersManager currentUserId={session.user.id} />}
        </div>
      </div>
    </SiteLayout>
  );
}
