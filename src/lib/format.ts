import type { Lang } from "@/lib/types";

const LOCALE: Record<Lang, string> = { ro: "ro-RO", ru: "ru-RU" };

const COUNTDOWN_UNITS: Record<Lang, { day: string; hour: string; min: string; sec: string }> = {
  ro: { day: "z", hour: "h", min: "min", sec: "s" },
  ru: { day: "д", hour: "ч", min: "мин", sec: "с" },
};

const CLOSED_LABEL: Record<Lang, string> = { ro: "Închis", ru: "Закрыто" };

export function formatDate(dateStr: string, lang: Lang = "ro"): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(LOCALE[lang], { weekday: "long", day: "numeric", month: "long" });
}

export function formatShortDate(dateStr: string, lang: Lang = "ro"): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short" });
}

export function formatCountdown(ms: number, lang: Lang = "ro"): string {
  if (ms <= 0) return CLOSED_LABEL[lang];
  const u = COUNTDOWN_UNITS[lang];
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (days > 0) return `${days}${u.day} ${h}${u.hour} ${m}${u.min}`;
  if (h > 0) return `${h}${u.hour} ${m}${u.min}`;
  if (m > 0) return `${m}${u.min} ${sec}${u.sec}`;
  return `${sec}${u.sec}`;
}

export function formatDateTime(iso: string, lang: Lang = "ro"): string {
  return new Date(iso).toLocaleString(LOCALE[lang]);
}

export function firstNameLastInitial(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
