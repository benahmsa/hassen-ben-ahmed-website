import { createFileRoute } from "@tanstack/react-router";
import { InterviewsList, interviewsListQuery } from "@/components/site/InterviewsList";
import { breadcrumbLd, buildRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/interviews/commentary")({
  head: () =>
    buildRouteHead({
      path: "/interviews/commentary",
      title: "Prises de parole - Hassen Ben Ahmed | مداخلات",
      description:
        "Prises de parole et commentaires directs de Hassen Ben Ahmed, face caméra.",
      jsonLd: [
        breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Interviews", path: "/interviews" },
          { name: "Prises de parole", path: "/interviews/commentary" },
        ]),
      ],
    }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(interviewsListQuery("commentary")),
  component: () => <InterviewsList category="commentary" />,
});

