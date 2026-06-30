import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SlnLogo } from "@/components/sln-logo";
import { signIn, useSettings } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SLN Silk Twisting Factory" },
      { name: "description", content: "Sign in to the SLN Silk Twisting Factory billing system." },
    ],
  }),
  component: Login,
});

function Login() {
  const [settings] = useSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState("sln@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const user = signIn(email, password);
      if (user) {
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      } else {
        toast.error("Invalid email or password!");
      }
      setBusy(false);
    }, 500);
  }

  return (
    <div className="relative min-h-screen overflow-hidden mesh-bg flex items-center justify-center p-4">
      {/* Animated gradient blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-[460px] rounded-full bg-primary/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 size-[520px] rounded-full bg-brand/25 blur-3xl animate-pulse [animation-delay:1s]" />

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-3xl glass shadow-elegant p-8 sm:p-10 card-hover">
          <div className="flex flex-col items-center text-center gap-3">
            <SlnLogo size={64} />
            <div>
              <h1 className="font-display text-2xl font-bold leading-tight">{settings.companyName}</h1>
              <p className="mt-1 text-xs text-muted-foreground">{settings.address}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[11px] font-semibold text-success">
              <ShieldCheck className="size-3.5" />
              Secure billing workspace
            </div>
          </div>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Field icon={Mail} label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sln@gmail.com or vinayaka@gmail.com"
                autoComplete="email"
                type="email"
                className="w-full bg-transparent outline-none text-sm input-fancy"
              />
            </Field>
            <Field icon={Lock} label="Password">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
                autoComplete="current-password"
                className="w-full bg-transparent outline-none text-sm input-fancy"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>

            <button
              type="submit"
              disabled={busy}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-glow disabled:opacity-70 transition-all hover:translate-y-[-1px] liquid-btn"
            >
              {busy ? "Signing in…" : "Sign in"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="mt-4 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Available users:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>sln@gmail.com / 123456 (SLN shop)</li>
                <li>vinayaka@gmail.com / 123456 (Vinayaka shop)</li>
              </ul>
            </div>
          </form>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {settings.companyName}
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon, label, children,
}: { icon: typeof Lock; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      <span className="flex items-center gap-2 rounded-xl border border-input bg-card/60 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-ring transition-all input-fancy">
        <Icon className="size-4 text-muted-foreground shrink-0" />
        {children}
      </span>
    </label>
  );
}
