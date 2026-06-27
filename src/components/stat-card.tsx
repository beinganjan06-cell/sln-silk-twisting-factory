import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  accent?: "primary" | "success" | "warning" | "brand";
  decimals?: number;
}
export function StatCard({ label, value, icon: Icon, prefix, suffix, accent = "primary", decimals = 0 }: Props) {
  const display = useCountUp(value, 900, decimals);
  const ring = {
    primary: "from-primary/20 to-primary-glow/10 text-primary",
    success: "from-[oklch(0.85_0.1_155)]/40 to-transparent text-success",
    warning: "from-[oklch(0.9_0.15_75)]/40 to-transparent text-warning",
    brand:   "from-brand/20 to-gold/10 text-brand",
  }[accent];

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/60 p-5 hover-lift">
      <div className={`absolute -top-12 -right-12 size-40 rounded-full bg-gradient-to-br ${ring} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-bold tabular-nums">
            {prefix}{display}{suffix}
          </div>
        </div>
        <div className={`rounded-xl p-2.5 bg-gradient-to-br ${ring}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 800, decimals = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
