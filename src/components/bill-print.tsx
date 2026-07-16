import type { Bill, Shop } from "@/lib/store";
import type { BillDetail, BillDetailLine } from "@/lib/bills";
import { SlnLogo } from "./sln-logo";
import { formatNumber, numberToIndianWords } from "@/lib/format";

// From history page: pass BillDetail (has embedded shop, no separate shop prop needed)
// From create page:  pass Bill + shop prop
type Props =
  | { bill: BillDetail; shop?: never }
  | { bill: Bill; shop: Shop };

export function BillPrint({ bill, shop: shopProp }: Props) {
  // Resolve shop — BillDetail has .shop embedded, create page passes shop prop
  const shop: Shop | BillDetail["shop"] =
    shopProp ?? ("shop" in bill ? bill.shop : { id: "default", name: "", address: "", phone: "", tin: "" });

  // Resolve lines — BillDetail uses BillDetailLine, Bill uses BillLine (same shape after snakeToCamel)
  const lines = bill.lines as BillDetailLine[];

  // Pad to 10 rows for print layout (last 5 reserved for delivery info)
  const padded: (BillDetailLine | null)[] = [...lines];
  while (padded.length < 10) padded.push(null);

  const cgstPct = bill.cgstTotal && bill.subTotal ? ((bill.cgstTotal / bill.subTotal) * 100).toFixed(0) + "%" : "";
  const sgstPct = bill.sgstTotal && bill.subTotal ? ((bill.sgstTotal / bill.subTotal) * 100).toFixed(0) + "%" : "";

  const deliveryRows = [
    { sl: "To:",  desc: "Delivery",                              qty: "",      rate: "",      amt: "" },
    { sl: "",     desc: bill.customerSnapshot.name,               qty: "",      rate: "",      amt: "" },
    { sl: "",     desc: bill.customerSnapshot.address,            qty: "CGST",  rate: cgstPct, amt: bill.cgstTotal ? formatNumber(bill.cgstTotal) : "0" },
    { sl: "Ph:",  desc: bill.customerSnapshot.phone || "—",      qty: "SGST",  rate: sgstPct, amt: bill.sgstTotal ? formatNumber(bill.sgstTotal) : "0" },
    { sl: "GST:", desc: bill.customerSnapshot.gstin || "—",      qty: "",      rate: "",      amt: "" },
  ];
  // Use last 5 slots for delivery; if items overflow, keep items and append delivery
  const itemRows = padded.slice(0, Math.max(padded.length - 5, lines.length));
  while (itemRows.length < padded.length - 5) itemRows.push(null);

  const shortShopName = shop.name.includes("Vinayaka")
    ? "Vinayaka Silk Twisting Factory"
    : "SLN Silk Twisting Factory";

  return (
    <div
      className="print-area mx-auto bg-white text-[#1f2b8a] border border-[#1f2b8a]/60 rounded-md"
      style={{ width: "148mm", height: "210mm", padding: "4mm 6mm", fontFamily: "Inter, sans-serif", overflow: "hidden" }}
    >
      {/* Top strip */}
      <div className="flex items-center justify-between text-[10px] font-semibold">
        <div>TIN : {shop.tin}</div>
        <div className="px-3 py-0.5 border-y-2 border-[#1f2b8a]">CASH / Online BILL</div>
        <div>Mobile : {shop.phone}</div>
      </div>

      {/* Company header */}
      <div className="mt-1 flex items-center justify-center gap-3">
        <SlnLogo size={42} variant={"logoVariant" in shop ? (shop.logoVariant as any) : undefined} />
        <div className="text-center">
          <div className="font-display font-bold text-[#c1121f] leading-tight" style={{ fontSize: 22 }}>
            {shop.name}
          </div>
          <div className="bg-[#1f2b8a] text-white text-[10px] px-2 py-0.5 rounded mt-1 inline-block">
            {shop.address}
          </div>
        </div>
      </div>

      {/* To / Bill No / Date / Time */}
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 text-[11px]">
        <div className="border border-[#1f2b8a]/70 rounded min-h-[110px]" style={{ padding: "10px 14px" }}>
          <div className="font-semibold" style={{ marginBottom: 7 }}>To,</div>
          <div className="font-medium">{bill.customerSnapshot.name}</div>
        </div>
        <div className="w-[55mm] border border-[#1f2b8a]/70 rounded min-h-[110px]" style={{ padding: "10px 12px" }}>
          <Row k="No." v={bill.number} accent />
          <Row k="Date :" v={new Date(bill.date).toLocaleDateString("en-IN")} />
          <Row k="Time :" v={bill.time || "—"} />
        </div>
      </div>

      {/* Items table */}
      <table className="mt-2 w-full text-[11px] border-collapse">
        <thead className="bg-[#eef0ff]">
          <tr className="text-[#1f2b8a]">
            <th className="border border-[#1f2b8a]/70 px-1 py-1 w-[10mm]">Sl.<br />No.</th>
            <th className="border border-[#1f2b8a]/70 px-1 py-1 text-left">DESCRIPTION</th>
            <th className="border border-[#1f2b8a]/70 px-1 py-1 w-[22mm]">QUANTITY</th>
            <th className="border border-[#1f2b8a]/70 px-1 py-1 w-[22mm]">RATE<br /><span className="text-[9px]">Rs.   P.</span></th>
            <th className="border border-[#1f2b8a]/70 px-1 py-1 w-[26mm]">AMOUNT<br /><span className="text-[9px]">Rs.   P.</span></th>
          </tr>
        </thead>
        <tbody>
          {itemRows.map((l, i) => {
            const amount = l
              ? l.quantity * l.rate * (1 - l.discountPct / 100) * (1 + l.gstPct / 100)
              : 0;
            return (
              <tr key={l?.id ?? `empty-${i}`} className="align-top">
                <td className="border border-[#1f2b8a]/40 px-1 py-0.5 text-center h-[7mm]">{l ? i + 1 : ""}</td>
                <td className="border border-[#1f2b8a]/40 px-2 py-0.5">{l?.description ?? ""}</td>
                <td className="border border-[#1f2b8a]/40 px-2 py-0.5 text-right">
                  {l ? `${formatNumber(l.quantity)} ${l.unit}` : ""}
                </td>
                <td className="border border-[#1f2b8a]/40 px-2 py-0.5 text-right tabular-nums">
                  {l ? formatNumber(l.rate) : ""}
                </td>
                <td className="border border-[#1f2b8a]/40 px-2 py-0.5 text-right tabular-nums">
                  {l ? formatNumber(amount) : ""}
                </td>
              </tr>
            );
          })}
          {deliveryRows.map((d, i) => (
            <tr key={`delivery-${i}`} className="align-top">
              <td className="border border-[#1f2b8a]/40 px-1 py-0.5 text-center h-[7mm] font-semibold whitespace-nowrap">{d.sl}</td>
              <td className="border border-[#1f2b8a]/40 px-2 py-0.5">{d.desc}</td>
              <td className="border border-[#1f2b8a]/40 px-2 py-0.5 text-center font-semibold">{d.qty}</td>
              <td className="border border-[#1f2b8a]/40 px-2 py-0.5 text-right tabular-nums">{d.rate}</td>
              <td className="border border-[#1f2b8a]/40 px-2 py-0.5 text-right tabular-nums">{d.amt}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3} />
            <td className="border border-[#1f2b8a]/70 px-2 py-0.5 text-right font-bold bg-[#eef0ff]">SUB TOTAL</td>
            <td className="border border-[#1f2b8a]/70 px-2 py-0.5 text-right tabular-nums bg-[#eef0ff]">
              {formatNumber(bill.subTotal)}
            </td>
          </tr>
          {bill.discountTotal > 0 && (
            <tr>
              <td colSpan={3} />
              <td className="border border-[#1f2b8a]/70 px-2 py-0.5 text-right font-bold bg-[#eef0ff]">LESS DISCOUNT</td>
              <td className="border border-[#1f2b8a]/70 px-2 py-0.5 text-right tabular-nums bg-[#eef0ff]">
                {formatNumber(bill.discountTotal)}
              </td>
            </tr>
          )}
          {bill.roundOff !== 0 && (
            <tr>
              <td colSpan={3} />
              <td className="border border-[#1f2b8a]/70 px-2 py-0.5 text-right font-bold bg-[#eef0ff]">ROUND OFF</td>
              <td className="border border-[#1f2b8a]/70 px-2 py-0.5 text-right tabular-nums bg-[#eef0ff]">
                {formatNumber(bill.roundOff)}
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={3} />
            <td className="border border-[#1f2b8a]/70 px-2 py-0.5 text-right font-bold bg-[#eef0ff]">TOTAL</td>
            <td className="border border-[#1f2b8a]/70 px-2 py-0.5 text-right font-bold tabular-nums bg-[#eef0ff]">
              {formatNumber(bill.grandTotal)}
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="px-2 py-0.5 align-top">
              <div className="mt-1 text-[10px]">
                <span className="font-semibold">In Words Rs.</span> {numberToIndianWords(bill.grandTotal)}
              </div>
            </td>
            <td colSpan={2} className="border border-[#1f2b8a]/70 px-2 py-1 text-right font-semibold text-[#c1121f]">
              For {shortShopName}
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="px-2 py-1 text-[10px]">
              <div>Vehicle No. <span className="font-medium">{bill.vehicleNumber || "—"}</span></div>
              {bill.transportDetails && (
                <div>Transport: <span className="font-medium">{bill.transportDetails}</span></div>
              )}
              <div className="mt-4 border-t border-dashed border-[#1f2b8a]/70 pt-1">
                Sign. of the Buyer / Agent / Authorised Person
              </div>
            </td>
            <td colSpan={2} className="border border-[#1f2b8a]/70 px-2 py-1 text-right align-bottom">
              <div className="mt-8">Proprietor</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="font-semibold">{k}</span>
      <span className={"truncate " + (accent ? "text-[#c1121f] font-bold" : "")}>{v}</span>
    </div>
  );
}
