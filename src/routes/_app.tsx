import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const authed = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!authed) navigate({ to: "/login", replace: true });
  }, [authed, navigate]);

  if (!authed) return null;

  return (
    <div className="mesh-bg min-h-screen flex">
      <AppSidebar open={open} onClose={() => setOpen(false)} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
        <Outlet />
      </main>
      <MenuContext.Provider />
      {/* Expose menu open through portal: simple trick — children read via context-less prop drilling */}
      <MenuPortal onOpen={() => setOpen(true)} />
    </div>
  );
}

// Tiny custom event for child pages to open the sidebar without prop drilling.
function MenuPortal({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const h = () => onOpen();
    window.addEventListener("sln:open-menu", h);
    return () => window.removeEventListener("sln:open-menu", h);
  }, [onOpen]);
  return null;
}

// Placeholder to satisfy import; real menu actions dispatch the event.
const MenuContext = { Provider: () => null };

export const openMenu = () => window.dispatchEvent(new CustomEvent("sln:open-menu"));
