import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Receipt, TrendingUp, Calendar, Users, Package,
  FilePlus2, ArrowUpRight, Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { PageSkeleton } from "@/components/page-loading";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { dashboardAPI } from "@/lib/dashboard";
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
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setStats(await dashboardAPI.getStats());
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of today's billing activity"
        actions={
          <Button asChild>
            <Link to="/billing/create">
              <FilePlus2 className="size-4" /> Create bill
            </Link>
          </Button>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Today's Bills" value={stats?.todaysBills || 0} icon={Receipt} accent="primary" delay={0} href="/billing/history?filter=today" />
        <StatCard label="Today's Sales" value={stats?.todaysSales || 0} icon={TrendingUp} accent="success" prefix="₹" decimals={0} delay={50} href="/billing/history?filter=today" />
        <StatCard label="Monthly Sales" value={stats?.monthlySales || 0} icon={Calendar} accent="secondary" prefix="₹" decimals={0} delay={100} href="/billing/history?filter=month" />
        <StatCard label="Products" value={stats?.productsCount || 0} icon={Package} accent="info" delay={150} href="/products" />
        <StatCard label="Customers" value={stats?.customersCount || 0} icon={Users} accent="primary" delay={200} href="/customers" />

      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-end justify-between">
              <div>
                <CardTitle>Sales — last 14 days</CardTitle>
                <CardDescription>Daily grand total including GST</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
                <Activity className="size-3.5" />
                Live
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 animate-in fade-in duration-700">
              <ResponsiveContainer>
                <AreaChart data={stats?.chartData || []} margin={{ left: -10, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#7C3AED" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => formatINR(v)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 4px 14px rgba(15,23,42,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563EB"
                    fill="url(#salesGrad)"
                    strokeWidth={2.5}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={100}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle>Sales by category</CardTitle>
            <CardDescription>Revenue split for top product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 animate-in fade-in duration-700 delay-100">
              <ResponsiveContainer>
                <BarChart data={(stats?.topProducts || []).slice(0, 6)} margin={{ left: -10, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => formatINR(v)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 4px 14px rgba(15,23,42,0.1)",
                    }}
                  />
                  <Bar dataKey="amount" fill="#7C3AED" radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 overflow-hidden card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Recent bills</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/billing/history">
                  See all <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground sticky top-0" style={{ background: "linear-gradient(135deg, #122658 0%, #132D6A 50%, #1B3F8A 100%)", color: "#E4C457" }}>
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">Bill</th>
                    <th className="text-left px-6 py-3 font-semibold">Customer</th>
                    <th className="text-left px-6 py-3 font-semibold">Date</th>
                    <th className="text-right px-6 py-3 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentBills?.slice(0, 6).map((b: any) => (
                    <tr key={b.id} className="border-t border-border/60 table-row-hover">
                      <td className="px-6 py-3.5 font-semibold">{b.number}</td>
                      <td className="px-6 py-3.5 truncate max-w-[220px] text-muted-foreground">
                        {b.customerSnapshot?.name || "—"}
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground">
                        {new Date(b.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold tabular-nums">
                        {formatINR(b.grandTotal)}
                      </td>
                    </tr>
                  ))}
                  {(!stats?.recentBills || stats.recentBills.length === 0) && (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState
                          title="No bills yet"
                          description="Create your first bill to see it here."
                          action={{ label: "Create bill", onClick: () => window.location.assign("/billing/create") }}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle>Top products</CardTitle>
            <CardDescription>Best sellers by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {stats?.topProducts?.map((p: any, i: number) => (
                <li key={p.name + i} className="flex items-center gap-3 group">
                  <div className="size-9 grid place-items-center rounded-xl gradient-primary text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.qty.toFixed(2)} units</div>
                  </div>
                  <div className="font-semibold tabular-nums text-sm">{formatINR(p.amount)}</div>
                </li>
              ))}
              {(!stats?.topProducts || stats.topProducts.length === 0) && (
                <li className="text-sm text-muted-foreground text-center py-6">No data yet</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

