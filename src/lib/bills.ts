import { Bill, getBills, Shop, getAuthState } from "./store";
import { get, post, put, del } from "./api";

export interface BillsQueryParams {
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

// ── GET /bills ── only the 6 table columns
// Backend returns snake_case → snakeToCamel converts → camelCase fields below
export interface BillListItem {
  id: string;            // id
  number: string;        // number
  date: string;          // date
  customerName: string;  // customer_name → customerName
  type: "Cash" | "Credit"; // type
  itemCount: number;     // item_count → itemCount
  grandTotal: number;    // grand_total → grandTotal
}

// ── GET /bills/:id ── full detail with embedded shop
// Every field name here is exactly what snakeToCamel produces from the backend
export interface BillDetailLine {
  id: string;
  productId: string;     // ← product_id
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPct: number;   // ← discount_pct
  gstPct: number;        // ← gst_pct
}

export interface BillDetailShop {
  id: string;
  name: string;
  address: string;
  phone: string;
  tin: string;
  logoVariant: string;   // ← logo_variant
}

export interface BillDetail {
  id: string;
  number: string;
  date: string;
  time: string;
  type: "Cash" | "Credit";
  customerId: string;           // ← customer_id
  customerSnapshot: {           // ← customer_snapshot (nested, keys unchanged)
    name: string;
    address: string;
    tin: string;
  };
  orderNumber: string;          // ← order_number
  partyTin: string;             // ← party_tin
  vehicleNumber: string;        // ← vehicle_number
  lines: BillDetailLine[];
  discountTotal: number;        // ← discount_total
  gstTotal: number;             // ← gst_total
  subTotal: number;             // ← sub_total
  roundOff: number;             // ← round_off
  grandTotal: number;           // ← grand_total
  notes: string;
  terms: string;
  shopId: string;               // ← shop_id
  shop: BillDetailShop;         // ← embedded shop object
  createdAt: string;            // ← created_at
}

// ── local fallbacks when API is unreachable ──

function applyFilters(bills: Bill[], params?: BillsQueryParams): Bill[] {
  if (!params) return bills;
  return bills.filter((b) => {
    const q = params.q?.trim().toLowerCase();
    const matchQ = !q || [b.number, b.customerSnapshot.name].some((v) => v.toLowerCase().includes(q));
    const matchFrom = !params.from || new Date(b.date) >= new Date(params.from);
    const matchTo = !params.to || new Date(b.date) <= new Date(params.to);
    return matchQ && matchFrom && matchTo;
  });
}

function toListItem(b: Bill): BillListItem {
  return {
    id: b.id,
    number: b.number,
    date: b.date,
    customerName: b.customerSnapshot.name,
    type: b.type,
    itemCount: b.lines.length,
    grandTotal: b.grandTotal,
  };
}

function toDetail(b: Bill): BillDetail {
  const shops = getAuthState().shops ?? [];
  const s: Shop = shops.find((s) => s.id === b.shopId) ?? shops[0] ?? { id: "default", name: "", address: "", phone: "", tin: "" };
  return {
    id: b.id,
    number: b.number,
    date: b.date,
    time: b.time,
    type: b.type,
    customerId: b.customerId,
    customerSnapshot: b.customerSnapshot,
    orderNumber: b.orderNumber,
    partyTin: b.partyTin,
    vehicleNumber: b.vehicleNumber,
    lines: b.lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      rate: l.rate,
      discountPct: l.discountPct,
      gstPct: l.gstPct,
    })),
    discountTotal: b.discountTotal,
    gstTotal: b.gstTotal,
    subTotal: b.subTotal,
    roundOff: b.roundOff,
    grandTotal: b.grandTotal,
    notes: b.notes,
    terms: b.terms,
    shopId: b.shopId,
    shop: { id: s.id, name: s.name, address: s.address, phone: s.phone, tin: s.tin, logoVariant: s.logoVariant ?? "sln" },
    createdAt: b.createdAt,
  };
}

// ── API ──

export const billsAPI = {
  getAll: async (params?: BillsQueryParams): Promise<PaginatedResponse<BillListItem>> => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.perPage) qs.set("per_page", String(params.perPage));
    if (params?.sortBy) qs.set("sort_by", params.sortBy);
    if (params?.sortDir) qs.set("sort_dir", params.sortDir);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    try {
      return await get<PaginatedResponse<BillListItem>>(`/bills${query}`);
    } catch (err) {
      console.warn("API unavailable, using local store:", err);
      const filtered = applyFilters(getBills(), params);
      const page = params?.page ?? 1;
      const perPage = params?.perPage ?? 15;
      const paged = filtered.slice((page - 1) * perPage, page * perPage);
      return { data: paged.map(toListItem), total: filtered.length, page, perPage, pages: Math.max(1, Math.ceil(filtered.length / perPage)) };
    }
  },

  getById: async (id: string): Promise<BillDetail> => {
    try {
      return await get<BillDetail>(`/bills/${id}`);
    } catch (err) {
      console.warn("API unavailable, using local store:", err);
      const bill = getBills().find((b) => b.id === id);
      if (!bill) throw new Error("Bill not found");
      return toDetail(bill);
    }
  },

  create: async (bill: Omit<Bill, "id" | "createdAt">): Promise<{ success: boolean; bill: BillDetail }> => {
    return post("/bills", bill);
  },

  update: async (id: string, bill: Partial<Bill>): Promise<{ success: boolean; bill: BillDetail }> => {
    return put(`/bills/${id}`, bill);
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return del(`/bills/${id}`);
  },

  duplicate: async (id: string): Promise<{ success: boolean; bill: BillDetail }> => {
    return post(`/bills/${id}/duplicate`, {});
  },
};
