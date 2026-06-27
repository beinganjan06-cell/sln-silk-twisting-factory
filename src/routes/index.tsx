import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const authed = typeof window !== "undefined" && localStorage.getItem("sln.auth") === "1";
    navigate({ to: authed ? "/dashboard" : "/login", replace: true });
  }, [navigate]);
  return (
    <div className="min-h-screen grid place-items-center mesh-bg">
      <div className="animate-pulse text-sm text-muted-foreground">Loading SLN Billing…</div>
    </div>
  );
}
