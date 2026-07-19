import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  categoryQueryOptions,
  newBlankCategory,
  saveNewCategory,
  saveExistingCategory,
  uploadCategoryPhoto,
  type CategoryInput,
} from "@/lib/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/admin/categories/new")({
  component: () => <CategoryForm mode="new" />,
});

export function CategoryForm({ mode, categoryId }: { mode: "new" | "edit"; categoryId?: string }) {
  const t = useT();
  if (mode === "edit" && categoryId) {
    return <EditCategoryFormBody categoryId={categoryId} />;
  }
  return (
    <CategoryFormBody
      heading={t.admin.categoryForm.headingNew}
      initial={newBlankCategory()}
      onSave={(input) => saveNewCategory(input)}
    />
  );
}

function EditCategoryFormBody({ categoryId }: { categoryId: string }) {
  const { data } = useSuspenseQuery(categoryQueryOptions(categoryId));
  const t = useT();
  return (
    <CategoryFormBody
      heading={t.admin.categoryForm.headingEdit}
      initial={data}
      onSave={(input) => saveExistingCategory(categoryId, input)}
    />
  );
}

function CategoryFormBody({
  heading,
  initial,
  onSave,
}: {
  heading: string;
  initial: CategoryInput;
  onSave: (input: CategoryInput) => Promise<unknown>;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cat, setCat] = useState<CategoryInput>(initial);
  const [warning, setWarning] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const t = useT();

  const saveMutation = useMutation({
    mutationFn: () => onSave(cat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigate({ to: "/admin/categories" });
    },
    onError: (err) =>
      setWarning(err instanceof Error ? err.message : t.admin.categoryForm.saveError),
  });

  function update<K extends keyof CategoryInput>(k: K, v: CategoryInput[K]) {
    setCat((prev) => ({ ...prev, [k]: v }));
  }

  async function onFile(f: File | null) {
    if (!f) return;
    setWarning(null);
    setUploading(true);
    try {
      const { url } = await uploadCategoryPhoto(f);
      update("photo", url);
    } catch (err) {
      setWarning(err instanceof Error ? err.message : t.admin.categoryForm.uploadError);
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setWarning(null);
    if (!cat.titleRo.trim()) {
      setWarning(t.admin.categoryForm.titleRoRequired);
      return;
    }
    if (!cat.titleRu.trim()) {
      setWarning(t.admin.categoryForm.titleRuRequired);
      return;
    }
    saveMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/admin/categories"
        className="text-xs uppercase tracking-widest text-body-muted hover:text-primary"
      >
        {t.admin.categoryForm.back}
      </Link>
      <h1 className="mt-3 text-3xl">{heading}</h1>

      <form onSubmit={submit} className="card-surface mt-8 space-y-6 p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t.admin.categoryForm.titleRo}>
            <input
              className="input-line"
              required
              maxLength={120}
              value={cat.titleRo}
              onChange={(e) => update("titleRo", e.target.value)}
            />
          </Field>
          <Field label={t.admin.categoryForm.titleRu}>
            <input
              className="input-line"
              required
              maxLength={120}
              value={cat.titleRu}
              onChange={(e) => update("titleRu", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t.admin.categoryForm.descriptionRo}>
            <textarea
              className="input-line min-h-[100px] resize-y"
              maxLength={800}
              value={cat.descriptionRo ?? ""}
              onChange={(e) => update("descriptionRo", e.target.value)}
            />
          </Field>
          <Field label={t.admin.categoryForm.descriptionRu}>
            <textarea
              className="input-line min-h-[100px] resize-y"
              maxLength={800}
              value={cat.descriptionRu ?? ""}
              onChange={(e) => update("descriptionRu", e.target.value)}
            />
          </Field>
        </div>

        <Field label={t.admin.categoryForm.photo}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
            disabled={uploading}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-body file:mr-4 file:cursor-pointer file:rounded-sm file:border file:border-white/20 file:bg-transparent file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-foreground hover:file:border-primary"
          />
          {uploading && (
            <div className="mt-2 text-xs text-body-muted">{t.admin.categoryForm.uploading}</div>
          )}
          {cat.photo && (
            <img
              src={cat.photo}
              alt="preview"
              className="mt-3 aspect-[21/9] w-full rounded-sm object-cover"
            />
          )}
        </Field>

        {warning && <div className="text-sm text-primary">{warning}</div>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending || uploading}
            className="btn-primary"
          >
            {saveMutation.isPending ? t.admin.categoryForm.saving : t.admin.categoryForm.save}
          </button>
          <Link to="/admin/categories" className="btn-ghost">
            {t.admin.categoryForm.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-body-muted">{label}</span>
      {children}
    </label>
  );
}
