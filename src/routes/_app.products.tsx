import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { openMenu } from "./_app";
import { newId, useCategories, useProducts, useUnits, type Product } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { Confirm } from "./_app.billing.history";

export const Route = createFileRoute("/_app/products")({
  head: () => ({
    meta: [
      { title: "Products — SLN Billing" },
      { name: "description", content: "Product master with rates, GST, HSN and category." },
    ],
  }),
  component: ProductsPage,
});

function blank(): Product {
  return { id: "", name: "", code: "", category: "Silk Yarn", unit: "Kg", rate: 0, gst: 5, hsn: "", active: true, createdAt: new Date().toISOString() };
}

function ProductsPage() {
  const [items, setItems] = useProducts();
  const [categories] = useCategories();
  const [units] = useUnits();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDel, setConfirmDel] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.code.toLowerCase().includes(q.toLowerCase())), [items, q]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));

  function save(p: Product) {
    if (!p.name.trim()) { toast.error("Product name is required"); return; }
    if (p.rate < 0) { toast.error("Rate cannot be negative"); return; }
    setItems((prev) => p.id ? prev.map((x) => x.id === p.id ? p : x) : [{ ...p, id: newId(), createdAt: new Date().toISOString() }, ...prev]);
    toast.success(p.id ? "Product updated" : "Product added");
    setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${items.length} items in master`}
        onOpenMenu={openMenu}
        actions={
          <button onClick={() => setEditing(blank())} className="inline-flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow">
            <Plus className="size-4" /> Add product
          </button>
        }
      />

      <div className="rounded-2xl bg-card border border-border/60 p-4 mb-4">
        <label className="flex items-center gap-2 rounded-xl border border-input bg-card/60 px-3.5 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search products…" className="w-full bg-transparent outline-none text-sm" />
        </label>
      </div>

      <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-left">HSN</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id} className="border-t border-border/60 hover:bg-accent/30">
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.code}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3">{p.unit}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.rate)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.gst}%</td>
                  <td className="px-4 py-3">{p.hsn || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold " + (p.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(p)} className="p-2 rounded-lg hover:bg-accent"><Pencil className="size-4" /></button>
                      <button onClick={() => setConfirmDel(p)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60">
            <div className="text-xs text-muted-foreground">Page {page} of {pages}</div>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-input px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-accent">Prev</button>
              <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-input px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-accent">Next</button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <ProductModal
          product={editing}
          categories={categories}
          units={units}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
      {confirmDel && (
        <Confirm
          title="Delete this product?"
          message={`"${confirmDel.name}" will be permanently removed from the master.`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => { setItems((prev) => prev.filter((x) => x.id !== confirmDel.id)); toast.success("Deleted"); setConfirmDel(null); }}
        />
      )}
    </>
  );
}

function ProductModal({
  product, categories, units, onCancel, onSave,
}: { product: Product; categories: string[]; units: string[]; onCancel: () => void; onSave: (p: Product) => void }) {
  const [p, setP] = useState(product);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-elegant p-6 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold">{product.id ? "Edit product" : "Add product"}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-accent"><X className="size-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Product name" full><I value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></L>
          <L label="Code"><I value={p.code} onChange={(e) => setP({ ...p, code: e.target.value })} /></L>
          <L label="HSN"><I value={p.hsn} onChange={(e) => setP({ ...p, hsn: e.target.value })} /></L>
          <L label="Category">
            <select className="w-full rounded-xl border border-input bg-card/60 px-3 py-2.5 text-sm" value={p.category} onChange={(e) => setP({ ...p, category: e.target.value })}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </L>
          <L label="Unit">
            <select className="w-full rounded-xl border border-input bg-card/60 px-3 py-2.5 text-sm" value={p.unit} onChange={(e) => setP({ ...p, unit: e.target.value })}>
              {units.map((u) => <option key={u}>{u}</option>)}
            </select>
          </L>
          <L label="Rate"><I type="number" step="0.01" value={p.rate} onChange={(e) => setP({ ...p, rate: parseFloat(e.target.value || "0") })} /></L>
          <L label="GST %"><I type="number" step="0.5" value={p.gst} onChange={(e) => setP({ ...p, gst: parseFloat(e.target.value || "0") })} /></L>
          <L label="Active" full>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} className="size-4 accent-primary" /> Available for billing
            </label>
          </L>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
          <button onClick={() => onSave(p)} className="rounded-xl gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow">Save</button>
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
