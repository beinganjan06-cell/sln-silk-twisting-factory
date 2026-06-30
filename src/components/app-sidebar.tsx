import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Receipt, FilePlus2, History, Users, Package, Database,
  BarChart3, Settings as SettingsIcon, UserCircle2, LogOut, Menu, X, Moon, Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SlnLogo } from "./sln-logo";
import { signOut, useSettings, applyTheme } from "@/lib/store";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/billing/create", label: "Create Bill", icon: FilePlus2 },
  { to: "/billing/history", label: "Bill History", icon: History },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/masters", label: "Masters", icon: Database },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
] as const;

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [settings] = useSettings();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}
      <aside
        className={
          "fixed lg:sticky top-0 z-50 lg:z-auto h-screen w-72 shrink-0 transition-transform duration-300 " +
          (open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
        }
      >
        <div className="h-full m-3 mr-0 lg:mr-3 flex flex-col rounded-3xl glass shadow-elegant overflow-hidden card-hover">
          {/* Header */}
          <div className="flex items-center gap-3 p-5 border-b border-border/60">
            <SlnLogo size={44} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">SLN Billing</div>
              <div className="truncate font-display font-bold text-sm leading-tight">
                {settings.companyName.split(" ").slice(0, 3).join(" ")}…
              </div>
            </div>
            <button
              className="lg:hidden rounded-lg p-2 hover:bg-accent transition-all"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Workspace
            </div>
            {nav.slice(0, 1).map((item) => <NavItem key={item.to} {...item} active={pathname === item.to} />)}

            <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Billing
            </div>
            {nav.slice(1, 3).map((item) => <NavItem key={item.to} {...item} active={pathname.startsWith(item.to)} />)}

            <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Masters
            </div>
            {nav.slice(3, 6).map((item) => <NavItem key={item.to} {...item} active={pathname.startsWith(item.to)} />)}

            <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Insights
            </div>
            {nav.slice(6, 7).map((item) => <NavItem key={item.to} {...item} active={pathname.startsWith(item.to)} />)}

            <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Account
            </div>
            {nav.slice(7).map((item) => <NavItem key={item.to} {...item} active={pathname.startsWith(item.to)} />)}
          </nav>

          {/* Footer */}
          <div className="border-t border-border/60 p-3 space-y-2">
            <ThemeToggle />
            <button
              onClick={() => { signOut(); toast.success("Signed out"); navigate({ to: "/login" }); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all hover-lift"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  to, label, icon: Icon, active,
}: { to: string; label: string; icon: typeof Receipt; active: boolean }) {
  return (
    <Link
      to={to}
      className={
        "group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all " +
        (active
          ? "gradient-primary text-primary-foreground shadow-glow liquid-btn"
          : "text-foreground/80 hover:bg-accent hover:text-accent-foreground hover-lift")
      }
    >
      <Icon className={"size-4 transition-transform group-hover:scale-110 " + (active ? "" : "text-muted-foreground")} />
      <span>{label}</span>
      {active && <span className="ml-auto size-1.5 rounded-full bg-primary-foreground/80" />}
    </Link>
  );
}

function ThemeToggle() {
  const [settings] = useSettings();
  const [theme, setTheme] = useState<"light" | "dark">(settings.theme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-all hover-lift"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden inline-flex items-center justify-center rounded-xl border border-border bg-card p-2.5 shadow-sm hover:bg-accent transition-all hover-lift"
      aria-label="Open menu"
    >
      <Menu className="size-5" />
    </button>
  );
}
