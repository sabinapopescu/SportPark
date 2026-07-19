import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  eventQueryOptions,
  eventRegistrantsQueryOptions,
  myRegistrationQueryOptions,
  createRegistration,
  getRemainingMs,
} from "@/lib/store";
import { MOLDOVAN_PHONE_REGEX } from "@/lib/phone";
import { formatDate, formatCountdown, firstNameLastInitial } from "@/lib/format";
import { useLanguage, useT, categoryLabel } from "@/lib/i18n";
import type { Registration } from "@/lib/types";

export const Route = createFileRoute("/event/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(eventQueryOptions(params.id));
    await context.queryClient.ensureQueryData(eventRegistrantsQueryOptions(params.id));
    await context.queryClient.ensureQueryData(myRegistrationQueryOptions(params.id));
  },
  component: EventDetail,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-body-muted">{error.message}</div>
  ),
  notFoundComponent: () => <EventNotFound />,
});

function EventNotFound() {
  const t = useT();
  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl">{t.event.notFoundTitle}</h1>
      <Link to="/" className="btn-ghost mt-4 inline-flex">
        {t.event.notFoundBack}
      </Link>
    </div>
  );
}

function EventDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: ev } = useSuspenseQuery(eventQueryOptions(id));
  const { data: regs } = useSuspenseQuery(eventRegistrantsQueryOptions(id));
  // Restores the "you're registered" view across reloads/new tabs — the
  // server matches it via a per-browser cookie, no account needed.
  const { data: myReg } = useSuspenseQuery(myRegistrationQueryOptions(id));
  const { lang } = useLanguage();
  const t = useT();

  const title = lang === "ru" && ev.titleRu ? ev.titleRu : ev.title;
  const description = lang === "ru" && ev.descriptionRu ? ev.descriptionRu : ev.description;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justConfirmed, setJustConfirmed] = useState<Registration | null>(null);
  const confirmed = justConfirmed ?? myReg;
  const [, tick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const registerMutation = useMutation({
    mutationFn: createRegistration,
    onSuccess: (res) => {
      if (!res.ok) {
        setError(res.reason);
        return;
      }
      setJustConfirmed(res.registration);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const remaining = getRemainingMs(ev);
  const full = (ev.registeredCount ?? 0) >= ev.maxRegistrations;
  const closed = remaining <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError(t.event.errNameInvalid);
      return;
    }
    if (name.trim().length > 80) {
      setError(t.event.errNameTooLong);
      return;
    }
    if (phone && phone.length > 30) {
      setError(t.event.errPhoneTooLong);
      return;
    }
    if (phone && !MOLDOVAN_PHONE_REGEX.test(phone)) {
      setError(t.event.errPhoneInvalid);
      return;
    }
    try {
      await registerMutation.mutateAsync({ eventId: ev.id, name, phone, honeypot });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.event.errGeneric);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10 md:py-14">
      <Link to="/" className="text-xs uppercase tracking-widest text-body-muted hover:text-primary">
        {t.event.back}
      </Link>

      <div className="card-surface mt-4 overflow-hidden sm:mt-6">
        {ev.bannerImage && (
          <div className="relative aspect-4/3 w-full overflow-hidden bg-black sm:aspect-video md:aspect-21/9">
            <img src={ev.bannerImage} alt={title} className="h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-linear-to-t from-surface-2 via-transparent" />
            <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
              <span className="badge-accent">{categoryLabel(ev.category, lang)}</span>
            </div>
          </div>
        )}
        <div className="p-5 sm:p-6 md:p-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl">{title}</h1>
          <div className="mt-2 text-body">
            {formatDate(ev.date, lang)} · {ev.startTime}–{ev.endTime}
          </div>
          <div className="mt-1 text-sm text-body-muted">
            {ev.location}
            {ev.coach ? ` · ${t.event.coachLabel(ev.coach)}` : ""}
          </div>

          <p className="mt-5 max-w-2xl text-body sm:mt-6">{description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
            <span className="badge-muted">
              {t.event.seatsOccupied(ev.registeredCount ?? 0, ev.maxRegistrations)}
            </span>
            {closed ? (
              <span className="badge-muted">{t.event.regClosed}</span>
            ) : full ? (
              <span className="badge-muted">{t.event.full}</span>
            ) : (
              <span className="badge-accent">{t.event.closesIn(formatCountdown(remaining, lang))}</span>
            )}
          </div>

          <div className="mt-8 grid gap-8 sm:mt-10 sm:gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                {confirmed ? t.event.headingConfirm : t.event.headingRegister}
              </h2>

              {confirmed ? (
                <div>
                  <div className="text-xl sm:text-2xl">{t.event.confirmedTitle}</div>
                  <p className="mt-2 text-body">
                    {t.event.confirmedBody(title, formatDate(ev.date, lang), ev.startTime)}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      to="/cancel/$token"
                      params={{ token: confirmed.token }}
                      className="btn-primary text-center"
                    >
                      {t.event.cancelRegistration}
                    </Link>
                    <Link to="/" className="btn-ghost text-center">
                      {t.event.backHome}
                    </Link>
                  </div>
                </div>
              ) : closed || full ? (
                <div className="rounded-sm border border-white/10 bg-surface p-5 text-body sm:p-6">
                  {closed ? t.event.closedMsg : t.event.fullMsg}
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <input
                    type="text"
                    aria-hidden="true"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="hidden"
                  />
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-body-muted">
                      {t.event.nameLabel}
                    </label>
                    <input
                      className="input-line"
                      required
                      maxLength={80}
                      placeholder={t.event.namePlaceholder}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest text-body-muted">
                      {t.event.phoneLabel}
                    </label>
                    <input
                      type="tel"
                      className="input-line"
                      maxLength={9}
                      pattern="0[0-9]{8}"
                      placeholder={t.event.phonePlaceholder}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    />
                  </div>
                  {error && <div className="text-sm text-primary">{error}</div>}
                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {registerMutation.isPending ? t.event.sending : t.event.submit}
                  </button>
                </form>
              )}
            </div>

            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                {t.event.registrantsHeading}
              </h2>
              {regs.length === 0 ? (
                <div className="text-body-muted">{t.event.registrantsEmpty}</div>
              ) : (
                <ul className="space-y-2">
                  {regs.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-sm border border-white/5 bg-surface px-4 py-3 text-sm"
                    >
                      {confirmed && confirmed.id === r.id ? (
                        <span className="text-foreground">
                          {r.name} <span className="text-primary">{t.event.you}</span>
                        </span>
                      ) : (
                        <span className="text-body">{firstNameLastInitial(r.name)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
