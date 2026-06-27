import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { openMenu } from "./_app";
import { useBills, useCustomers } from "@/lib/store";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — SLN Billing" },
      { name: "description", content: "Daily, monthly and yearly sales with customer and product breakdowns." },
    ],
  }),
  component: Reports,
});

const TABS = ["Daily", "Monthly", "Yearly", "By customer", "By product", "Outstanding"] as const;

function Reports() {
  const [bills] = useBills();
  const [customers] = useCustomers();
  const [tab, setTab] = useState<typeof TABS[number]>("Daily");

  const data = useMemo(() => {
    if (tab === "Daily") {
      const map = new Map<string, number>();
      for (const b of bills) {
        const k = new Date(b.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        map.set(k, (map.get(k) ?? 0) + b.grandTotal);
      }
      return [...map.entries()].slice(-14).map(([name, value]) => ({ name, value }));
    }
    if (tab === "Monthly") {
      const map = new Map<string, number>();
      for (const b of bills) {
        const d = new Date(b.date);
        const k = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        map.set(k, (map.get(k) ?? 0) + b.grandTotal);
      }
      return [...map.entries()].map(([name, value]) => ({ name, value }));
    }
    if (tab === "Yearly") {
      const map = new Map<string, number>();
      for (const b of bills) {
        const k = String(new Date(b.date).getFullYear());
        map.set(k, (map.get(k) ?? 0) + b.grandTotal);
      }
      return [...map.entries()].map(([name, value]) => ({ name, value }));
    }
    if (tab === "By customer") {
      const map = new Map<string, number>();
      for (const b of bills) {
        const k = b.customerSnapshot.name || "—";
        map.set(k, (map.get(k) ?? 0) + b.grandTotal);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
    }
    if (tab === "By product") {
      const map = new Map<string, number>();
      for (const b of bills) for (const l of b.lines) {
        const amt = l.quantity * l.rate * (1 - l.discountPct / 100) * (1 + l.gstPct / 100);
        map.set(l.description, (map.get(l.description) ?? 0) + amt);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
    }
    // Outstanding
    return customers.filter((c) => c.balance > 0).map((c) => ({ name: c.name, value: c.balance }));
  }, [bills, customers, tab]);

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <>
      <PageHeader title="Reports" subtitle="Sales insights" onOpenMenu={openMenu} />

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={"rounded-xl px-3.5 py-2 text-sm font-semibold transition " + (tab === t ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border border-border hover:bg-accent")}
          >{t}</button>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border/60 p-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="font-display font-bold text-lg">{tab}</h2>
            <p className="text-xs text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatINR(total)}</span></p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
              <Bar dataKey="value" fill="oklch(0.55 0.2 265)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {data.length === 0 && <div className="text-center text-sm text-muted-foreground py-10">No data yet for this report.</div>}
      </div>
    </>
  );
}
