import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { openMenu } from "./_app";
import { newId, useCustomers, type Customer } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { Confirm } from "./_app.billing.history";

export const Route = createFileRoute("/_app/customers")({
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
  const [items, setItems] = useCustomers();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [confirmDel, setConfirmDel] = useState<Customer | null>(null);

  const filtered = useMemo(() => items.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.phone.includes(q) ||
    c.tinNumber.includes(q)
  ), [items, q]);

  function save(c: Customer) {
    if (!c.name.trim()) { toast.error("Customer name is required"); return; }
    setItems((prev) => c.id ? prev.map((x) => x.id === c.id ? c : x) : [{ ...c, id: newId() }, ...prev]);
    toast.success(c.id ? "Customer updated" : "Customer added");
    setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${items.length} customers`}
        onOpenMenu={openMenu}
        actions={
          <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow">
            <Plus className="size-4" /> Add customer
          </button>
        }
      />

      <div className="rounded-2xl bg-card border border-border/60 p-4 mb-4">
        <label className="flex items-center gap-2 rounded-xl border border-input bg-card/60 px-3.5 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone or TIN…" className="w-full bg-transparent outline-none text-sm" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-2xl bg-card border border-border/60 p-5 hover-lift">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display font-bold truncate">{c.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{c.address || "—"}</p>
              </div>
              <span className={"inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 " + (c.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>{c.active ? "Active" : "Inactive"}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Info k="Phone" v={c.phone || "—"} />
              <Info k="District" v={c.district || "—"} />
              <Info k="TIN" v={c.tinNumber || "—"} />
              <Info k="GST" v={c.gstNumber || "—"} />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Outstanding</div>
                <div className={"font-display font-bold text-lg " + (c.balance > 0 ? "text-warning" : "")}>{formatINR(c.balance)}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(c)} className="p-2 rounded-lg hover:bg-accent"><Pencil className="size-4" /></button>
                <button onClick={() => setConfirmDel(c)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm text-muted-foreground col-span-full text-center py-10">No customers match your search.</div>}
      </div>

      {editing && <CustomerModal customer={editing} onCancel={() => setEditing(null)} onSave={save} />}
      {confirmDel && (
        <Confirm
          title="Delete this customer?"
          message={`${confirmDel.name} will be permanently removed.`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => { setItems((prev) => prev.filter((x) => x.id !== confirmDel.id)); toast.success("Deleted"); setConfirmDel(null); }}
        />
      )}
    </>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="truncate font-medium">{v}</div>
    </div>
  );
}

function CustomerModal({ customer, onCancel, onSave }: { customer: Customer; onCancel: () => void; onSave: (c: Customer) => void }) {
  const [c, setC] = useState(customer);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-elegant p-6 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
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
          <button onClick={onCancel} className="rounded-xl border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
          <button onClick={() => onSave(c)} className="rounded-xl gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow">Save</button>
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
