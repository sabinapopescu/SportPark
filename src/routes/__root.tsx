import { QueryClient, QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Phone } from "lucide-react";

import appCss from "../styles.css?url";
import { languageQueryOptions } from "@/lib/store";
import { LanguageProvider, getDict, useLanguage, useT } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

function NotFoundComponent() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">{t.notFound.title}</h1>
        <h2 className="mt-4 text-xl">{t.notFound.subtitle}</h2>
        <p className="mt-2 text-sm text-body-muted">{t.notFound.body}</p>
        <div className="mt-6">
          <Link to="/" className="btn-primary">
            {t.notFound.home}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl">{t.error.title}</h1>
        <p className="mt-2 text-sm text-body-muted">{t.error.body}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            {t.error.retry}
          </button>
          <a href="/" className="btn-ghost">
            {t.error.home}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ match }) => {
    const lang = (match.context.queryClient.getQueryData<Lang>(["language"]) ?? "ro") as Lang;
    const t = getDict(lang);
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: t.siteTitle },
        { name: "description", content: t.siteDescription },
        { property: "og:title", content: t.siteTitle },
        { property: "og:description", content: t.siteOgDescription },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap",
        },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(languageQueryOptions()),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { queryClient } = Route.useRouteContext();
  const lang = (queryClient.getQueryData<Lang>(["language"]) ?? "ro") as Lang;
  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export function LangSwitch() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-surface-2 p-1 text-xs font-semibold uppercase tracking-wider">
      {(["ro", "ru"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            lang === l ? "bg-primary text-primary-foreground" : "text-body-muted hover:text-foreground"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();
  if (pathname.startsWith("/admin")) return null;
  return (
    <header className="border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/sport-park-21f9d64c.webp" alt="SportPark" className="h-9 w-auto md:h-11" />
        </Link>
        <nav className="flex items-center gap-3 md:gap-6">
          <LangSwitch />
          <a
            href="tel:078889889"
            className="hidden text-sm font-semibold text-primary md:inline"
          >
            078 889 889
          </a>
          <a
            href="tel:078889889"
            aria-label={t.header.callAria("078 889 889")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-surface-2 text-primary md:hidden"
          >
            <Phone className="h-4 w-4" />
          </a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-16 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-body-muted md:flex-row">
        <div>
          © {new Date().getFullYear()} SportPark Fitness Club · Str. Nicolae Dimo 32, Chișinău
        </div>
      </div>
    </footer>
  );
}

function AppShell() {
  const { data: initialLang } = useSuspenseQuery(languageQueryOptions());
  return (
    <LanguageProvider initialLang={initialLang}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
