import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, FilePlus2, History, Users, Package, Database,
  BarChart3, Settings as SettingsIcon, UserCircle2, LogOut, Menu, X,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SlnLogo } from "./sln-logo";
import { signOut, useSettings } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/billing/create", label: "Create Bill", icon: FilePlus2 },
  { to: "/billing/history", label: "Bill History", icon: History },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/masters", label: "Categories", icon: Database },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
] as const;

const SIDEBAR_KEY = "sln.sidebar.collapsed";

export function AppSidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [settings] = useSettings();

  const handleLogout = () => {
    signOut();
    toast.success("Signed out successfully");
    navigate({ to: "/login" });
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 z-50 lg:z-auto h-screen shrink-0 transition-all duration-300 ease-in-out self-start",
          collapsed ? "w-[72px]" : "w-64",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground overflow-hidden">
          {/* Logo header */}
          <div
            className={cn(
              "flex items-center gap-3 border-b border-sidebar-border shrink-0",
              collapsed ? "justify-center p-4" : "p-5",
            )}
          >
            <Link to="/dashboard" onClick={onClose} className="logo-animate shrink-0" aria-label="Go to dashboard">
              <div className="relative">
                <SlnLogo size={collapsed ? 36 : 40} />
                <div className="absolute -inset-1 rounded-xl gradient-primary opacity-20 blur-md -z-10" />
              </div>
            </Link>
            {!collapsed && (
              <div className="min-w-0 flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="font-display font-bold text-[13px] leading-snug text-sidebar-foreground">
                  Sri Lakshmi Narasimhaswamy
                </div>
                <div className="text-[11px] font-medium leading-snug text-sidebar-foreground/60">
                  Silk Twisting Factory
                </div>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex rounded-lg p-1.5 hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
            <button
              className="lg:hidden rounded-lg p-1.5 hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1.5 sidebar-scroll">
            {navItems.map((item, i) => {
              const active = "exact" in item && item.exact
                ? pathname === item.to
                : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  style={{ "--delay": `${i * 40}ms` } as React.CSSProperties}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl text-[15px] font-medium transition-all duration-200 nav-item-animate stagger h-11 w-full",
                    collapsed ? "justify-center px-0" : "px-3",
                    active
                      ? "sidebar-nav-active text-white"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon
                    className="size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ color: "#E4C457" }}
                  />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      {active && (
                        <span className="size-1.5 rounded-full bg-[#E4C457] shadow-[0_0_8px] shadow-[#E4C457]/60" />
                      )}
                    </>
                  )}
                  {collapsed && active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#E4C457]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-sidebar-border px-2 py-2 shrink-0">
            <button
              onClick={handleLogout}
              title={collapsed ? "Logout" : undefined}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl text-[15px] font-medium text-red-400 bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-all duration-200 h-11",
                collapsed ? "justify-center px-0" : "px-3",
              )}
            >
              <LogOut className="size-[18px] shrink-0" />
              {!collapsed && <span className="truncate flex-1">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
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

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "true");
    } catch { /* noop */ }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  };

  return { collapsed, toggle };
}
