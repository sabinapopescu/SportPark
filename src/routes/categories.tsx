import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQueryOptions } from "@/lib/store";
import { useLanguage, useT, categoryLabel, categoryDescription, getDict } from "@/lib/i18n";
import type { Category, Lang } from "@/lib/types";

export const Route = createFileRoute("/categories")({
  head: ({ match }) => {
    const lang = (match.context.queryClient.getQueryData<Lang>(["language"]) ?? "ro") as Lang;
    const t = getDict(lang);
    return { meta: [{ title: `${t.categoriesPage.heading} — SportPark` }] };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const t = useT();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-16">
      <div className="mb-8 md:mb-12">
        <div className="text-xs uppercase tracking-[0.2em] text-primary">
          {t.categoriesPage.eyebrow}
        </div>
        <h1 className="mt-1 max-w-2xl text-4xl md:text-6xl">{t.categoriesPage.heading}</h1>
        <p className="mt-3 max-w-xl text-body">{t.categoriesPage.subtitle}</p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-sm border border-white/5 bg-surface-2 p-10 text-center text-body-muted">
          {t.categoriesPage.empty}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const { lang } = useLanguage();
  const title = categoryLabel(category, lang);
  const description = categoryDescription(category, lang);

  return (
    <div className="card-surface overflow-hidden">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
        {category.photo && (
          <img
            src={category.photo}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-2 text-sm text-body">{description}</p>}
      </div>
    </div>
  );
}
