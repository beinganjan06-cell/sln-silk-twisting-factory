import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus, Printer, Save, Trash2, X, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { openMenu } from "./_app";
import {
  advanceBillNumber, getSettings, newId, nextBillNumber, saveBill,
  useCustomers, useProducts, useSettings,
  type Bill, type BillLine,
} from "@/lib/store";
import { formatINR, numberToIndianWords } from "@/lib/format";
import { BillPrint } from "@/components/bill-print";

export const Route = createFileRoute("/_app/billing/create")({
  head: () => ({
    meta: [
      { title: "Create Bill — SLN Billing" },
      { name: "description", content: "Create a new cash or credit bill with auto-calculated GST and grand total." },
    ],
  }),
  component: CreateBill,
});

function makeEmptyLine(defaultGst: number): BillLine {
  return { id: newId(), productId: "", description: "", quantity: 1, unit: "Kg", rate: 0, discountPct: 0, gstPct: defaultGst };
}

function CreateBill() {
  const [settings] = useSettings();
  const [products] = useProducts();
  const [customers] = useCustomers();
  const navigate = useNavigate();

  const [billNumber, setBillNumber] = useState(() => nextBillNumber());
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
  const [type, setType] = useState<"Cash" | "Credit">("Cash");
  const [customerId, setCustomerId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [partyTin, setPartyTin] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Goods once sold will not be taken back.");
  const [lines, setLines] = useState<BillLine[]>([makeEmptyLine(settings.defaultGst)]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const customer = customers.find((c) => c.id === customerId);

  useEffect(() => {
    if (customer) setPartyTin(customer.tinNumber || "");
  }, [customer]);

  const totals = useMemo(() => {
    let sub = 0, disc = 0, gst = 0;
    for (const l of lines) {
      const base = (l.quantity || 0) * (l.rate || 0);
      const d = base * ((l.discountPct || 0) / 100);
      const afterDisc = base - d;
      const g = afterDisc * ((l.gstPct || 0) / 100);
      sub += base; disc += d; gst += g;
    }
    const beforeRound = sub - disc + gst;
    const grand = Math.round(beforeRound);
    return { sub, disc, gst, roundOff: +(grand - beforeRound).toFixed(2), grand };
  }, [lines]);

  // Shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); handleSave(false); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") { e.preventDefault(); setPreviewOpen(true); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") { e.preventDefault(); handleClear(); }
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }); // eslint-disable-line

  function updateLine(i: number, patch: Partial<BillLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function pickProduct(i: number, pid: string) {
    const p = products.find((x) => x.id === pid);
    if (!p) return updateLine(i, { productId: "", description: "" });
    // Duplicate warning
    if (lines.some((l, idx) => idx !== i && l.productId === pid)) {
      toast.warning("That product is already on this bill");
    }
    updateLine(i, {
      productId: pid,
      description: p.name,
      unit: p.unit,
      rate: p.rate,
      gstPct: p.gst,
    });
  }
  function addLine() {
    setLines((prev) => [...prev, makeEmptyLine(settings.defaultGst)]);
  }
  function removeLine(i: number) {
    setLines((prev) => (prev.length === 1 ? [makeEmptyLine(settings.defaultGst)] : prev.filter((_, idx) => idx !== i)));
  }
  function handleClear() {
    setLines([makeEmptyLine(settings.defaultGst)]);
    setCustomerId("");
    setOrderNumber("");
    setPartyTin("");
    setVehicleNumber("");
    setNotes("");
    setBillNumber(nextBillNumber());
    toast.info("Form cleared");
  }

  function buildBill(): Bill {
    return {
      id: newId(),
      number: billNumber,
      date: new Date(date).toISOString(),
      time,
      type,
      customerId,
      customerSnapshot: {
        name: customer?.name ?? "",
        address: customer?.address ?? "",
        tin: customer?.tinNumber ?? partyTin,
      },
      orderNumber,
      partyTin,
      vehicleNumber,
      lines: lines.filter((l) => l.description.trim() && l.quantity > 0),
      discountTotal: +totals.disc.toFixed(2),
      gstTotal: +totals.gst.toFixed(2),
      subTotal: +totals.sub.toFixed(2),
      roundOff: totals.roundOff,
      grandTotal: totals.grand,
      notes,
      terms,
      createdAt: new Date().toISOString(),
    };
  }

  function validate(): string | null {
    if (!customer) return "Please select a customer";
    const valid = lines.filter((l) => l.description.trim());
    if (valid.length === 0) return "Add at least one product line";
    if (valid.some((l) => l.quantity <= 0)) return "Quantity must be greater than zero";
    if (valid.some((l) => l.rate < 0)) return "Rate cannot be negative";
    return null;
  }

  function handleSave(thenPrint: boolean) {
    const err = validate();
    if (err) { toast.error(err); return; }
    const bill = buildBill();
    saveBill(bill);
    advanceBillNumber();
    setBillNumber(nextBillNumber());
    toast.success("Bill saved");
    if (thenPrint) setTimeout(() => window.print(), 200);
    else navigate({ to: "/billing/history" });
  }

  return (
    <>
      <PageHeader
        title="Create Bill"
        subtitle={`Bill ${billNumber} · ${type}`}
        onOpenMenu={openMenu}
        actions={
          <>
            <Btn onClick={handleClear} icon={RotateCcw} variant="ghost">Clear</Btn>
            <Btn onClick={() => navigate({ to: "/dashboard" })} icon={X} variant="ghost">Cancel</Btn>
            <Btn onClick={() => { const e = validate(); if (e) return toast.error(e); setPreviewOpen(true); }} icon={Eye} variant="outline">Preview</Btn>
            <Btn onClick={() => handleSave(true)} icon={Printer} variant="outline">Save &amp; Print</Btn>
            <Btn onClick={() => handleSave(false)} icon={Save} variant="primary">Save bill</Btn>
          </>
        }
      />

      {/* HEADER CARD */}
      <section className="rounded-2xl bg-card border border-border/60 p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Company</div>
            <div className="font-display font-bold text-xl text-brand">{settings.companyName}</div>
            <div className="text-sm text-muted-foreground">{settings.address}</div>
            <div className="text-sm">📞 {settings.phone} · TIN {settings.tin}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bill type">
              <div className="flex rounded-xl bg-muted p-1">
                {(["Cash", "Credit"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={"flex-1 text-xs font-semibold rounded-lg py-1.5 transition " + (type === t ? "bg-card shadow-sm" : "text-muted-foreground")}
                  >{t}</button>
                ))}
              </div>
            </Field>
            <Field label="Bill No.">
              <Input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />
            </Field>
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Time">
              <Input value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Customer *">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Order No.">
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. PO-2026-001" />
          </Field>
          <Field label="Party TIN">
            <Input value={partyTin} onChange={(e) => setPartyTin(e.target.value)} />
          </Field>
          <Field label="Vehicle No.">
            <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="KA-42-AB-1234" />
          </Field>
        </div>

        {customer && (
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{customer.name}</span> · {customer.address} · {customer.phone}
          </div>
        )}
      </section>

      {/* LINES */}
      <section className="mt-4 rounded-2xl bg-card border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left w-10">#</th>
                <th className="px-3 py-3 text-left min-w-[220px]">Product</th>
                <th className="px-3 py-3 text-right w-24">Qty</th>
                <th className="px-3 py-3 text-left w-24">Unit</th>
                <th className="px-3 py-3 text-right w-28">Rate</th>
                <th className="px-3 py-3 text-right w-20">Disc %</th>
                <th className="px-3 py-3 text-right w-20">GST %</th>
                <th className="px-3 py-3 text-right w-32">Amount</th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => <LineRow key={l.id} i={i} l={l} products={products} onChange={updateLine} onPickProduct={pickProduct} onRemove={removeLine} onAddNext={addLine} />)}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-border/60">
          <button
            onClick={addLine}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/40 text-primary px-3.5 py-2 text-sm font-semibold hover:bg-primary/5 transition"
          >
            <Plus className="size-4" /> Add row <span className="text-[11px] text-muted-foreground ml-2">(Enter to add)</span>
          </button>
        </div>
      </section>

      {/* TOTALS + NOTES */}
      <section className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border/60 p-5 space-y-3">
          <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes (won't print)" /></Field>
          <Field label="Terms &amp; conditions"><Textarea value={terms} onChange={(e) => setTerms(e.target.value)} /></Field>
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Amount in words:</span> {numberToIndianWords(totals.grand)}
          </div>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-5">
          <h3 className="font-display font-bold text-lg">Summary</h3>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="Sub total" v={formatINR(totals.sub)} />
            <Row k="Discount" v={"-" + formatINR(totals.disc)} />
            <Row k="GST" v={"+" + formatINR(totals.gst)} />
            <Row k="Round off" v={formatINR(totals.roundOff)} />
            <div className="my-2 h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Grand total</span>
              <span className="font-display text-2xl font-bold text-brand">{formatINR(totals.grand)}</span>
            </div>
            <div className="mt-2 rounded-xl bg-muted/60 p-3 text-[11px] text-muted-foreground italic">
              {numberToIndianWords(totals.grand)}
            </div>
          </div>
        </div>
      </section>

      {/* Hidden print area for "Save & Print" */}
      <div className="hidden print:block">
        <BillPrint
          bill={{ ...buildBill() }}
          settings={getSettings()}
        />
      </div>

      {/* PREVIEW MODAL */}
      {previewOpen && (
        <PreviewModal onClose={() => setPreviewOpen(false)}>
          <BillPrint bill={buildBill()} settings={settings} />
        </PreviewModal>
      )}
    </>
  );
}

function LineRow({
  i, l, products, onChange, onPickProduct, onRemove, onAddNext,
}: {
  i: number; l: BillLine;
  products: ReturnType<typeof useProducts>[0];
  onChange: (i: number, p: Partial<BillLine>) => void;
  onPickProduct: (i: number, pid: string) => void;
  onRemove: (i: number) => void;
  onAddNext: () => void;
}) {
  const amount = (l.quantity || 0) * (l.rate || 0) * (1 - (l.discountPct || 0) / 100) * (1 + (l.gstPct || 0) / 100);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); onAddNext(); } };

  return (
    <tr className="border-t border-border/60 hover:bg-accent/30 transition-colors animate-in fade-in">
      <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
      <td className="px-3 py-2">
        <select
          className="w-full bg-transparent rounded-lg border border-input px-2.5 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
          value={l.productId}
          onChange={(e) => onPickProduct(i, e.target.value)}
        >
          <option value="">— Select product —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
        {!l.productId && l.description === "" && <div className="text-[11px] text-muted-foreground mt-1">or type a custom description below</div>}
        {(l.productId || l.description) && (
          <input
            className="mt-1 w-full bg-transparent border-b border-dashed border-border px-1 py-1 text-xs focus:outline-none"
            value={l.description}
            onChange={(e) => onChange(i, { description: e.target.value })}
            placeholder="Description"
          />
        )}
      </td>
      <td className="px-3 py-2">
        <NumberInput value={l.quantity} onChange={(v) => onChange(i, { quantity: Math.max(0, v) })} step={0.01} />
      </td>
      <td className="px-3 py-2">
        <input className="w-full bg-transparent rounded-lg border border-input px-2 py-2 text-sm" value={l.unit} onChange={(e) => onChange(i, { unit: e.target.value })} />
      </td>
      <td className="px-3 py-2">
        <NumberInput value={l.rate} onChange={(v) => onChange(i, { rate: Math.max(0, v) })} step={0.01} />
      </td>
      <td className="px-3 py-2">
        <NumberInput value={l.discountPct} onChange={(v) => onChange(i, { discountPct: Math.min(100, Math.max(0, v)) })} step={0.5} />
      </td>
      <td className="px-3 py-2">
        <NumberInput inputRef={lastInputRef} onKeyDown={onKey} value={l.gstPct} onChange={(v) => onChange(i, { gstPct: Math.max(0, v) })} step={0.5} />
      </td>
      <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatINR(amount)}</td>
      <td className="px-3 py-2">
        <button onClick={() => onRemove(i)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition" aria-label="Remove row">
          <Trash2 className="size-4" />
        </button>
      </td>
    </tr>
  );
}

// ----- Small UI primitives -----
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={"w-full rounded-xl border border-input bg-card/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition " + (props.className ?? "")} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={"w-full rounded-xl border border-input bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition " + (props.className ?? "")} />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={2} className={"w-full rounded-xl border border-input bg-card/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition " + (props.className ?? "")} />;
}
function NumberInput({
  value, onChange, step, inputRef, onKeyDown,
}: { value: number; onChange: (n: number) => void; step?: number; inputRef?: React.Ref<HTMLInputElement>; onKeyDown?: (e: React.KeyboardEvent) => void }) {
  return (
    <input
      ref={inputRef}
      type="number"
      step={step ?? 1}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value || "0"))}
      onFocus={(e) => e.target.select()}
      onKeyDown={onKeyDown}
      className="w-full rounded-lg border border-input bg-transparent px-2 py-2 text-sm text-right tabular-nums focus:ring-2 focus:ring-ring outline-none"
    />
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium tabular-nums">{v}</span></div>;
}
function Btn({
  children, icon: Icon, variant = "primary", onClick,
}: { children: React.ReactNode; icon: typeof Save; variant?: "primary" | "outline" | "ghost"; onClick?: () => void }) {
  const cls = variant === "primary"
    ? "gradient-primary text-primary-foreground shadow-glow"
    : variant === "outline"
      ? "border border-input bg-card hover:bg-accent"
      : "hover:bg-accent";
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition hover:translate-y-[-1px] ${cls}`}>
      <Icon className="size-4" /> {children}
    </button>
  );
}

function PreviewModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm animate-in fade-in no-print" onClick={onClose}>
      <div className="relative max-h-[92vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-2 right-2 z-10 flex gap-2 no-print">
          <button onClick={() => window.print()} className="rounded-xl gradient-primary text-primary-foreground px-3 py-2 text-sm font-semibold shadow-glow inline-flex items-center gap-2">
            <Printer className="size-4" /> Print
          </button>
          <button onClick={onClose} className="rounded-xl bg-card border border-border px-3 py-2 text-sm">
            <X className="size-4" />
          </button>
        </div>
        <div className="animate-in zoom-in-95 duration-200">{children}</div>
        <div className="mt-3 text-center text-xs text-muted-foreground inline-flex items-center gap-2 justify-center w-full">
          <FileText className="size-3.5" /> A5 print layout matches the SLN receipt
        </div>
      </div>
    </div>
  );
}
