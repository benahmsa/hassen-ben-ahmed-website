import { createFileRoute } from "@tanstack/react-router";
import { InterviewsList, interviewsListQuery } from "@/components/site/InterviewsList";
import { breadcrumbLd, buildRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/interviews/media")({
  head: () =>
    buildRouteHead({
      path: "/interviews/media",
      title: "Invitations médias - Hassen Ben Ahmed | الظهور الإعلامي",
      description:
        "Entretiens télévisés et radiophoniques où Hassen Ben Ahmed est invité.",
      jsonLd: [
        breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Interviews", path: "/interviews" },
          { name: "Invitations médias", path: "/interviews/media" },
        ]),
      ],
    }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(interviewsListQuery("media")),
  component: () => <InterviewsList category="media" />,
});

