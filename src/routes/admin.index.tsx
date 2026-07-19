import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Pencil, Share2, Trash2, Users } from "lucide-react";
import { eventsQueryOptions, eventStart, deleteEvent } from "@/lib/store";
import { formatShortDate } from "@/lib/format";
import { useLanguage, useT, categoryLabel } from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQueryOptions()),
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const { data: eventsRaw } = useSuspenseQuery(eventsQueryOptions());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { lang } = useLanguage();
  const t = useT();

  const events = [...eventsRaw].sort((a, b) => eventStart(b).getTime() - eventStart(a).getTime());

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  function copyShare(id: string) {
    const url = `${window.location.origin}/event/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary">
            {t.admin.dashboard.eyebrow}
          </div>
          <h1 className="mt-1 text-3xl">{t.admin.dashboard.heading}</h1>
        </div>
        <Link to="/admin/events/new" className="btn-primary">
          {t.admin.dashboard.newEvent}
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-sm border border-white/5 bg-surface-2 p-10 text-center text-body-muted">
          {t.admin.dashboard.empty}
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-widest text-body-muted">
              <tr>
                <th className="px-4 py-3">{t.admin.dashboard.colTitle}</th>
                <th className="px-4 py-3">{t.admin.dashboard.colDate}</th>
                <th className="px-4 py-3">{t.admin.dashboard.colCategory}</th>
                <th className="px-4 py-3">{t.admin.dashboard.colSeats}</th>
                <th className="px-4 py-3">{t.admin.dashboard.colStatus}</th>
                <th className="px-4 py-3 text-right">{t.admin.dashboard.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const regs = ev.registeredCount ?? 0;
                const past = eventStart(ev).getTime() < Date.now();
                const full = regs >= ev.maxRegistrations;
                return (
                  <tr
                    key={ev.id}
                    className="border-t border-white/5 bg-surface hover:bg-surface-2/60"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">{ev.title}</div>
                      <div className="text-xs text-body-muted">{ev.location}</div>
                    </td>
                    <td className="px-4 py-4 text-body">
                      {formatShortDate(ev.date, lang)} · {ev.startTime}
                    </td>
                    <td className="px-4 py-4 text-body">{categoryLabel(ev.category, lang)}</td>
                    <td className="px-4 py-4 text-body">
                      {regs}/{ev.maxRegistrations}
                    </td>
                    <td className="px-4 py-4">
                      {past ? (
                        <span className="badge-muted">{t.admin.dashboard.statusPast}</span>
                      ) : full ? (
                        <span className="badge-muted">{t.admin.dashboard.statusFull}</span>
                      ) : (
                        <span className="badge-accent">{t.admin.dashboard.statusOpen}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="rounded-sm p-2 text-body transition-colors hover:bg-white/5 hover:text-primary"
                          onClick={() => copyShare(ev.id)}
                          title={copied === ev.id ? t.admin.dashboard.copied : t.admin.dashboard.share}
                          aria-label={t.admin.dashboard.share}
                        >
                          {copied === ev.id ? (
                            <Check className="size-4 text-primary" />
                          ) : (
                            <Share2 className="size-4" />
                          )}
                        </button>
                        <Link
                          to="/admin/events/$id/edit"
                          params={{ id: ev.id }}
                          className="rounded-sm p-2 text-body transition-colors hover:bg-white/5 hover:text-primary"
                          title={t.admin.dashboard.edit}
                          aria-label={t.admin.dashboard.edit}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          className="rounded-sm p-2 text-body transition-colors hover:bg-white/5 hover:text-primary"
                          onClick={() => setConfirmDelete(ev.id)}
                          title={t.admin.dashboard.delete}
                          aria-label={t.admin.dashboard.delete}
                        >
                          <Trash2 className="size-4" />
                        </button>
                        <Link
                          to="/admin/events/$id/registrants"
                          params={{ id: ev.id }}
                          className="ml-2 inline-flex items-center gap-1.5 rounded-sm border border-white/15 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-widest text-body transition-colors hover:border-primary hover:text-primary"
                        >
                          <Users className="size-3.5" />
                          {t.admin.dashboard.registrants}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div className="card-surface w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl">{t.admin.dashboard.deleteConfirmTitle}</h2>
            <p className="mt-2 text-body">{t.admin.dashboard.deleteConfirmBody}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>
                {t.admin.dashboard.cancel}
              </button>
              <button
                className="btn-primary"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  deleteMutation.mutate(confirmDelete);
                  setConfirmDelete(null);
                }}
              >
                {t.admin.dashboard.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
