import { createFileRoute } from "@tanstack/react-router";
import { InterviewsList, interviewsListQuery } from "@/components/site/InterviewsList";

export const Route = createFileRoute("/interviews/media")({
  head: () => ({
    meta: [
      { title: "Invitations médias / الظهور الإعلامي - Hassen Ben Ahmed" },
      {
        name: "description",
        content:
          "Entretiens télévisés et radiophoniques où Hassen Ben Ahmed est invité.",
      },
      { property: "og:title", content: "Invitations médias - Hassen Ben Ahmed" },
      {
        property: "og:description",
        content:
          "Entretiens télévisés et radiophoniques où Hassen Ben Ahmed est invité.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(interviewsListQuery("media")),
  component: () => <InterviewsList category="media" />,
});
