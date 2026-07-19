import { createFileRoute } from "@tanstack/react-router";
import { categoriesQueryOptions, eventQueryOptions } from "@/lib/store";
import { EventForm } from "./admin.events.new";

export const Route = createFileRoute("/admin/events/$id/edit")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(eventQueryOptions(params.id)),
      context.queryClient.ensureQueryData(categoriesQueryOptions()),
    ]),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  return <EventForm mode="edit" eventId={id} />;
}
