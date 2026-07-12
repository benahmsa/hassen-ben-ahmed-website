import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Interviews / حوارات - Hassen Ben Ahmed" },
      {
        name: "description",
        content:
          "Prises de parole et invitations médias du journaliste Hassen Ben Ahmed.",
      },
      { property: "og:title", content: "Interviews - Hassen Ben Ahmed" },
      {
        property: "og:description",
        content:
          "Prises de parole et invitations médias du journaliste Hassen Ben Ahmed.",
      },
    ],
  }),
  component: InterviewsLayout,
  errorComponent: () => (
    <SiteLayout>
      <div className="container-site py-16 text-center text-muted-foreground">
        Impossible de charger les interviews pour le moment. Merci de réessayer plus tard.
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-site py-16 text-center">404</div>
    </SiteLayout>
  ),
});

function InterviewsLayout() {
  const { t } = useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const tabs = [
    { to: "/interviews/commentary", label: t("navInterviewsCommentary") },
    { to: "/interviews/media", label: t("navInterviewsMedia") },
  ] as const;

  return (
    <SiteLayout>
      <PageHeader
        kicker={t("navInterviews")}
        title={t("interviewsTitle")}
        intro={t("interviewsIntro")}
      />
      <div className="container-site pb-16">
        <div className="mb-8 flex flex-wrap gap-2 border-b border-border">
          {tabs.map((tab) => {
            const active = pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </div>
    </SiteLayout>
  );
}
