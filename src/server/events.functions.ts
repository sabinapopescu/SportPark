import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";

import { prisma } from "./db";
import { authMiddleware } from "./auth-middleware";
import type { TrainingEvent } from "@/lib/types";
import type { Event as EventRow, Category as CategoryRow } from "@/generated/prisma/client";

function toTrainingEvent(
  ev: EventRow & { category: CategoryRow },
  registeredCount: number,
): TrainingEvent {
  return {
    id: ev.id,
    title: ev.title,
    titleRu: ev.titleRu ?? undefined,
    categoryId: ev.categoryId,
    category: {
      id: ev.category.id,
      titleRo: ev.category.titleRo,
      titleRu: ev.category.titleRu,
      descriptionRo: ev.category.descriptionRo ?? undefined,
      descriptionRu: ev.category.descriptionRu ?? undefined,
      photo: ev.category.photo ?? undefined,
    },
    description: ev.description,
    descriptionRu: ev.descriptionRu ?? undefined,
    date: ev.date,
    startTime: ev.startTime,
    endTime: ev.endTime,
    location: ev.location,
    coach: ev.coach ?? undefined,
    maxRegistrations: ev.maxRegistrations,
    bannerImage: ev.bannerImage ?? undefined,
    registrationDeadline: ev.registrationDeadline
      ? ev.registrationDeadline.toISOString()
      : undefined,
    registeredCount,
  };
}

const eventInputSchema = z.object({
  title: z.string().trim().min(1, "Titlul este obligatoriu.").max(120),
  titleRu: z.string().trim().max(120).optional(),
  categoryId: z.string().min(1, "Categoria este obligatorie."),
  description: z.string().max(800).optional().default(""),
  descriptionRu: z.string().max(800).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Oră invalidă."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Oră invalidă."),
  location: z.string().max(120).optional().default(""),
  coach: z.string().max(80).optional(),
  maxRegistrations: z.number().int().min(1).max(500),
  bannerImage: z.string().max(2048).optional(),
  registrationDeadline: z.string().datetime().optional(),
});

export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: { category: true },
  });
  const counts = await prisma.registration.groupBy({
    by: ["eventId"],
    where: { cancelledAt: null, eventId: { in: events.map((e) => e.id) } },
    _count: { _all: true },
  });
  const countByEvent = new Map(counts.map((c) => [c.eventId, c._count._all]));
  return events.map((e) => toTrainingEvent(e, countByEvent.get(e.id) ?? 0));
});

export const getEvent = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const event = await prisma.event.findUnique({
      where: { id: data.id },
      include: { category: true },
    });
    if (!event || event.deletedAt) throw notFound();
    const registeredCount = await prisma.registration.count({
      where: { eventId: event.id, cancelledAt: null },
    });
    return toTrainingEvent(event, registeredCount);
  });

export const createEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(eventInputSchema)
  .handler(async ({ data }) => {
    const created = await prisma.event.create({
      data: {
        title: data.title,
        titleRu: data.titleRu?.trim() || null,
        categoryId: data.categoryId,
        description: data.description ?? "",
        descriptionRu: data.descriptionRu?.trim() || null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location ?? "",
        coach: data.coach?.trim() || null,
        maxRegistrations: data.maxRegistrations,
        bannerImage: data.bannerImage || null,
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline)
          : null,
      },
      include: { category: true },
    });
    return toTrainingEvent(created, 0);
  });

export const updateEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(eventInputSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await prisma.event.findUnique({ where: { id: data.id } });
    if (!existing || existing.deletedAt) throw notFound();
    const updated = await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title,
        titleRu: data.titleRu?.trim() || null,
        categoryId: data.categoryId,
        description: data.description ?? "",
        descriptionRu: data.descriptionRu?.trim() || null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location ?? "",
        coach: data.coach?.trim() || null,
        maxRegistrations: data.maxRegistrations,
        bannerImage: data.bannerImage || null,
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline)
          : null,
      },
      include: { category: true },
    });
    const registeredCount = await prisma.registration.count({
      where: { eventId: updated.id, cancelledAt: null },
    });
    return toTrainingEvent(updated, registeredCount);
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await prisma.event.update({ where: { id: data.id }, data: { deletedAt: new Date() } });
    return { ok: true as const };
  });
