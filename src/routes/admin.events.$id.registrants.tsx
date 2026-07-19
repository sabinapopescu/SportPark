import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  eventQueryOptions,
  eventRegistrationsAdminQueryOptions,
  adminCancelRegistration,
} from "@/lib/store";
import { formatShortDate, formatDateTime } from "@/lib/format";
import { useLanguage, useT, categoryLabel } from "@/lib/i18n";

export const Route = createFileRoute("/admin/events/$id/registrants")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(eventQueryOptions(params.id));
    await context.queryClient.ensureQueryData(eventRegistrationsAdminQueryOptions(params.id));
  },
  component: RegistrantsPage,
});

function RegistrantsPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: ev } = useSuspenseQuery(eventQueryOptions(id));
  const { data: regs } = useSuspenseQuery(eventRegistrationsAdminQueryOptions(id));
  const active = regs.filter((r) => !r.cancelledAt);
  const { lang } = useLanguage();
  const t = useT();

  const cancelMutation = useMutation({
    mutationFn: adminCancelRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/admin"
        className="text-xs uppercase tracking-widest text-body-muted hover:text-primary"
      >
        {t.admin.registrants.back}
      </Link>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary">
            {categoryLabel(ev.category, lang)}
          </div>
          <h1 className="mt-1 text-3xl">{ev.title}</h1>
          <div className="mt-1 text-sm text-body-muted">
            {formatShortDate(ev.date, lang)} · {ev.startTime}–{ev.endTime} · {ev.location}
          </div>
        </div>
        <div className="text-right text-sm text-body">
          <div>
            <b className="text-foreground text-lg">{t.admin.registrants.activeOf(active.length, ev.maxRegistrations)}</b>{" "}
            {t.admin.registrants.activeSuffix}
          </div>
          <div className="text-body-muted">
            {t.admin.registrants.cancelledSuffix(regs.length - active.length)}
          </div>
        </div>
      </div>

      <div className="card-surface mt-8 overflow-hidden">
        {regs.length === 0 ? (
          <div className="p-10 text-center text-body-muted">{t.admin.registrants.empty}</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-widest text-body-muted">
              <tr>
                <th className="px-4 py-3">{t.admin.registrants.colName}</th>
                <th className="px-4 py-3">{t.admin.registrants.colPhone}</th>
                <th className="px-4 py-3">{t.admin.registrants.colRegisteredAt}</th>
                <th className="px-4 py-3">{t.admin.registrants.colStatus}</th>
                <th className="px-4 py-3 text-right">{t.admin.registrants.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-4 py-3 text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-body">{r.phone || "—"}</td>
                  <td className="px-4 py-3 text-body">{formatDateTime(r.createdAt, lang)}</td>
                  <td className="px-4 py-3">
                    {r.cancelledAt ? (
                      <span className="badge-muted">{t.admin.registrants.cancelled}</span>
                    ) : (
                      <span className="badge-accent">{t.admin.registrants.activeStatus}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!r.cancelledAt && (
                      <button
                        className="text-xs uppercase tracking-widest text-body hover:text-primary"
                        disabled={cancelMutation.isPending}
                        onClick={() => {
                          if (confirm(t.admin.registrants.cancelConfirm(r.name))) {
                            cancelMutation.mutate(r.id);
                          }
                        }}
                      >
                        {t.admin.registrants.cancelAction}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
