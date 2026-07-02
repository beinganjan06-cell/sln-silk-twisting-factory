import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBills, useCustomers } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const customersList = Array.isArray(customers) ? customers : [];
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
    return customersList.filter((c) => c.balance > 0).map((c) => ({ name: c.name, value: c.balance }));
  }, [bills, customersList, tab]);

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <>
      <PageHeader title="Reports" subtitle="Sales insights & analytics" />

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
              tab === t
                ? "gradient-primary text-white shadow-glow"
                : "bg-card border border-border hover:bg-accent hover:border-primary/20",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-end justify-between">
            <div>
              <CardTitle>{tab}</CardTitle>
              <CardDescription>
                Total: <span className="font-semibold text-foreground">{formatINR(total)}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <EmptyState title="No data yet" description="No data available for this report period." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => formatINR(v)}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(15,23,42,0.1)" }}
                  />
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
