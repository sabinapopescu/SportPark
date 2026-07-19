import { queryOptions } from "@tanstack/react-query";

import {
  getEvent,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent as deleteEventFn,
} from "@/server/events.functions";
import {
  createRegistration as createRegistrationFn,
  cancelRegistrationByToken,
  getEventRegistrants,
  getEventRegistrationsAdmin,
  getMyRegistrationForEvent,
  getRegistrationByToken,
  adminCancelRegistration as adminCancelRegistrationFn,
} from "@/server/registrations.functions";
import { login, logout, getSession } from "@/server/auth.functions";
import { uploadBannerImage as uploadBannerImageFn } from "@/server/uploads.functions";
import { getLanguage, setLanguage } from "@/server/language.functions";
import type { Category, Lang, TrainingEvent } from "@/lib/types";

export { CATEGORIES } from "@/lib/types";

// ---- Query options — shared cache keys for loaders (ensureQueryData) and
// components (useSuspenseQuery), so a loader's fetch and a component's read
// hit the exact same cache entry. ----

export const eventsQueryOptions = () =>
  queryOptions({ queryKey: ["events"], queryFn: () => listEvents() });

export const eventQueryOptions = (id: string) =>
  queryOptions({ queryKey: ["events", id], queryFn: () => getEvent({ data: { id } }) });

export const eventRegistrantsQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ["events", eventId, "registrants"],
    queryFn: () => getEventRegistrants({ data: { eventId } }),
  });

export const eventRegistrationsAdminQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ["events", eventId, "registrations-admin"],
    queryFn: () => getEventRegistrationsAdmin({ data: { eventId } }),
  });

export const myRegistrationQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ["events", eventId, "my-registration"],
    queryFn: () => getMyRegistrationForEvent({ data: { eventId } }),
  });

export const registrationByTokenQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ["registrations", "by-token", token],
    queryFn: () => getRegistrationByToken({ data: { token } }),
  });

export const sessionQueryOptions = () =>
  queryOptions({ queryKey: ["session"], queryFn: () => getSession(), staleTime: 0 });

export const languageQueryOptions = () =>
  queryOptions({ queryKey: ["language"], queryFn: () => getLanguage(), staleTime: Infinity });

export function saveLanguage(lang: Lang) {
  return setLanguage({ data: { lang } });
}

// ---- Mutations — thin, ergonomic wrappers around the server functions. ----

export function createRegistration(input: {
  eventId: string;
  name: string;
  phone?: string;
  honeypot?: string;
}) {
  return createRegistrationFn({ data: input });
}

export function cancelRegistration(token: string) {
  return cancelRegistrationByToken({ data: { token } });
}

export function adminCancelRegistration(id: string) {
  return adminCancelRegistrationFn({ data: { id } });
}

export type EventInput = {
  title: string;
  titleRu?: string;
  category: Category;
  description: string;
  descriptionRu?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  coach?: string;
  maxRegistrations: number;
  bannerImage?: string;
  registrationDeadline?: string;
};

export function saveNewEvent(input: EventInput) {
  return createEvent({ data: input });
}

export function saveExistingEvent(id: string, input: EventInput) {
  return updateEvent({ data: { ...input, id } });
}

export function deleteEvent(id: string) {
  return deleteEventFn({ data: { id } });
}

export function adminLogin(email: string, password: string) {
  return login({ data: { email, password } });
}

export function adminLogout() {
  return logout();
}

export function uploadBannerImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return uploadBannerImageFn({ data: formData });
}

// ---- Pure time helpers — no network involved. ----

export function eventStart(ev: TrainingEvent): Date {
  return new Date(`${ev.date}T${ev.startTime}:00`);
}

export function registrationDeadline(ev: TrainingEvent): Date {
  return ev.registrationDeadline ? new Date(ev.registrationDeadline) : eventStart(ev);
}

export function getRemainingMs(ev: TrainingEvent): number {
  return registrationDeadline(ev).getTime() - Date.now();
}

export function isUpcoming(ev: TrainingEvent): boolean {
  return eventStart(ev).getTime() > Date.now();
}

export function newBlankEvent(): EventInput {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    title: "",
    category: "Fitness",
    description: "",
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    startTime: "18:00",
    endTime: "19:00",
    location: "",
    maxRegistrations: 10,
  };
}
