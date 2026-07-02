import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { PageLoading } from "@/components/page-loading";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination, SortTh } from "@/components/table-controls";
import { type Customer } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { customersAPI } from "@/lib/customers";

export const Route = createFileRoute("/_app/customers")({
  validateSearch: (s: Record<string, unknown>) => ({ filter: (s.filter as string) || "" }),
  head: () => ({
    meta: [
      { title: "Customers — SLN Billing" },
      { name: "description", content: "Customer master with GST, TIN, address and outstanding balance." },
    ],
  }),
  component: CustomersPage,
});

function blank(): Customer {
  return { id: "", name: "", phone: "", address: "", gstNumber: "", tinNumber: "", state: "Karnataka", district: "", balance: 0, active: true };
}

function CustomersPage() {
  const { filter } = useSearch({ from: "/_app/customers" });

  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [confirmDel, setConfirmDel] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, q ? 350 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, page, perPage, sortBy, sortDir, filter]);

  async function load() {
    setLoading(true);
    try {
      const res = await customersAPI.getAll({
        q, page, perPage, sortBy, sortDir,
        outstanding: filter === "outstanding",
      });
      setItems(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  const save = async (c: Customer) => {
    if (!c.name.trim()) { toast.error("Customer name is required"); return; }
    try {
      if (c.id) {
        const result = await customersAPI.update(c.id, c);
        if (result.success) { toast.success("Customer updated"); }
      } else {
        const result = await customersAPI.create(c);
        if (result.success) { toast.success("Customer added"); }
      }
      setEditing(null);
      load();
    } catch {
      toast.error("Failed to save customer");
    }
  };

  const deleteCustomer = async () => {
    if (!confirmDel) return;
    try {
      await customersAPI.delete(confirmDel.id);
      toast.success("Customer deleted");
      setConfirmDel(null);
      load();
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  function handleSort(col: string) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title={filter === "outstanding" ? "Outstanding Customers" : "Customers"}
        subtitle={`${total} customers`}
        actions={
          <Button onClick={() => setEditing(blank())}>
            <Plus className="size-4" /> Add customer
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by name, phone or TIN…" />
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider sticky top-0" style={{ background: "linear-gradient(135deg, #122658 0%, #132D6A 50%, #1B3F8A 100%)", color: "#E4C457" }}>
                <SortTh col="name" label="Name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3.5 text-left font-semibold" />
                <SortTh col="phone" label="Phone" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3.5 text-left font-semibold" />
                <SortTh col="district" label="District" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3.5 text-left font-semibold" />
                <th className="px-4 py-3.5 text-left font-semibold">TIN</th>
                <th className="px-4 py-3.5 text-left font-semibold">GST</th>
                <th className="px-4 py-3.5 text-left font-semibold">State</th>
                <SortTh col="balance" label="Outstanding" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3.5 text-right font-semibold" />
                <th className="px-4 py-3.5 text-left font-semibold">Status</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><PageLoading label="Loading customers…" /></td></tr>
              ) : items.map((c) => (
                <tr key={c.id} className="border-t border-border/60 table-row-hover">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.address || "—"}</div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{c.phone || "—"}</td>
                  <td className="px-4 py-3.5">{c.district || "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{c.tinNumber || "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{c.gstNumber || "—"}</td>
                  <td className="px-4 py-3.5">{c.state || "—"}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                    <span className={c.balance > 0 ? "text-warning" : ""}>{formatINR(c.balance)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={c.active ? "success" : "cancelled"}>{c.active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(c)}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDel(c)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="No customers found" description="Add a customer or adjust your search." action={{ label: "Add customer", onClick: () => setEditing(blank()) }} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={pages} total={total} perPage={perPage} onPage={setPage} onPerPage={setPerPage} />
      </Card>

      {editing && <CustomerModal customer={editing} onCancel={() => setEditing(null)} onSave={save} />}
      {confirmDel && (
        <ConfirmDialog
          title="Delete this customer?"
          message={`${confirmDel.name} will be permanently removed.`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={deleteCustomer}
        />
      )}
    </>
  );
}

function CustomerModal({ customer, onCancel, onSave }: { customer: Customer; onCancel: () => void; onSave: (c: Customer) => void }) {
  const [c, setC] = useState(customer);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-md p-4 animate-in fade-in" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-elegant p-6 animate-in zoom-in-95 popup-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">{customer.id ? "Edit customer" : "Add customer"}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-accent"><X className="size-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Name" full><I value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></L>
          <L label="Phone"><I value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></L>
          <L label="District"><I value={c.district} onChange={(e) => setC({ ...c, district: e.target.value })} /></L>
          <L label="State"><I value={c.state} onChange={(e) => setC({ ...c, state: e.target.value })} /></L>
          <L label="TIN"><I value={c.tinNumber} onChange={(e) => setC({ ...c, tinNumber: e.target.value })} /></L>
          <L label="GST"><I value={c.gstNumber} onChange={(e) => setC({ ...c, gstNumber: e.target.value })} /></L>
          <L label="Balance"><I type="number" step="0.01" value={c.balance} onChange={(e) => setC({ ...c, balance: parseFloat(e.target.value || "0") })} /></L>
          <L label="Address" full><I value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} /></L>
          <L label="Active" full>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={c.active} onChange={(e) => setC({ ...c, active: e.target.checked })} className="size-4 accent-primary" /> Available for billing
            </label>
          </L>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(c)}>Save</Button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={"block " + (full ? "col-span-2" : "")}>
      <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
function I(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-xl border border-input bg-card/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />;
}
