import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { ShieldX, Home, RefreshCw, AlertTriangle } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

function ErrorPageShell({
  code,
  title,
  description,
  icon: Icon,
  actions,
}: {
  code: string;
  title: string;
  description: string;
  icon: typeof AlertTriangle;
  actions: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center mesh-bg px-4">
      <div className="max-w-lg w-full text-center">
        <div className="relative mx-auto mb-8 w-fit">
          <div className="size-32 rounded-3xl gradient-primary opacity-10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className="size-12 text-primary mb-1" strokeWidth={1.5} />
            <span className="font-display text-4xl font-black bg-clip-text text-transparent gradient-primary">
              {code}
            </span>
          </div>
        </div>
        <div className="rounded-2xl glass shadow-elegant p-8 border border-border/60">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
        </div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <ErrorPageShell
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      icon={AlertTriangle}
      actions={
        <Button asChild>
          <Link to="/dashboard">
            <Home className="size-4" /> Go to dashboard
          </Link>
        </Button>
      }
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <ErrorPageShell
      code="500"
      title="Something went wrong"
      description="An unexpected error occurred. Please try again or return to the dashboard."
      icon={ShieldX}
      actions={
        <>
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            <RefreshCw className="size-4" /> Try again
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <Home className="size-4" /> Dashboard
            </Link>
          </Button>
        </>
      }
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SLN Silk Twisting Factory — Billing System" },
      { name: "description", content: "Premium receipt billing management for Sri Lakshmi Narasimhaswamy Silk Twisting Factory." },
      { name: "author", content: "SLN Silk Twisting Factory" },
      { property: "og:title", content: "SLN Silk Twisting Factory — Billing System" },
      { property: "og:description", content: "Premium receipt billing management for Sri Lakshmi Narasimhaswamy Silk Twisting Factory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sln.settings");
      const theme = raw ? (JSON.parse(raw)?.theme as string) : "light";
      document.documentElement.classList.toggle("dark", theme === "dark");
    } catch { /* noop */ }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-right" richColors closeButton expand />
    </QueryClientProvider>
  );
}
