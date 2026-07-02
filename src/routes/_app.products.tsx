import { createFileRoute } from "@tanstack/react-router";
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
import { useCategories, useUnits, type Product } from "@/lib/store";
import { productsAPI } from "@/lib/products";
import { formatINR } from "@/lib/format";

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
  const [categories] = useCategories();
  const [units] = useUnits();

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDel, setConfirmDel] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [q, page, perPage, sortBy, sortDir]);

  async function load() {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ q, page, perPage, sortBy, sortDir });
      setItems(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  const save = async (p: Product) => {
    if (!p.name.trim()) { toast.error("Product name is required"); return; }
    if (p.rate < 0) { toast.error("Rate cannot be negative"); return; }
    try {
      if (p.id) {
        const result = await productsAPI.update(p.id, p);
        if (result.success) toast.success("Product updated");
      } else {
        const result = await productsAPI.create(p);
        if (result.success) toast.success("Product added");
      }
      setEditing(null);
      load();
    } catch {
      toast.error("Failed to save product");
    }
  };

  const deleteProduct = async () => {
    if (!confirmDel) return;
    try {
      await productsAPI.delete(confirmDel.id);
      toast.success("Product deleted");
      setConfirmDel(null);
      load();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${total} items in master`}
        actions={
          <Button onClick={() => setEditing(blank())}>
            <Plus className="size-4" /> Add product
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search products…" />
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider sticky top-0" style={{ background: "linear-gradient(135deg, #122658 0%, #132D6A 50%, #1B3F8A 100%)", color: "#E4C457" }}>
              <tr>
                <SortTh col="name" label="Name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-left" />
                <SortTh col="code" label="Code" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-left" />
                <SortTh col="category" label="Category" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-left" />
                <th className="px-4 py-3 text-left">Unit</th>
                <SortTh col="rate" label="Rate" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-right" />
                <SortTh col="gst" label="GST" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-right" />
                <th className="px-4 py-3 text-left">HSN</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><PageLoading label="Loading products…" /></td></tr>
              ) : items.map((p) => (
                <tr key={p.id} className="border-t border-border/60 table-row-hover">
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.code}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3">{p.unit}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.rate)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.gst}%</td>
                  <td className="px-4 py-3">{p.hsn || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.active ? "success" : "cancelled"}>
                      {p.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(p)}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDel(p)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={9}><EmptyState title="No products yet" description="Add your first product to get started." action={{ label: "Add product", onClick: () => setEditing(blank()) }} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={pages} total={total} perPage={perPage} onPage={setPage} onPerPage={setPerPage} />
      </Card>

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
        <ConfirmDialog
          title="Delete this product?"
          message={`"${confirmDel.name}" will be permanently removed from the master.`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={deleteProduct}
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-md p-4 animate-in fade-in" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-elegant p-6 animate-in zoom-in-95 popup-slide-in" onClick={(e) => e.stopPropagation()}>
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
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(p)}>Save</Button>
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
