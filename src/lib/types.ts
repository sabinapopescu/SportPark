export type Lang = "ro" | "ru";

export type Category = "Fitness" | "CrossFit" | "Pilates" | "Tenis" | "Squash" | "Kids Park";

export const CATEGORIES: Category[] = [
  "Fitness",
  "CrossFit",
  "Pilates",
  "Tenis",
  "Squash",
  "Kids Park",
];

export interface TrainingEvent {
  id: string;
  title: string;
  titleRu?: string;
  category: Category;
  description: string;
  descriptionRu?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  coach?: string;
  maxRegistrations: number;
  bannerImage?: string; // URL
  registrationDeadline?: string; // ISO datetime, optional
  registeredCount?: number; // present on events returned by the API
}

export interface Registration {
  id: string;
  eventId: string;
  token: string; // unique cancel token
  name: string;
  phone?: string;
  createdAt: string; // ISO
  cancelledAt?: string; // ISO
}

// Shape of another attendee shown on the public event page — deliberately
// excludes phone (personal data) and token (the registrant's only credential).
export interface PublicRegistrant {
  id: string;
  name: string;
  createdAt: string;
}
