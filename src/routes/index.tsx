import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, type ElementType } from "react";
import { Flame, Users, CalendarDays } from "lucide-react";
import {
  eventsQueryOptions,
  categoriesQueryOptions,
  getRemainingMs,
  eventStart,
  languageQueryOptions,
} from "@/lib/store";
import { formatShortDate, formatCountdown } from "@/lib/format";
import { useLanguage, useT, categoryLabel, getDict } from "@/lib/i18n";
import type { TrainingEvent, Lang } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: ({ match }) => {
    const lang = (match.context.queryClient.getQueryData<Lang>(["language"]) ?? "ro") as Lang;
    const t = getDict(lang);
    return {
      meta: [{ title: t.meta.title }, { name: "description", content: t.meta.description }],
    };
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(eventsQueryOptions()),
      context.queryClient.ensureQueryData(categoriesQueryOptions()),
    ]),
  component: SchedulePage,
});

type Tab = "today" | "tomorrow" | "week";

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SchedulePage() {
  const { data: events } = useSuspenseQuery(eventsQueryOptions());
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const [tab, setTab] = useState<Tab>("today");
  const t = useT();

  const filtered = useMemo(() => {
    const now = new Date();
    const today = dateKey(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowKey = dateKey(tomorrow);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const upcoming = events
      .filter((e) => eventStart(e).getTime() > now.getTime())
      .sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime());

    if (tab === "today") return upcoming.filter((e) => e.date === today);
    if (tab === "tomorrow") return upcoming.filter((e) => e.date === tomorrowKey);
    return upcoming.filter((e) => eventStart(e) <= weekEnd);
  }, [tab, events]);

  const todayEvents = useMemo(() => {
    const now = new Date();
    const today = dateKey(now);
    return events.filter((e) => e.date === today && eventStart(e).getTime() > now.getTime());
  }, [events]);

  const todayCount = todayEvents.length;

  const seatsToday = useMemo(() => {
    const total = todayEvents.reduce((sum, e) => sum + e.maxRegistrations, 0);
    const taken = todayEvents.reduce((sum, e) => sum + (e.registeredCount ?? 0), 0);
    return { available: Math.max(0, total - taken), total };
  }, [todayEvents]);

  return (
    <div className="relative overflow-hidden">
      {/* Decorative animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="grid-overlay absolute inset-0 h-100 md:h-150" />
        <div
          className="hero-blob -left-16 -top-16 h-48 w-48 bg-primary md:-left-24 md:-top-24 md:h-80 md:w-80"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="hero-blob -right-16 top-6 h-56 w-56 bg-primary/70 md:-right-24 md:top-10 md:h-96 md:w-96"
          style={{ animationDelay: "-4s" }}
        />
        <div
          className="hero-blob left-1/3 top-56 hidden h-72 w-72 bg-red-900/60 md:block"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      {/* Decorative dumbbell — floats gently, faint red glow behind it */}
      <div className="pointer-events-none absolute -right-6 top-16 -z-10 h-40 w-40 sm:top-10 sm:h-56 sm:w-56 md:right-4 md:top-8 md:h-72 md:w-72">
        <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl" />
        <img
          src="/3ganteli-3a1bec7f.webp"
          alt=""
          aria-hidden="true"
          className="decor-float relative h-full w-full object-contain opacity-80 mix-blend-luminosity mask-[radial-gradient(closest-side,black_55%,transparent_88%)] sm:opacity-90"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-16">
        <div className="animate-fade-up mb-8 md:mb-12">
          <h1 className="max-w-xs text-4xl sm:max-w-none md:text-6xl">
            {t.home.titleBase}{" "}
            <span className="text-gradient font-extrabold">{t.home.titleHighlight}</span>
          </h1>
          <p className="mt-3 max-w-xl text-body">{t.home.subtitle}</p>

          <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-2 px-3 py-1.5 text-xs text-body sm:px-4 sm:py-2 sm:text-sm">
              <Flame className="h-4 w-4 shrink-0 text-primary" />
              {t.home.statSessions(todayCount)}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-2 px-3 py-1.5 text-xs text-body sm:px-4 sm:py-2 sm:text-sm">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              {t.home.statSeatsAvailable(seatsToday.available, seatsToday.total)}
            </div>
            <Link
              to="/categories"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-2 px-3 py-1.5 text-xs text-body transition-colors hover:border-primary hover:text-primary sm:px-4 sm:py-2 sm:text-sm"
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              {t.home.statCategories(categories.length)}
            </Link>
          </div>
        </div>

        <div
          className="animate-fade-up no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mb-8 sm:flex-wrap sm:overflow-visible sm:px-0"
          style={{ animationDelay: "0.1s" }}
        >
          {(["today", "tomorrow", "week"] as Tab[]).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`tab-pill shrink-0 whitespace-nowrap ${tab === tb ? "active" : ""}`}
            >
              {tb === "today"
                ? t.home.tabToday
                : tb === "tomorrow"
                  ? t.home.tabTomorrow
                  : t.home.tabWeek}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="animate-fade-up rounded-sm border border-white/5 bg-surface-2 p-8 text-center text-body-muted sm:p-10">
            {t.home.empty}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {filtered.map((ev, i) => (
              <EventCard key={ev.id} ev={ev} delay={i * 0.06} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ ev, delay = 0 }: { ev: TrainingEvent; delay?: number }) {
  const { lang } = useLanguage();
  const t = useT();
  const remaining = getRemainingMs(ev);
  const registered = ev.registeredCount ?? 0;
  const full = registered >= ev.maxRegistrations;
  const closed = remaining <= 0;
  const disabled = full || closed;
  const pct = Math.min(100, Math.round((registered / ev.maxRegistrations) * 100));
  const title = lang === "ru" && ev.titleRu ? ev.titleRu : ev.title;

  const Wrap: ElementType = disabled ? "div" : Link;
  const wrapProps = disabled ? {} : { to: "/event/$id" as const, params: { id: ev.id } };

  return (
    <Wrap
      {...wrapProps}
      className={`card-surface shine-sweep animate-fade-up group block ${disabled ? "opacity-60" : "card-glow"}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
        {ev.bannerImage && (
          <img
            src={ev.bannerImage}
            alt={title}
            className="h-full w-full object-cover opacity-80 transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/0 to-black/0" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="badge-accent">{categoryLabel(ev.category, lang)}</span>
        </div>
        <div className="absolute right-3 top-3">
          {closed ? (
            <span className="badge-muted">{t.home.card.closed}</span>
          ) : full ? (
            <span className="badge-muted">{t.home.card.full}</span>
          ) : (
            <span className="badge-muted">
              {t.home.card.closesIn(formatCountdown(remaining, lang))}
            </span>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="mb-1 text-xs uppercase tracking-widest text-body-muted">
          {formatShortDate(ev.date, lang)} · {ev.startTime}–{ev.endTime}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {ev.coach && <div className="mt-1 text-sm text-body">{t.event.coachLabel(ev.coach)}</div>}

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${full ? "bg-body-muted" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-body-muted">
            {t.home.card.seatsOccupied(registered, ev.maxRegistrations)}
          </div>
          {disabled ? (
            <span className="text-xs font-semibold uppercase tracking-widest text-body-muted">
              {closed ? t.home.card.regClosed : t.home.card.full}
            </span>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-widest text-primary transition-transform group-hover:translate-x-1">
              {t.home.card.regOpen}
            </span>
          )}
        </div>
      </div>
    </Wrap>
  );
}
