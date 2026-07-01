import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const authState = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !authState.isAuthed) navigate({ to: "/login", replace: true });
  }, [authState.isAuthed, navigate, mounted]);

  // Avoid SSR/client hydration mismatch — render nothing until client mounts
  if (!mounted) return null;
  if (!authState.isAuthed) return null;

  return (
    <div className="mesh-bg min-h-screen flex">
      <AppSidebar open={open} onClose={() => setOpen(false)} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 page-animate">
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
