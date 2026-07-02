import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import { BillPrint } from "@/components/bill-print";
import type { BillDetail } from "@/lib/bills";
import type { Bill, Shop } from "@/lib/store";

type Props =
  | { bill: BillDetail; shop?: never; onClose: () => void }
  | { bill: Bill & { id: string; createdAt: string }; shop: Shop; onClose: () => void };

const BILL_W = 560;
const BILL_H = 794;

export function BillPreview({ bill, shop, onClose }: Props) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function compute() {
      const scaleX = window.innerWidth / BILL_W;
      const scaleY = window.innerHeight / BILL_H;
      setScale(Math.min(scaleX, scaleY));
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const billNode = shop
    ? <BillPrint bill={bill as any} shop={shop} />
    : <BillPrint bill={bill as BillDetail} />;

  const content = (
    <div
      className="no-print"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        zIndex: 99999,
        background: "linear-gradient(135deg, #122658 0%, #132D6A 50%, #1B3F8A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* floating Print / Close buttons */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "absolute", top: 12, right: 16, zIndex: 100000, display: "flex", gap: 8 }}
      >
        <button
          onClick={() => window.print()}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "linear-gradient(135deg, #8E6720 0%, #AF8732 18%, #C8A247 35%, #E4C457 55%, #F1DB79 78%, #FEF99E 100%)",
            color: "#122658", border: "none", cursor: "pointer",
          }}
        >
          <Printer size={15} /> Print
        </button>
        <button
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "transparent", border: "2px solid #E4C457",
            color: "#FEF99E", cursor: "pointer",
          }}
        >
          <X size={15} /> Close
        </button>
      </div>

      {/* bill scaled to fill full window */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: BILL_W * scale, height: BILL_H * scale, flexShrink: 0 }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: BILL_W, height: BILL_H }}>
          {billNode}
        </div>
      </div>

      {/* print-only */}
      <div className="hidden print:block">{billNode}</div>
    </div>
  );

  return createPortal(content, document.body);
}
