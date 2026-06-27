import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Eye, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { openMenu } from "./_app";
import { deleteBill, saveBill, useBills, useSettings, newId, advanceBillNumber, nextBillNumber, type Bill } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { BillPrint } from "@/components/bill-print";

export const Route = createFileRoute("/_app/billing/history")({
  head: () => ({
    meta: [
      { title: "Bill History — SLN Billing" },
      { name: "description", content: "Search, view, print or duplicate any previously saved bill." },
    ],
  }),
  component: BillHistory,
});

function BillHistory() {
  const [bills] = useBills();
  const [settings] = useSettings();
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preview, setPreview] = useState<Bill | null>(null);
  const [confirmDel, setConfirmDel] = useState<Bill | null>(null);

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      if (q && !(b.number.toLowerCase().includes(q.toLowerCase()) || b.customerSnapshot.name.toLowerCase().includes(q.toLowerCase()))) return false;
      const d = new Date(b.date).getTime();
      if (from && d < new Date(from).getTime()) return false;
      if (to && d > new Date(to).getTime() + 86400000) return false;
      return true;
    });
  }, [bills, q, from, to]);

  function duplicate(b: Bill) {
    const copy: Bill = { ...b, id: newId(), number: nextBillNumber(), createdAt: new Date().toISOString(), date: new Date().toISOString() };
    saveBill(copy);
    advanceBillNumber();
    toast.success("Bill duplicated as " + copy.number);
  }

  return (
    <>
      <PageHeader title="Bill History" subtitle={`${filtered.length} of ${bills.length} bills`} onOpenMenu={openMenu} />

      <section className="rounded-2xl bg-card border border-border/60 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="md:col-span-2 flex items-center gap-2 rounded-xl border border-input bg-card/60 px-3.5 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by bill number or customer…" className="w-full bg-transparent outline-none text-sm" />
        </label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-input bg-card/60 px-3 py-2.5 text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-input bg-card/60 px-3 py-2.5 text-sm" />
      </section>

      <section className="mt-4 rounded-2xl bg-card border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Bill #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-t border-border/60 hover:bg-accent/30">
                  <td className="px-4 py-3 font-semibold">{b.number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(b.date).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">{b.customerSnapshot.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold " + (b.type === "Cash" ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>{b.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.lines.length}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatINR(b.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn label="View" onClick={() => setPreview(b)} icon={Eye} />
                      <IconBtn label="Print" onClick={() => { setPreview(b); setTimeout(() => window.print(), 200); }} icon={Printer} />
                      <IconBtn label="Duplicate" onClick={() => duplicate(b)} icon={Copy} />
                      <IconBtn label="Delete" tone="danger" onClick={() => setConfirmDel(b)} icon={Trash2} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No bills match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4 no-print" onClick={() => setPreview(null)}>
          <div className="max-h-[92vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <BillPrint bill={preview} settings={settings} />
          </div>
        </div>
      )}
      {preview && <div className="hidden print:block"><BillPrint bill={preview} settings={settings} /></div>}

      {confirmDel && (
        <Confirm
          title="Delete this bill?"
          message={`Bill ${confirmDel.number} for ${confirmDel.customerSnapshot.name || "—"} will be permanently removed.`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => { deleteBill(confirmDel.id); toast.success("Bill deleted"); setConfirmDel(null); }}
        />
      )}
    </>
  );
}

function IconBtn({ icon: Icon, onClick, label, tone }: { icon: typeof Eye; onClick: () => void; label: string; tone?: "danger" }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={"p-2 rounded-lg transition hover:bg-accent " + (tone === "danger" ? "text-destructive hover:bg-destructive/10" : "")}
    >
      <Icon className="size-4" />
    </button>
  );
}

export function Confirm({ title, message, onCancel, onConfirm }: { title: string; message: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-elegant p-6 animate-in zoom-in-95">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border border-input px-4 py-2 text-sm hover:bg-accent">Cancel</button>
          <button onClick={onConfirm} className="rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-sm font-semibold hover:opacity-90">Delete</button>
        </div>
      </div>
    </div>
  );
}
