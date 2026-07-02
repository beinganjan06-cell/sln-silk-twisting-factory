import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar, useSidebarCollapsed } from "@/components/app-sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { useAuth } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const authState = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { collapsed, toggle: toggleCollapse } = useSidebarCollapsed();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !authState.isAuthed) navigate({ to: "/login", replace: true });
  }, [authState.isAuthed, navigate, mounted]);

  if (!mounted) return null;
  if (!authState.isAuthed) return null;

  return (
    <div className="mesh-bg min-h-screen flex">
      <AppSidebar
        open={open}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300")}>
        <TopNavbar onOpenMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 page-animate overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <MenuPortal onOpen={() => setOpen(true)} />
    </div>
  );
}

function MenuPortal({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const h = () => onOpen();
    window.addEventListener("sln:open-menu", h);
    return () => window.removeEventListener("sln:open-menu", h);
  }, [onOpen]);
  return null;
}

export const openMenu = () => window.dispatchEvent(new CustomEvent("sln:open-menu"));
