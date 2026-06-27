import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Receipt, TrendingUp, Calendar, Users, Package, AlertCircle,
  Plus, FilePlus2, History, BarChart3,
} from "lucide-react";
import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { openMenu } from "./_app";
import { useBills, useCustomers, useProducts } from "@/lib/store";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SLN Billing" },
      { name: "description", content: "Today's sales, recent bills, top products and outstanding overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [bills] = useBills();
  const [customers] = useCustomers();
  const [products] = useProducts();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todays = bills.filter((b) => new Date(b.date).toDateString() === today);
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const monthly = bills.filter((b) => {
      const d = new Date(b.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const outstanding = customers.reduce((a, c) => a + (c.balance || 0), 0);
    return {
      todaysBills: todays.length,
      todaysSales: todays.reduce((a, b) => a + b.grandTotal, 0),
      monthlySales: monthly.reduce((a, b) => a + b.grandTotal, 0),
      productsCount: products.length,
      customersCount: customers.length,
      outstanding,
    };
  }, [bills, customers, products]);

  const chartData = useMemo(() => {
    const days = 14;
    const out: { day: string; sales: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const total = bills.filter((b) => new Date(b.date).toDateString() === key).reduce((a, b) => a + b.grandTotal, 0);
      out.push({ day: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), sales: total });
    }
    return out;
  }, [bills]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; amount: number }>();
    for (const b of bills) {
      for (const l of b.lines) {
        const cur = map.get(l.productId) ?? { name: l.description, qty: 0, amount: 0 };
        cur.qty += l.quantity;
        cur.amount += l.quantity * l.rate * (1 - l.discountPct / 100) * (1 + l.gstPct / 100);
        map.set(l.productId, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [bills]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of today's billing activity"
        onOpenMenu={openMenu}
        actions={
          <Link to="/billing/create" className="inline-flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow hover:translate-y-[-1px] transition-transform">
            <FilePlus2 className="size-4" /> Create bill
          </Link>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Today's Bills" value={stats.todaysBills} icon={Receipt} accent="primary" />
        <StatCard label="Today's Sales" value={stats.todaysSales} icon={TrendingUp} accent="success" prefix="₹" decimals={0} />
        <StatCard label="Monthly Sales" value={stats.monthlySales} icon={Calendar} accent="primary" prefix="₹" decimals={0} />
        <StatCard label="Products" value={stats.productsCount} icon={Package} accent="brand" />
        <StatCard label="Customers" value={stats.customersCount} icon={Users} accent="primary" />
        <StatCard label="Outstanding" value={stats.outstanding} icon={AlertCircle} accent="warning" prefix="₹" decimals={0} />
      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl bg-card border border-border/60 p-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="font-display font-bold text-lg">Sales — last 14 days</h2>
              <p className="text-xs text-muted-foreground">Daily grand total including GST</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.2 265)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.55 0.2 265)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Area type="monotone" dataKey="sales" stroke="oklch(0.5 0.2 265)" fill="url(#g)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-5">
          <h2 className="font-display font-bold text-lg">Quick actions</h2>
          <p className="text-xs text-muted-foreground mb-4">Jump straight in</p>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/billing/create" icon={FilePlus2} label="Create bill" tone="primary" />
            <QuickAction to="/products" icon={Plus} label="Add product" tone="brand" />
            <QuickAction to="/billing/history" icon={History} label="View bills" tone="primary" />
            <QuickAction to="/reports" icon={BarChart3} label="Reports" tone="brand" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl bg-card border border-border/60 overflow-hidden">
          <div className="p-5 pb-3 flex items-end justify-between">
            <h2 className="font-display font-bold text-lg">Recent bills</h2>
            <Link to="/billing/history" className="text-xs font-semibold text-primary hover:underline">See all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-2.5 font-semibold">Bill</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Customer</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Date</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bills.slice(0, 6).map((b) => (
                  <tr key={b.id} className="border-t border-border/60 hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-3 font-semibold">{b.number}</td>
                    <td className="px-5 py-3 truncate max-w-[220px]">{b.customerSnapshot.name || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(b.date).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatINR(b.grandTotal)}</td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No bills yet — create your first bill.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-5">
          <h2 className="font-display font-bold text-lg">Top selling products</h2>
          <ul className="mt-3 space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.name + i} className="flex items-center gap-3">
                <div className="size-9 grid place-items-center rounded-xl gradient-brand text-brand-foreground text-xs font-bold">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.qty.toFixed(2)} units</div>
                </div>
                <div className="font-semibold tabular-nums">{formatINR(p.amount)}</div>
              </li>
            ))}
            {topProducts.length === 0 && <li className="text-sm text-muted-foreground">No data yet</li>}
          </ul>
        </div>
      </section>
    </>
  );
}

function QuickAction({ to, icon: Icon, label, tone }: { to: string; icon: typeof FilePlus2; label: string; tone: "primary" | "brand" }) {
  const cls = tone === "primary" ? "gradient-primary text-primary-foreground" : "gradient-brand text-brand-foreground";
  return (
    <Link to={to} className={`group flex flex-col gap-2 rounded-xl ${cls} p-4 hover:translate-y-[-2px] transition-transform shadow-md`}>
      <Icon className="size-5" />
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}
