import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CATEGORIES,
  eventQueryOptions,
  newBlankEvent,
  saveNewEvent,
  saveExistingEvent,
  uploadBannerImage,
  type EventInput,
} from "@/lib/store";
import { useLanguage, useT, categoryLabel } from "@/lib/i18n";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/admin/events/new")({
  component: () => <EventForm mode="new" />,
});

export function EventForm({ mode, eventId }: { mode: "new" | "edit"; eventId?: string }) {
  const t = useT();
  if (mode === "edit" && eventId) {
    return <EditEventFormBody eventId={eventId} />;
  }
  return (
    <EventFormBody
      heading={t.admin.form.headingNew}
      initial={newBlankEvent()}
      currentRegs={0}
      onSave={(input) => saveNewEvent(input)}
    />
  );
}

function EditEventFormBody({ eventId }: { eventId: string }) {
  const { data } = useSuspenseQuery(eventQueryOptions(eventId));
  const t = useT();
  return (
    <EventFormBody
      heading={t.admin.form.headingEdit}
      initial={data}
      currentRegs={data.registeredCount ?? 0}
      onSave={(input) => saveExistingEvent(eventId, input)}
    />
  );
}

function EventFormBody({
  heading,
  initial,
  currentRegs,
  onSave,
}: {
  heading: string;
  initial: EventInput;
  currentRegs: number;
  onSave: (input: EventInput) => Promise<unknown>;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ev, setEv] = useState<EventInput>(initial);
  const [warning, setWarning] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { lang } = useLanguage();
  const t = useT();

  const saveMutation = useMutation({
    mutationFn: () => onSave(ev),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate({ to: "/admin" });
    },
    onError: (err) => setWarning(err instanceof Error ? err.message : t.admin.form.saveError),
  });

  function update<K extends keyof EventInput>(k: K, v: EventInput[K]) {
    setEv((prev) => ({ ...prev, [k]: v }));
  }

  async function onFile(f: File | null) {
    if (!f) return;
    setWarning(null);
    setUploading(true);
    try {
      const { url } = await uploadBannerImage(f);
      update("bannerImage", url);
    } catch (err) {
      setWarning(err instanceof Error ? err.message : t.admin.form.uploadError);
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setWarning(null);
    if (!ev.title.trim()) {
      setWarning(t.admin.form.titleRequired);
      return;
    }
    if (ev.maxRegistrations < currentRegs) {
      if (!confirm(t.admin.form.reduceCapacityConfirm(currentRegs))) return;
    }
    saveMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/admin"
        className="text-xs uppercase tracking-widest text-body-muted hover:text-primary"
      >
        {t.admin.form.back}
      </Link>
      <h1 className="mt-3 text-3xl">{heading}</h1>

      <form onSubmit={submit} className="card-surface mt-8 space-y-6 p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t.admin.form.title}>
            <input
              className="input-line"
              required
              maxLength={120}
              value={ev.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </Field>
          <Field label={t.admin.form.titleRu}>
            <input
              className="input-line"
              maxLength={120}
              value={ev.titleRu ?? ""}
              onChange={(e) => update("titleRu", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t.admin.form.category}>
            <select
              className="input-line bg-surface-2"
              value={ev.category}
              onChange={(e) => update("category", e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c, lang)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.admin.form.location}>
            <input
              className="input-line"
              maxLength={120}
              value={ev.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t.admin.form.description}>
            <textarea
              className="input-line min-h-[100px] resize-y"
              maxLength={800}
              value={ev.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <Field label={t.admin.form.descriptionRu}>
            <textarea
              className="input-line min-h-[100px] resize-y"
              maxLength={800}
              value={ev.descriptionRu ?? ""}
              onChange={(e) => update("descriptionRu", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Field label={t.admin.form.date}>
            <input
              type="date"
              className="input-line"
              required
              value={ev.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </Field>
          <Field label={t.admin.form.start}>
            <input
              type="time"
              className="input-line"
              required
              value={ev.startTime}
              onChange={(e) => update("startTime", e.target.value)}
            />
          </Field>
          <Field label={t.admin.form.end}>
            <input
              type="time"
              className="input-line"
              required
              value={ev.endTime}
              onChange={(e) => update("endTime", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t.admin.form.coach}>
            <input
              className="input-line"
              maxLength={80}
              value={ev.coach ?? ""}
              onChange={(e) => update("coach", e.target.value)}
            />
          </Field>
          <Field label={t.admin.form.maxSeats}>
            <input
              type="number"
              min={1}
              max={500}
              className="input-line"
              required
              value={ev.maxRegistrations}
              onChange={(e) =>
                update("maxRegistrations", Math.max(1, parseInt(e.target.value) || 1))
              }
            />
          </Field>
        </div>

        <Field label={t.admin.form.deadline}>
          <input
            type="datetime-local"
            className="input-line"
            value={ev.registrationDeadline ? ev.registrationDeadline.slice(0, 16) : ""}
            onChange={(e) =>
              update(
                "registrationDeadline",
                e.target.value ? new Date(e.target.value).toISOString() : undefined,
              )
            }
          />
        </Field>

        <Field label={t.admin.form.banner}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
            disabled={uploading}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-body file:mr-4 file:cursor-pointer file:rounded-sm file:border file:border-white/20 file:bg-transparent file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-foreground hover:file:border-primary"
          />
          {uploading && <div className="mt-2 text-xs text-body-muted">{t.admin.form.uploading}</div>}
          {ev.bannerImage && (
            <img
              src={ev.bannerImage}
              alt="preview"
              className="mt-3 aspect-[21/9] w-full rounded-sm object-cover"
            />
          )}
        </Field>

        {warning && <div className="text-sm text-primary">{warning}</div>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending || uploading}
            className="btn-primary"
          >
            {saveMutation.isPending ? t.admin.form.saving : t.admin.form.save}
          </button>
          <Link to="/admin" className="btn-ghost">
            {t.admin.form.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-body-muted">{label}</span>
      {children}
    </label>
  );
}
