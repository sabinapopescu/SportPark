import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { categoriesQueryOptions, deleteCategory } from "@/lib/store";
import { useLanguage, useT, categoryLabel } from "@/lib/i18n";

export const Route = createFileRoute("/admin/categories")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  component: CategoriesDashboard,
});

function CategoriesDashboard() {
  const queryClient = useQueryClient();
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { lang } = useLanguage();
  const t = useT();

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary">
            {t.admin.categoriesDashboard.eyebrow}
          </div>
          <h1 className="mt-1 text-3xl">{t.admin.categoriesDashboard.heading}</h1>
        </div>
        <Link to="/admin/categories/new" className="btn-primary">
          {t.admin.categoriesDashboard.newCategory}
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-sm border border-white/5 bg-surface-2 p-10 text-center text-body-muted">
          {t.admin.categoriesDashboard.empty}
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-widest text-body-muted">
              <tr>
                <th className="px-4 py-3">{t.admin.categoriesDashboard.colPhoto}</th>
                <th className="px-4 py-3">{t.admin.categoriesDashboard.colTitleRo}</th>
                <th className="px-4 py-3">{t.admin.categoriesDashboard.colTitleRu}</th>
                <th className="px-4 py-3 text-right">{t.admin.categoriesDashboard.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-white/5 bg-surface hover:bg-surface-2/60">
                  <td className="px-4 py-3">
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt={categoryLabel(c, lang)}
                        className="h-12 w-16 rounded-sm object-cover"
                      />
                    ) : (
                      <div className="h-12 w-16 rounded-sm bg-surface-2" />
                    )}
                  </td>
                  <td className="px-4 py-4 text-body">{c.titleRo}</td>
                  <td className="px-4 py-4 text-body">{c.titleRu}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/admin/categories/$id/edit"
                        params={{ id: c.id }}
                        className="rounded-sm p-2 text-body transition-colors hover:bg-white/5 hover:text-primary"
                        title={t.admin.categoriesDashboard.edit}
                        aria-label={t.admin.categoriesDashboard.edit}
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        className="rounded-sm p-2 text-body transition-colors hover:bg-white/5 hover:text-primary"
                        onClick={() => setConfirmDelete(c.id)}
                        title={t.admin.categoriesDashboard.delete}
                        aria-label={t.admin.categoriesDashboard.delete}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div className="card-surface w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl">{t.admin.categoriesDashboard.deleteConfirmTitle}</h2>
            <p className="mt-2 text-body">{t.admin.categoriesDashboard.deleteConfirmBody}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>
                {t.admin.categoriesDashboard.cancel}
              </button>
              <button
                className="btn-primary"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  deleteMutation.mutate(confirmDelete);
                  setConfirmDelete(null);
                }}
              >
                {t.admin.categoriesDashboard.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
