import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { adminLogout, sessionQueryOptions } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { LangSwitch } from "./__root";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === "/admin/login") return;
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session.authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();

  // Login route renders itself without chrome
  if (pathname === "/admin/login") return <Outlet />;

  async function handleLogout() {
    await adminLogout();
    queryClient.removeQueries({ queryKey: ["session"] });
    await router.invalidate();
    navigate({ to: "/admin/login" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link to="/admin" className="text-lg font-extrabold">
            <span className="text-primary">Sport</span>Park · Admin
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link to="/admin" className={`nav-link ${pathname === "/admin" ? "active" : ""}`}>
              {t.admin.nav.events}
            </Link>
            <Link to="/" className="nav-link">
              {t.admin.nav.viewSite}
            </Link>
            <LangSwitch />
            <button
              className="text-xs uppercase tracking-widest text-body-muted hover:text-primary"
              onClick={handleLogout}
            >
              {t.admin.nav.logout}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
