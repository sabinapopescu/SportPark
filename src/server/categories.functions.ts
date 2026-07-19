import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";

import { prisma } from "./db";
import { authMiddleware } from "./auth-middleware";
import type { Category } from "@/lib/types";
import type { Category as CategoryRow } from "@/generated/prisma/client";

function toCategory(c: CategoryRow): Category {
  return {
    id: c.id,
    titleRo: c.titleRo,
    titleRu: c.titleRu,
    descriptionRo: c.descriptionRo ?? undefined,
    descriptionRu: c.descriptionRu ?? undefined,
    photo: c.photo ?? undefined,
  };
}

const categoryInputSchema = z.object({
  titleRo: z.string().trim().min(1, "Titlul (RO) este obligatoriu.").max(120),
  titleRu: z.string().trim().min(1, "Titlul (RU) este obligatoriu.").max(120),
  descriptionRo: z.string().max(800).optional(),
  descriptionRu: z.string().max(800).optional(),
  photo: z.string().max(2048).optional(),
});

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { titleRo: "asc" },
  });
  return categories.map(toCategory);
});

export const getCategory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const category = await prisma.category.findUnique({ where: { id: data.id } });
    if (!category || category.deletedAt) throw notFound();
    return toCategory(category);
  });

export const createCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(categoryInputSchema)
  .handler(async ({ data }) => {
    const created = await prisma.category.create({
      data: {
        titleRo: data.titleRo,
        titleRu: data.titleRu,
        descriptionRo: data.descriptionRo?.trim() || null,
        descriptionRu: data.descriptionRu?.trim() || null,
        photo: data.photo || null,
      },
    });
    return toCategory(created);
  });

export const updateCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(categoryInputSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await prisma.category.findUnique({ where: { id: data.id } });
    if (!existing || existing.deletedAt) throw notFound();
    const updated = await prisma.category.update({
      where: { id: data.id },
      data: {
        titleRo: data.titleRo,
        titleRu: data.titleRu,
        descriptionRo: data.descriptionRo?.trim() || null,
        descriptionRu: data.descriptionRu?.trim() || null,
        photo: data.photo || null,
      },
    });
    return toCategory(updated);
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await prisma.category.update({ where: { id: data.id }, data: { deletedAt: new Date() } });
    return { ok: true as const };
  });
