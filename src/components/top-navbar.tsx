import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell, ChevronRight, Moon, Search, Sun, MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MenuButton } from "./app-sidebar";
import { applyTheme, useSettings, useAuth } from "@/lib/store";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  billing: "Billing",
  create: "Create Bill",
  history: "Bill History",
  customers: "Customers",
  products: "Products",
  masters: "Masters",
  reports: "Reports",
  settings: "Settings",
  profile: "Profile",
};

export function TopNavbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [settings] = useSettings();
  const auth = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(settings.theme);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => { setTheme(settings.theme); }, [settings.theme]);
  useEffect(() => { applyTheme(theme); }, [theme]);

  const crumbs = buildBreadcrumbs(pathname);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      const raw = localStorage.getItem("sln.settings");
      const s = raw ? JSON.parse(raw) : {};
      localStorage.setItem("sln.settings", JSON.stringify({ ...s, theme: next }));
    } catch { /* noop */ }
  };

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16">
        <MenuButton onClick={onOpenMenu} />

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 min-w-0 text-sm">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Home
          </Link>
          {crumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1 min-w-0">
              <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
              {i === crumbs.length - 1 ? (
                <span className="font-semibold text-foreground truncate">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="text-muted-foreground hover:text-foreground transition-colors truncate">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <div className={cn("relative transition-all duration-300", searchOpen ? "w-64" : "w-auto")}>
          {searchOpen ? (
            <label className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 input-fancy shadow-sm w-full">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                placeholder="Search bills, customers…"
                className="w-full bg-transparent outline-none text-sm"
                onBlur={() => setSearchOpen(false)}
              />
            </label>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3.5 py-2 text-sm text-muted-foreground hover:bg-accent transition-all"
            >
              <Search className="size-4" />
              <span>Search…</span>
              <kbd className="ml-2 hidden lg:inline-flex items-center rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <IconBtn icon={MessageSquare} label="Messages" badge={2} />
          <IconBtn icon={Bell} label="Notifications" badge={3} />

          <button
            onClick={toggleTheme}
            className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-accent transition-all ml-1"
              aria-label="User menu"
            >
              <div className="size-8 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold text-white">
                {(auth.user?.email?.[0] ?? "A").toUpperCase()}
              </div>
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-card border border-border shadow-elegant p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <div className="text-sm font-semibold truncate">
                      {auth.user?.email?.split("@")[0] ?? "Admin"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {auth.user?.email ?? "admin@sln.com"}
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    Settings
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function IconBtn({ icon: Icon, label, badge }: { icon: typeof Bell; label: string; badge?: number }) {
  return (
    <button
      className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
      aria-label={label}
    >
      <Icon className="size-[18px]" />
      {badge != null && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 size-4 rounded-full gradient-primary text-[9px] font-bold text-white flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  let path = "";
  for (const part of parts) {
    path += `/${part}`;
    crumbs.push({ label: routeLabels[part] ?? part, path });
  }
  return crumbs;
}
