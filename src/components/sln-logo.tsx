interface Props { size?: number; className?: string }
export function SlnLogo({ size = 44, className }: Props) {
  return (
    <div
      className={"relative inline-flex items-center justify-center rounded-full shadow-elegant " + (className ?? "")}
      style={{
        width: size,
        height: size,
        background: "var(--gradient-brand)",
        color: "var(--brand-foreground)",
      }}
      aria-label="SLN logo"
    >
      <span
        className="font-black tracking-tight"
        style={{ fontSize: size * 0.36, fontFamily: "var(--font-display)" }}
      >
        SLN
      </span>
      <span
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "inset 0 0 0 2px color-mix(in oklab, var(--gold) 70%, transparent)" }}
        aria-hidden
      />
    </div>
  );
}
