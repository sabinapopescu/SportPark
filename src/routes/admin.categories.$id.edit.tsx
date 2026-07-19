import { createFileRoute } from "@tanstack/react-router";
import { categoryQueryOptions } from "@/lib/store";
import { CategoryForm } from "./admin.categories.new";

export const Route = createFileRoute("/admin/categories/$id/edit")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(categoryQueryOptions(params.id)),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  return <CategoryForm mode="edit" categoryId={id} />;
}
