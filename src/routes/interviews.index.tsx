import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/interviews/")({
  beforeLoad: () => {
    throw redirect({ to: "/interviews/media" });
  },
});
