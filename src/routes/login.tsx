import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { SlnLogo } from "@/components/sln-logo";
import { setAuthState } from "@/lib/store";
import { authAPI } from "@/lib/auth";

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
  const navigate = useNavigate();
  const [email, setEmail]       = useState("sln@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPwd, setShowPwd]   = useState(false);
  const [busy, setBusy]         = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    setBusy(true);
    try {
      const response = await authAPI.login({ email, password });
      if (response.success) {
        setAuthState({ isAuthed: true, user: response.user, settings: response.settings, shops: response.shops });
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch {
      toast.error("Invalid email or password!");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundImage: "url('/login-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Glass card */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl p-8 flex flex-col items-center gap-6"
        style={{
          background: "rgba(10,22,60,0.58)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid rgba(200,162,71,0.35)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.50), 0 0 24px rgba(200,162,71,0.12), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        {/* Logo + name */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          <SlnLogo size={52} />
          <div className="text-center">
            <div className="font-display font-bold text-lg leading-tight" style={{ color: "#E4C457" }}>
              Sri Lakshmi Narasimhaswamy
            </div>
            <div className="text-sm font-medium text-white/70">Silk Twisting Factory</div>
          </div>
        </div>

        {/* Form */}
        <form className="w-full flex flex-col gap-4 relative z-10" onSubmit={onSubmit}>
          {/* Email */}
          <div className="flex items-center gap-3 rounded-xl px-4"
            style={{ background: "rgba(8,18,55,0.75)", border: "1px solid rgba(200,162,71,0.30)", boxShadow: "0 0 14px rgba(200,162,71,0.08)" }}>
            <Mail className="size-[18px] shrink-0" style={{ color: "#C8A247" }} />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Username / Email" autoComplete="email"
              className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-white/35 py-3.5"
            />
          </div>

          {/* Password */}
          <div className="flex items-center gap-3 rounded-xl px-4"
            style={{ background: "rgba(8,18,55,0.75)", border: "1px solid rgba(200,162,71,0.30)", boxShadow: "0 0 14px rgba(200,162,71,0.08)" }}>
            <Lock className="size-[18px] shrink-0" style={{ color: "#C8A247" }} />
            <input
              type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" autoComplete="current-password"
              className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-white/35 py-3.5"
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="text-white/40 hover:text-white/80 transition-colors">
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Login button */}
          <button
            type="submit" disabled={busy}
            className="w-full h-12 rounded-xl font-display font-bold text-[15px] tracking-widest uppercase transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-1"
            style={{
              background: "linear-gradient(135deg,#8E6720 0%,#C8A247 35%,#E4C457 65%,#FEF99E 100%)",
              color: "#0B1A3E",
              boxShadow: "0 4px 28px rgba(200,162,71,0.45)",
            }}
          >
            {busy ? "Signing in…" : "Log In"}
          </button>
        </form>

        <div className="relative z-10">
          <button type="button" className="text-sm text-white/60 hover:text-white/90 transition-colors">
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
}
