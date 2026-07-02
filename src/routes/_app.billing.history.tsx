import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Copy, Eye, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { PageLoading } from "@/components/page-loading";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, SortTh } from "@/components/table-controls";
import { formatINR } from "@/lib/format";
import { BillPreview } from "@/components/bill-preview";
import { billsAPI, type BillListItem, type BillDetail } from "@/lib/bills";

export const Route = createFileRoute("/_app/billing/history")({
  validateSearch: (s: Record<string, unknown>) => ({ filter: (s.filter as string) || "" }),
  head: () => ({
    meta: [
      { title: "Bill History — SLN Billing" },
      { name: "description", content: "Search, view, print or duplicate any previously saved bill." },
    ],
  }),
  component: BillHistory,
});

function BillHistory() {
  const { filter } = useSearch({ from: "/_app/billing/history" });

  const todayStr = new Date().toISOString().split("T")[0];
  const monthStartStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [bills, setBills] = useState<BillListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(() => filter === "today" ? todayStr : filter === "month" ? monthStartStr : "");
  const [to, setTo] = useState(() => filter === "today" || filter === "month" ? todayStr : "");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [preview, setPreview] = useState<BillDetail | null>(null);
  const [confirmDel, setConfirmDel] = useState<BillListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSort(col: string) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
    setPage(1);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, q ? 350 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, from, to, page, perPage, sortBy, sortDir]);

  async function load() {
    setLoading(true);
    try {
      const res = await billsAPI.getAll({ q, from, to, page, perPage, sortBy, sortDir });
      setBills(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  }

  const openPreview = async (id: string, thenPrint = false) => {
    setLoadingId(id);
    try {
      const detail = await billsAPI.getById(id);
      setPreview(detail);
      if (thenPrint) setTimeout(() => window.print(), 200);
    } catch {
      toast.error("Failed to load bill details");
    } finally {
      setLoadingId(null);
    }
  };

  const duplicate = async (b: BillListItem) => {
    try {
      const result = await billsAPI.duplicate(b.id);
      if (result.success) {
        toast.success("Bill duplicated as " + result.bill.number);
        setPage(1);
        load();
      }
    } catch {
      toast.error("Failed to duplicate bill");
    }
  };

  const deleteBillConfirm = async () => {
    if (!confirmDel) return;
    try {
      await billsAPI.delete(confirmDel.id);
      toast.success("Bill deleted");
      setConfirmDel(null);
      load();
    } catch {
      toast.error("Failed to delete bill");
    }
  };

  return (
    <>
      <PageHeader title="Bill History" subtitle={`${total} bills`} />

      <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="md:col-span-2">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by bill number or customer…" />
        </div>
        <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider sticky top-0" style={{ background: "linear-gradient(135deg, #122658 0%, #132D6A 50%, #1B3F8A 100%)", color: "#E4C457" }}>
                <SortTh col="number" label="Bill #" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3.5 text-left font-semibold" />
                <SortTh col="date" label="Date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3.5 text-left font-semibold" />
                <SortTh col="customer_name" label="Customer" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3.5 text-left font-semibold" />
                <SortTh col="type" label="Type" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3.5 text-left font-semibold" />
                <th className="px-4 py-3.5 text-right font-semibold">Items</th>
                <SortTh col="grand_total" label="Amount" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3.5 text-right font-semibold" />
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><PageLoading label="Loading bills…" /></td></tr>
              ) : bills.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-border/60 table-row-hover cursor-pointer"
                  onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; openPreview(b.id); }}
                >
                  <td className="px-4 py-3.5 font-semibold">{b.number}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{new Date(b.date).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3.5">{b.customerName || "—"}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={b.type === "Cash" ? "paid" : "pending"}>{b.type}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">{b.itemCount}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{formatINR(b.grandTotal)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      <IconBtn label="View" onClick={() => openPreview(b.id)} icon={Eye} loading={loadingId === b.id} />
                      <IconBtn label="Print" onClick={() => openPreview(b.id, true)} icon={Printer} loading={loadingId === b.id} />
                      <IconBtn label="Duplicate" onClick={() => duplicate(b)} icon={Copy} />
                      <IconBtn label="Delete" tone="danger" onClick={() => setConfirmDel(b)} icon={Trash2} />
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && bills.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No bills found" description="Create a bill or adjust your filters." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={pages} total={total} perPage={perPage} onPage={setPage} onPerPage={setPerPage} />
      </Card>

      {preview && <BillPreview bill={preview} onClose={() => setPreview(null)} />}

      {confirmDel && (
        <ConfirmDialog
          title="Delete this bill?"
          message={`Bill ${confirmDel.number} for ${confirmDel.customerName || "—"} will be permanently removed.`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={deleteBillConfirm}
        />
      )}
    </>
  );
}

function IconBtn({ icon: Icon, onClick, label, tone, loading }: { icon: typeof Eye; onClick: () => void; label: string; tone?: "danger"; loading?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={onClick}
      disabled={loading}
      className={tone === "danger" ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""}
    >
      {loading ? <span className="inline-block w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon className="size-4" />}
    </Button>
  );
}

/** @deprecated Use ConfirmDialog from @/components/confirm-dialog */
export function Confirm(props: React.ComponentProps<typeof ConfirmDialog>) {
  return <ConfirmDialog {...props} />;
}
