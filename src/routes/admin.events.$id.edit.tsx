import { createFileRoute } from "@tanstack/react-router";
import { eventQueryOptions } from "@/lib/store";
import { EventForm } from "./admin.events.new";

export const Route = createFileRoute("/admin/events/$id/edit")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(eventQueryOptions(params.id)),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  return <EventForm mode="edit" eventId={id} />;
}
