import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus, Printer, Save, Trash2, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useCustomers, useProducts, useSettings, type Bill, type BillLine, type Shop,
} from "@/lib/store";
import { formatINR, numberToIndianWords } from "@/lib/format";
import { BillPrint } from "@/components/bill-print";
import { BillPreview } from "@/components/bill-preview";
import { billsAPI } from "@/lib/bills";
import { productsAPI } from "@/lib/products";
import { customersAPI } from "@/lib/customers";
import { settingsAPI } from "@/lib/settings";

export const Route = createFileRoute("/_app/billing/create")({
  head: () => ({
    meta: [
      { title: "Create Bill — SLN Billing" },
      { name: "description", content: "Create a new cash or Online bill with auto-calculated GST and grand total." },
    ],
  }),
  component: CreateBill,
  ssr: false,
});

function makeEmptyLine(defaultGst: number): BillLine {
  return { id: Math.random().toString(36).slice(2), productId: "", description: "", quantity: 1, unit: "Kg", rate: 0, discountPct: 0, gstPct: defaultGst };
}

function CreateBill() {
  const [settings] = useSettings();
  const [products, setProducts] = useProducts();
  const [customers, setCustomers] = useCustomers();
  const [shops, setShops] = useState<Shop[]>([]);
  const navigate = useNavigate();

  const [selectedShopId, setSelectedShopId] = useState(settings.selectedShopId);
  const customerList = Array.isArray(customers) ? customers : [];
  const productList = Array.isArray(products) ? products : [];
  const [billNumber, setBillNumber] = useState(() => `${settings.billPrefix}-${String(settings.nextBillNumber).padStart(4, "0")}`);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
  const [type, setType] = useState<"Cash" | "Online">("Cash");
  const [customerId, setCustomerId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderNumberAuto, setOrderNumberAuto] = useState(true); // true = will auto-generate
  const [partyTin, setPartyTin] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [transportDetails, setTransportDetails] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Goods once sold will not be taken back.");
  const [lines, setLines] = useState<BillLine[]>([makeEmptyLine(settings.defaultGst)]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedShop = shops.find(s => s.id === selectedShopId) || shops?.[0] || { id: "default", name: "", address: "", phone: "", tin: "" };
  const customer = customerList.find((c) => c.id === customerId);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, c, s] = await Promise.all([
          productsAPI.getAll({ perPage: 1000 }),
          customersAPI.getAll({ perPage: 1000 }),
          settingsAPI.getShops()
        ]);
        setProducts(p.data);
        setCustomers(c.data);
        setShops(s);
        if (!s.find((shop: Shop) => shop.id === selectedShopId) && s.length > 0) {
          setSelectedShopId(s[0].id);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (customer) {
      setPartyTin(customer.tinNumber || "");
      setCustomerPhone(customer.phone || "");
      setCustomerGstin(customer.gstNumber || "");
      setDeliveryAddress(customer.address || "");
      if (orderNumberAuto) setOrderNumber(""); // clear so backend auto-generates
    }
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
    const cgst = gst / 2;
    const sgst = gst / 2;
    const beforeRound = sub - disc + gst;
    const grand = Math.round(beforeRound);
    return { sub, disc, gst, cgst, sgst, roundOff: +(grand - beforeRound).toFixed(2), grand };
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
    setOrderNumberAuto(true);
    setPartyTin("");
    setCustomerPhone("");
    setCustomerGstin("");
    setVehicleNumber("");
    setTransportDetails("");
    setDeliveryAddress("");
    setNotes("");
    toast.info("Form cleared");
  }

  function buildBill(): Omit<Bill, "id" | "createdAt"> {
    return {
      number: billNumber,
      date: new Date(date).toISOString(),
      time,
      type,
      customerId,
      customerSnapshot: {
        name: customer?.name ?? "",
        address: customer?.address ?? "",
        phone: customer?.phone ?? customerPhone,
        tin: customer?.tinNumber ?? partyTin,
        gstin: customer?.gstNumber ?? customerGstin,
      },
      orderNumber,
      partyTin,
      vehicleNumber,
      transportDetails,
      deliveryAddress,
      lines: lines.filter((l) => l.description.trim() && l.quantity > 0),
      discountTotal: +totals.disc.toFixed(2),
      gstTotal: +totals.gst.toFixed(2),
      cgstTotal: +totals.cgst.toFixed(2),
      sgstTotal: +totals.sgst.toFixed(2),
      subTotal: +totals.sub.toFixed(2),
      roundOff: totals.roundOff,
      grandTotal: totals.grand,
      notes,
      terms,
      shopId: selectedShopId,
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

  async function handleSave(thenPrint: boolean) {
    const err = validate();
    if (err) { toast.error(err); return; }
    try {
      const billData = buildBill();
      const result = await billsAPI.create(billData as any);
      if (result.success) {
        toast.success("Bill saved");
        setBillNumber(`${settings.billPrefix}-${String(Number(billNumber.split("-")[1]) + 1).padStart(4, "0")}`);
        if (thenPrint) setTimeout(() => window.print(), 200);
        else navigate({ to: "/billing/history" });
      }
    } catch (error) {
      console.error("Failed to save bill:", error);
      toast.error("Failed to save bill");
    }
  }

  if (loading) return <PageLoading label="Loading bill form…" />;

  return (
    <>
      <PageHeader
        title="Create Bill"
        subtitle={`Bill ${billNumber} · ${type}`}
        actions={
          <>
            <Button variant="ghost" onClick={handleClear}><RotateCcw className="size-4" /> Clear</Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}><X className="size-4" /> Cancel</Button>
            <Button variant="outline" onClick={() => { const e = validate(); if (e) return toast.error(e); setPreviewOpen(true); }}><Eye className="size-4" /> Preview</Button>
            <Button variant="outline" onClick={() => handleSave(true)}><Printer className="size-4" /> Save & Print</Button>
            <Button onClick={() => handleSave(false)}><Save className="size-4" /> Save bill</Button>
          </>
        }
      />

      {/* HEADER CARD */}
      <Card className="p-5 card-hover mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Shop</div>
              <Select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
              >
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </Select>
            </div>
            <div className="font-display font-bold text-xl text-primary">{selectedShop.name}</div>
            <div className="text-sm text-muted-foreground">{selectedShop.address}</div>
            <div className="text-sm">📞 {selectedShop.phone} · TIN {selectedShop.tin}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bill type">
              <div className="flex rounded-xl bg-muted p-1">
                {(["Cash", "Online"] as const).map((t) => (
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
              {customerList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Order No.">
            <div className="relative">
              <Input
                value={orderNumber}
                onChange={(e) => { setOrderNumber(e.target.value); setOrderNumberAuto(e.target.value === ""); }}
                placeholder={customer ? `Auto: ${new Date(date).getFullYear()}-C???-????` : "e.g. PO-2026-001"}
              />
              {orderNumber && (
                <button
                  type="button"
                  onClick={() => { setOrderNumber(""); setOrderNumberAuto(true); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  title="Clear to auto-generate"
                >✕</button>
              )}
            </div>
            {orderNumberAuto && customer && (
              <p className="text-[11px] text-muted-foreground mt-1">Auto-generated on save</p>
            )}
          </Field>
          <Field label="Party TIN">
            <Input value={partyTin} onChange={(e) => setPartyTin(e.target.value)} />
          </Field>
          <Field label="Customer Phone">
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Customer phone number" />
          </Field>
          <Field label="Customer GSTIN">
            <Input value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} placeholder="Customer GSTIN" />
          </Field>
          <Field label="Vehicle No.">
            <Input
              value={vehicleNumber}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                const p = [raw.slice(0,2), raw.slice(2,4), raw.slice(4,6), raw.slice(6,10)].filter(Boolean).join("-");
                setVehicleNumber(p);
              }}
              placeholder="KA42AB1234"
              maxLength={13}
            />
          </Field>
          <Field label="Transport Details">
            <Input value={transportDetails} onChange={(e) => setTransportDetails(e.target.value)} placeholder="e.g. Post Office - 560001" />
          </Field>
          <Field label="Delivery Address">
            <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Delivery address" />
          </Field>
        </div>

        {customer && (
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{customer.name}</span> · {customer.address} · {customer.phone}
          </div>
        )}
      </Card>

      {/* LINES */}
      <Card className="overflow-hidden card-hover mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground sticky top-0" style={{ background: "linear-gradient(135deg, #122658 0%, #132D6A 50%, #1B3F8A 100%)", color: "#E4C457" }}>
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
              {lines.map((l, i) => <LineRow key={l.id} i={i} l={l} productList={productList} onChange={updateLine} onPickProduct={pickProduct} onRemove={removeLine} onAddNext={addLine} />)}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-border/60">
          <Button variant="outline" onClick={addLine} className="border-dashed border-primary/40 text-primary hover:bg-primary/5">
            <Plus className="size-4" /> Add row
            <span className="text-[11px] text-muted-foreground ml-1">(Enter to add)</span>
          </Button>
        </div>
      </Card>

      {/* TOTALS + NOTES */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 space-y-3 card-hover">
          <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes (won't print)" /></Field>
          <Field label="Terms & conditions"><Textarea value={terms} onChange={(e) => setTerms(e.target.value)} /></Field>
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Amount in words:</span> {numberToIndianWords(totals.grand)}
          </div>
        </Card>
        <Card className="p-5 card-hover">
          <h3 className="font-display font-bold text-lg">Summary</h3>
          <div className="mt-3 space-y-2 text-sm">
            <Row k="Sub total" v={formatINR(totals.sub)} />
            <Row k="Discount" v={"-" + formatINR(totals.disc)} />
            <Row k="CGST" v={"+" + formatINR(totals.cgst)} />
            <Row k="SGST" v={"+" + formatINR(totals.sgst)} />
            <Row k="Round off" v={formatINR(totals.roundOff)} />
            <div className="my-2 h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Grand total</span>
              <span className="font-display text-2xl font-bold text-primary">{formatINR(totals.grand)}</span>
            </div>
            <div className="mt-2 rounded-xl bg-muted/60 p-3 text-[11px] text-muted-foreground italic">
              {numberToIndianWords(totals.grand)}
            </div>
          </div>
        </Card>
      </section>

      {/* Hidden print area for "Save & Print" */}
      <div className="hidden print:block">
        <BillPrint
          bill={{ ...buildBill(), id: "", createdAt: "" }}
          shop={selectedShop}
        />
      </div>

      {previewOpen && (
        <BillPreview
          bill={{ ...buildBill(), id: "", createdAt: "" } as any}
          shop={selectedShop as any}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}

function LineRow({
  i, l, productList, onChange, onPickProduct, onRemove, onAddNext,
}: {
  i: number; l: BillLine;
  productList: ReturnType<typeof useProducts>[0];
  onChange: (i: number, p: Partial<BillLine>) => void;
  onPickProduct: (i: number, pid: string) => void;
  onRemove: (i: number) => void;
  onAddNext: () => void;
}) {
  const amount = (l.quantity || 0) * (l.rate || 0) * (1 - (l.discountPct || 0) / 100) * (1 + (l.gstPct || 0) / 100);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); onAddNext(); } };

  return (
    <tr className="border-t border-border/60 table-row-hover transition-colors animate-in fade-in">
      <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
      <td className="px-3 py-2">
        <select
          className="w-full bg-transparent rounded-lg border border-input px-2.5 py-2 text-sm focus:ring-2 focus:ring-ring outline-none"
          value={l.productId}
          onChange={(e) => onPickProduct(i, e.target.value)}
        >
          <option value="">— Select product —</option>
          {productList.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
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
  return <input {...props} className={"w-full rounded-xl border border-input bg-card/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition-all input-fancy " + (props.className ?? "")} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={"w-full rounded-xl border border-input bg-card/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition-all input-fancy " + (props.className ?? "")} />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={2} className={"w-full rounded-xl border border-input bg-card/60 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring transition-all input-fancy " + (props.className ?? "")} />;
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
      className="w-full rounded-lg border border-input bg-transparent px-2 py-2 text-sm text-right tabular-nums focus:ring-2 focus:ring-ring outline-none input-fancy"
    />
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium tabular-nums">{v}</span></div>;
}

