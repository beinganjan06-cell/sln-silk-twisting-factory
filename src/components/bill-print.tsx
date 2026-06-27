import type { Bill, Settings } from "@/lib/store";
import { SlnLogo } from "./sln-logo";
import { formatNumber, numberToIndianWords } from "@/lib/format";

interface Props { bill: Bill; settings: Settings }

export function BillPrint({ bill, settings }: Props) {
  // Pad lines for a printed-receipt feel
  const padded = [...bill.lines];
  while (padded.length < 10) padded.push({ id: "x" + padded.length } as never);

  return (
    <div
      className="print-area mx-auto bg-white text-[#1f2b8a] border border-[#1f2b8a]/60 rounded-md"
      style={{ width: "148mm", minHeight: "210mm", padding: "6mm 7mm", fontFamily: "Inter, sans-serif" }}
    >
      {/* Top strip */}
      <div className="flex items-center justify-between text-[10px] font-semibold">
        <div>TIN : {settings.tin}</div>
        <div className="px-3 py-0.5 border-y-2 border-[#1f2b8a]">CASH /CREDIT BILL</div>
        <div>Mobile : {settings.phone}</div>
      </div>

      {/* Company header */}
      <div className="mt-1 flex items-center justify-center gap-3">
        <SlnLogo size={42} />
        <div className="text-center">
          <div className="font-display font-bold text-[#c1121f] leading-tight" style={{ fontSize: 22 }}>
            {settings.companyName}
          </div>
          <div className="bg-[#1f2b8a] text-white text-[10px] px-2 py-0.5 rounded mt-1 inline-block">
            {settings.address}
          </div>
        </div>
      </div>

      {/* To / No / Date / Time */}
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 text-[11px]">
        <div className="border border-[#1f2b8a]/70 rounded p-2 min-h-[78px]">
          <div className="font-semibold mb-1">To,</div>
          <div className="leading-relaxed">{bill.customerSnapshot.name}</div>
          <div className="leading-relaxed text-[10px]">{bill.customerSnapshot.address}</div>
          <div className="mt-2">Your Order No. <span className="font-medium">{bill.orderNumber || "—"}</span></div>
        </div>
        <div className="w-[55mm] border border-[#1f2b8a]/70 rounded p-2 space-y-1">
          <Row k="No." v={bill.number} accent />
          <Row k="Date :" v={new Date(bill.date).toLocaleDateString("en-IN")} />
          <Row k="Time :" v={bill.time} />
          <Row k="Party TIN :" v={bill.partyTin || bill.customerSnapshot.tin || "—"} />
        </div>
      </div>

      {/* Items table */}
      <table className="mt-2 w-full text-[11px] border-collapse">
        <thead className="bg-[#eef0ff]">
          <tr className="text-[#1f2b8a]">
            <th className="border border-[#1f2b8a]/70 px-1 py-1 w-[10mm]">Sl.<br/>No.</th>
            <th className="border border-[#1f2b8a]/70 px-1 py-1 text-left">DESCRIPTION</th>
            <th className="border border-[#1f2b8a]/70 px-1 py-1 w-[22mm]">QUANTITY</th>
            <th className="border border-[#1f2b8a]/70 px-1 py-1 w-[22mm]">RATE<br/><span className="text-[9px]">Rs.   P.</span></th>
            <th className="border border-[#1f2b8a]/70 px-1 py-1 w-[26mm]">AMOUNT<br/><span className="text-[9px]">Rs.   P.</span></th>
          </tr>
        </thead>
        <tbody>
          {padded.map((l, i) => {
            const real = bill.lines[i];
            const amount = real ? real.quantity * real.rate * (1 - real.discountPct / 100) * (1 + real.gstPct / 100) : 0;
            return (
              <tr key={l.id || i} className="align-top">
                <td className="border border-[#1f2b8a]/40 px-1 py-1 text-center h-[8mm]">{real ? i + 1 : ""}</td>
                <td className="border border-[#1f2b8a]/40 px-2 py-1">{real?.description ?? ""}</td>
                <td className="border border-[#1f2b8a]/40 px-2 py-1 text-right">{real ? `${formatNumber(real.quantity)} ${real.unit}` : ""}</td>
                <td className="border border-[#1f2b8a]/40 px-2 py-1 text-right tabular-nums">{real ? formatNumber(real.rate) : ""}</td>
                <td className="border border-[#1f2b8a]/40 px-2 py-1 text-right tabular-nums">{real ? formatNumber(amount) : ""}</td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={3} />
            <td className="border border-[#1f2b8a]/70 px-2 py-1 text-right font-bold bg-[#eef0ff]">TOTAL</td>
            <td className="border border-[#1f2b8a]/70 px-2 py-1 text-right font-bold tabular-nums bg-[#eef0ff]">
              {formatNumber(bill.grandTotal)}
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="px-2 py-1 text-[10px]">
              <span className="font-semibold">In Words Rs.</span> {numberToIndianWords(bill.grandTotal)}
            </td>
            <td colSpan={2} className="border border-[#1f2b8a]/70 px-2 py-2 text-right font-semibold">
              For SLN Silk Twisting Factory
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="px-2 py-3 text-[10px]">
              <div>Vehicle No. <span className="font-medium">{bill.vehicleNumber || "—"}</span></div>
              <div className="mt-6 border-t border-dashed border-[#1f2b8a]/70 pt-1">Sign. of the Buyer / Agent / Authorised Person</div>
            </td>
            <td colSpan={2} className="border border-[#1f2b8a]/70 px-2 py-2 text-right align-bottom">
              <div className="mt-10">Proprietor</div>
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
