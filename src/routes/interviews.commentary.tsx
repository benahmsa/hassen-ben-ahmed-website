import { createFileRoute } from "@tanstack/react-router";
import { InterviewsList, interviewsListQuery } from "@/components/site/InterviewsList";

export const Route = createFileRoute("/interviews/commentary")({
  head: () => ({
    meta: [
      { title: "Prises de parole / مداخلات - Hassen Ben Ahmed" },
      {
        name: "description",
        content:
          "Prises de parole et commentaires directs de Hassen Ben Ahmed, face caméra.",
      },
      { property: "og:title", content: "Prises de parole - Hassen Ben Ahmed" },
      {
        property: "og:description",
        content:
          "Prises de parole et commentaires directs de Hassen Ben Ahmed, face caméra.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(interviewsListQuery("commentary")),
  component: () => <InterviewsList category="commentary" />,
});
