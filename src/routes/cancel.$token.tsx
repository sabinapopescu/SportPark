import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { registrationByTokenQueryOptions, cancelRegistration } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { useLanguage, useT } from "@/lib/i18n";

export const Route = createFileRoute("/cancel/$token")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(registrationByTokenQueryOptions(params.token)),
  component: CancelPage,
});

function CancelPage() {
  const { token } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: reg } = useSuspenseQuery(registrationByTokenQueryOptions(token));
  const [done, setDone] = useState(false);
  const { lang } = useLanguage();
  const t = useT();

  const cancelMutation = useMutation({
    mutationFn: () => cancelRegistration(token),
    onSuccess: () => {
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  if (!reg) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl">{t.cancel.invalidTitle}</h1>
        <p className="mt-2 text-body-muted">{t.cancel.invalidBody}</p>
        <Link to="/" className="btn-ghost mt-6 inline-flex">
          {t.cancel.back}
        </Link>
      </div>
    );
  }

  const alreadyCancelled = !!reg.cancelledAt;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="card-surface p-8">
        <div className="text-xs uppercase tracking-[0.2em] text-primary">{t.cancel.heading}</div>
        <h1 className="mt-2 text-2xl">{reg.event?.title ?? t.cancel.defaultEventName}</h1>
        {reg.event && (
          <div className="mt-1 text-sm text-body-muted">
            {formatDate(reg.event.date, lang)} · {reg.event.startTime}–{reg.event.endTime}
          </div>
        )}
        <div className="mt-6 rounded-sm border border-white/10 bg-surface p-4">
          <div className="text-xs uppercase tracking-widest text-body-muted">
            {t.cancel.nameLabel}
          </div>
          <div className="mt-1 text-foreground">{reg.name}</div>
        </div>

        {done || alreadyCancelled ? (
          <div className="mt-6">
            <div className="text-lg text-foreground">{t.cancel.doneTitle}</div>
            <p className="mt-1 text-body">{t.cancel.doneBody}</p>
            <Link to="/" className="btn-ghost mt-6 inline-flex">
              {t.cancel.back}
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex gap-3">
            <button
              className="btn-primary"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {t.cancel.confirm}
            </button>
            <Link to="/" className="btn-ghost">
              {t.cancel.cancel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
