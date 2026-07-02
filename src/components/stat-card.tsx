import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  accent?: "primary" | "success" | "warning" | "secondary" | "info";
  decimals?: number;
  trend?: { value: number; label: string };
  delay?: number;
  href?: string;
}

const accentStyles = {
  primary: {
    ring: "from-primary/20 to-primary/5 text-primary",
    bar: "bg-primary",
    icon: "bg-primary/10 text-primary",
  },
  success: {
    ring: "from-success/20 to-success/5 text-success",
    bar: "bg-success",
    icon: "bg-success/10 text-success",
  },
  warning: {
    ring: "from-warning/20 to-warning/5 text-warning",
    bar: "bg-warning",
    icon: "bg-warning/10 text-warning",
  },
  secondary: {
    ring: "from-secondary/20 to-secondary/5 text-secondary",
    bar: "bg-secondary",
    icon: "bg-secondary/10 text-secondary",
  },
  info: {
    ring: "from-info/20 to-info/5 text-info",
    bar: "bg-info",
    icon: "bg-info/10 text-info",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  prefix,
  suffix,
  accent = "primary",
  decimals = 0,
  trend,
  delay = 0,
  href,
}: Props) {
  const display = useCountUp(value, 900, decimals);
  const styles = accentStyles[accent];
  const navigate = useNavigate();

  const handleClick = href
    ? () => {
        const [path, qs] = href.split("?");
        const search = qs ? Object.fromEntries(new URLSearchParams(qs)) : undefined;
        navigate({ to: path as any, search } as any);
      }
    : undefined;

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      onClick={handleClick}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card border border-border/60 px-5 py-4 card-hover card-animate flex items-center gap-4",
        href && "cursor-pointer",
      )}
    >
      <div
        className={cn(
          "absolute -top-8 -right-8 size-28 rounded-full bg-gradient-to-br blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500",
          styles.ring,
        )}
      />
      <div className="absolute top-0 left-0 bottom-0 w-0.5 gradient-primary opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Icon */}
      <div
        className={cn(
          "rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 shrink-0",
          styles.icon,
        )}
      >
        <Icon className="size-5" strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 relative">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </div>
        <div className="mt-0.5 font-display text-xl font-bold tabular-nums tracking-tight">
          {prefix}{display}{suffix}
        </div>
        {trend && (
          <div className="text-xs font-medium text-success">+{trend.value}% {trend.label}</div>
        )}
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 800, decimals = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") {
      setV(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
