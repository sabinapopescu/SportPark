import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminLogin } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { LangSwitch } from "./__root";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useT();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await adminLogin(email, password);
      queryClient.removeQueries({ queryKey: ["session"] });
      await router.invalidate();
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.login.errDefault);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card-surface w-full max-w-md p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary">SportPark</div>
            <h1 className="mt-1 text-2xl">{t.admin.login.heading}</h1>
          </div>
          <LangSwitch />
        </div>
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-body-muted">
              {t.admin.login.email}
            </label>
            <input
              className="input-line"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-body-muted">
              {t.admin.login.password}
            </label>
            <input
              className="input-line"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="text-sm text-primary">{error}</div>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? t.admin.login.submitting : t.admin.login.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
