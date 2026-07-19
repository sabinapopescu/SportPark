import { createServerFn } from "@tanstack/react-start";
import crypto from "node:crypto";
import { z } from "zod";

import { prisma } from "./db";
import { authMiddleware } from "./auth-middleware";
import { decryptPhone, encryptPhone } from "./crypto";
import { ensureVisitorId, getVisitorId } from "./visitor";
import { MOLDOVAN_PHONE_REGEX } from "@/lib/phone";
import type { PublicRegistrant, Registration } from "@/lib/types";

type RegistrationResult = { ok: true; registration: Registration } | { ok: false; reason: string };

const registerSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(2, "Introdu un nume valid.").max(80, "Numele este prea lung."),
  phone: z
    .string()
    .trim()
    .max(30, "Telefon prea lung.")
    .optional()
    .refine((v) => !v || MOLDOVAN_PHONE_REGEX.test(v), {
      message: "Numărul trebuie să înceapă cu 0 și să aibă 9 cifre.",
    }),
  // Hidden form field — bots fill every input, real users never see it.
  honeypot: z.string().optional(),
});

export const createRegistration = createServerFn({ method: "POST" })
  .validator(registerSchema)
  .handler(async ({ data }): Promise<RegistrationResult> => {
    if (data.honeypot) {
      return { ok: false, reason: "Eroare de validare." };
    }

    const visitorId = ensureVisitorId();

    return prisma.$transaction(async (tx) => {
      // Lock the event row so two concurrent submissions against the last
      // open seat can't both pass the capacity check below.
      const rows = await tx.$queryRaw<
        {
          id: string;
          date: string;
          startTime: string;
          registrationDeadline: Date | null;
          maxRegistrations: number;
          deletedAt: Date | null;
        }[]
      >`SELECT id, date, startTime, registrationDeadline, maxRegistrations, deletedAt
        FROM events WHERE id = ${data.eventId} FOR UPDATE`;
      const event = rows[0];
      if (!event || event.deletedAt) {
        return { ok: false, reason: "Evenimentul nu există." };
      }

      const deadline =
        event.registrationDeadline ?? new Date(`${event.date}T${event.startTime}:00`);
      if (deadline.getTime() <= Date.now()) {
        return { ok: false, reason: "Înregistrările sunt închise." };
      }

      const activeCount = await tx.registration.count({
        where: { eventId: event.id, cancelledAt: null },
      });
      if (activeCount >= event.maxRegistrations) {
        return { ok: false, reason: "Din păcate, locurile s-au epuizat." };
      }

      const alreadyRegistered = await tx.registration.findFirst({
        where: { eventId: event.id, visitorId, cancelledAt: null },
      });
      if (alreadyRegistered) {
        return { ok: false, reason: "Ești deja înregistrat la acest eveniment din acest browser." };
      }

      const created = await tx.registration.create({
        data: {
          eventId: event.id,
          name: data.name,
          phone: data.phone ? encryptPhone(data.phone) : null,
          token: crypto.randomBytes(24).toString("base64url"),
          visitorId,
        },
      });

      return {
        ok: true,
        registration: {
          id: created.id,
          eventId: created.eventId,
          token: created.token,
          name: created.name,
          phone: data.phone,
          createdAt: created.createdAt.toISOString(),
        },
      };
    });
  });

// Public roster shown on the event page — names only, never phone numbers.
export const getEventRegistrants = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().min(1) }))
  .handler(async ({ data }): Promise<PublicRegistrant[]> => {
    const regs = await prisma.registration.findMany({
      where: { eventId: data.eventId, cancelledAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, createdAt: true },
    });
    return regs.map((r) => ({ id: r.id, name: r.name, createdAt: r.createdAt.toISOString() }));
  });

// This browser's active registration for an event, if any — lets the event
// page restore the "you're registered" view after a reload without an account.
export const getMyRegistrationForEvent = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().min(1) }))
  .handler(async ({ data }): Promise<Registration | null> => {
    const visitorId = getVisitorId();
    if (!visitorId) return null;
    const reg = await prisma.registration.findFirst({
      where: { eventId: data.eventId, visitorId, cancelledAt: null },
    });
    if (!reg) return null;
    return {
      id: reg.id,
      eventId: reg.eventId,
      token: reg.token,
      name: reg.name,
      phone: reg.phone ? decryptPhone(reg.phone) : undefined,
      createdAt: reg.createdAt.toISOString(),
      cancelledAt: reg.cancelledAt?.toISOString(),
    };
  });

export const getRegistrationByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }) => {
    const reg = await prisma.registration.findUnique({
      where: { token: data.token },
      include: {
        event: { select: { id: true, title: true, date: true, startTime: true, endTime: true } },
      },
    });
    if (!reg) return null;
    return {
      id: reg.id,
      name: reg.name,
      cancelledAt: reg.cancelledAt?.toISOString(),
      event: reg.event,
    };
  });

export const cancelRegistrationByToken = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }) => {
    const reg = await prisma.registration.findUnique({ where: { token: data.token } });
    if (!reg) return { ok: false as const };
    if (!reg.cancelledAt) {
      await prisma.registration.update({
        where: { id: reg.id },
        data: { cancelledAt: new Date() },
      });
    }
    return { ok: true as const };
  });

// Admin roster — includes decrypted phone numbers. Never reachable without a
// valid admin session (authMiddleware enforces this on the handler itself).
export const getEventRegistrationsAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ eventId: z.string().min(1) }))
  .handler(async ({ data }): Promise<Registration[]> => {
    const regs = await prisma.registration.findMany({
      where: { eventId: data.eventId },
      orderBy: { createdAt: "asc" },
    });
    return regs.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      token: r.token,
      name: r.name,
      phone: r.phone ? decryptPhone(r.phone) : undefined,
      createdAt: r.createdAt.toISOString(),
      cancelledAt: r.cancelledAt?.toISOString(),
    }));
  });

export const adminCancelRegistration = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await prisma.registration.update({ where: { id: data.id }, data: { cancelledAt: new Date() } });
    return { ok: true as const };
  });
