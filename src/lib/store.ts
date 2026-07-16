// Lightweight localStorage-backed data layer with a pub/sub hook.
// All entities live under the `sln.*` key namespace.
import { useCallback, useEffect, useState } from "react";

export type Unit = "Kg" | "Gram" | "Piece" | "Bundle" | "Cone" | "Box" | "Roll" | string;

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: Unit;
  rate: number;
  gst: number;
  hsn: string;
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  gstNumber: string;
  tinNumber: string;
  state: string;
  district: string;
  balance: number;
  active: boolean;
}

export interface BillLine {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unit: Unit;
  rate: number;
  discountPct: number;
  gstPct: number;
}

export interface Bill {
  id: string;
  number: string;
  date: string; // ISO
  time: string;
  type: "Cash" | "Online";
  customerId: string;
  customerSnapshot: { name: string; address: string; phone: string; tin: string; gstin: string };
  orderNumber: string;
  partyTin: string;
  vehicleNumber: string;
  transportDetails: string;
  deliveryAddress: string;
  lines: BillLine[];
  discountTotal: number;
  gstTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  subTotal: number;
  roundOff: number;
  grandTotal: number;
  notes: string;
  terms: string;
  createdAt: string;
  shopId: string;
}

export interface User {
  id: string;
  email: string;
  defaultShopId: string;
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  tin: string;
  logoVariant?: "sln" | "vinayaka";
}

export interface Settings {
  companyName: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  tin: string;
  billPrefix: string;
  nextBillNumber: number;
  defaultGst: number;
  currency: string;
  theme: "light" | "dark";
  bank: string;
  upi: string;
  selectedShopId: string;
}

const KEY = {
  products: "sln.products",
  customers: "sln.customers",
  bills: "sln.bills",
  categories: "sln.categories",
  units: "sln.units",
  settings: "sln.settings",
  auth: "sln.auth",
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
  notify();
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ----- Defaults / seed -----
const DEFAULT_SETTINGS: Settings = {
  companyName: "Sri Lakshmi Narasimhaswamy Silk Twisting Factory",
  ownerName: "Proprietor",
  address: "Hosapet Road, Magadi Town - 562 120, Ramanagaram Dist.",
  phone: "94480 17596",
  email: "",
  gst: "",
  tin: "29510839729",
  billPrefix: "SLN",
  nextBillNumber: 180,
  defaultGst: 5,
  currency: "INR",
  theme: "light",
  bank: "",
  upi: "",
  selectedShopId: "shop-sln",
};

const DEFAULT_UNITS: Unit[] = ["Kg", "Gram", "Piece", "Bundle", "Cone", "Box", "Roll"];
const DEFAULT_CATEGORIES = ["Silk Yarn", "Twisted Silk", "Raw Material", "Finished Goods"];

// ----- Hooks -----

function normalizeStoredValue<T>(value: T, fallback: T): T {
  if (Array.isArray(fallback)) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object" && Array.isArray((value as any).data)) {
      return (value as any).data as T;
    }
    return fallback;
  }
  return value;
}

function useStored<T>(key: string, fallback: T): [T, (next: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => normalizeStoredValue(read(key, fallback), fallback));
  useEffect(() => {
    const l = () => setVal(normalizeStoredValue(read(key, fallback), fallback));
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, [key, fallback]); 
  
  const setter = useCallback((next: T | ((p: T) => T)) => {
    const current = normalizeStoredValue(read(key, fallback), fallback);
    const value = typeof next === "function" ? (next as (p: T) => T)(current) : next;
    write(key, value);
  }, [key, fallback]);
  
  return [val, setter];
}

export const useProducts = () => useStored<Product[]>(KEY.products, []);
export const useCustomers = () => useStored<Customer[]>(KEY.customers, []);
export const useBills = () => useStored<Bill[]>(KEY.bills, []);
export const useCategories = () => useStored<string[]>(KEY.categories, DEFAULT_CATEGORIES);
export const useUnits = () => useStored<Unit[]>(KEY.units, DEFAULT_UNITS);
export const useSettings = () => useStored<Settings>(KEY.settings, DEFAULT_SETTINGS);

// ----- One-shot getters / mutators (non-hook) -----
export const getSettings = () => read<Settings>(KEY.settings, DEFAULT_SETTINGS);
export const getProducts = () => read<Product[]>(KEY.products, []);
export const getCustomers = () => read<Customer[]>(KEY.customers, []);
export const getBills = () => read<Bill[]>(KEY.bills, []);

export function saveProducts(products: Product[]) {
  write(KEY.products, products);
}
export function saveCustomers(customers: Customer[]) {
  write(KEY.customers, customers);
}
export function saveBills(bills: Bill[]) {
  write(KEY.bills, bills);
}
export function saveSettings(settings: Settings) {
  write(KEY.settings, settings);
  applyTheme(settings.theme);
}

export function nextBillNumber(): string {
  const s = getSettings();
  const num = s.nextBillNumber;
  return `${s.billPrefix}-${String(num).padStart(4, "0")}`;
}
export function advanceBillNumber() {
  const s = getSettings();
  write(KEY.settings, { ...s, nextBillNumber: s.nextBillNumber + 1 });
}

export function saveBill(bill: Bill) {
  const bills = getBills();
  const idx = bills.findIndex((b) => b.id === bill.id);
  if (idx >= 0) bills[idx] = bill;
  else bills.unshift(bill);
  write(KEY.bills, bills);
}
export function deleteBill(id: string) {
  write(KEY.bills, getBills().filter((b) => b.id !== id));
}

export const newId = uid;

// ----- Auth (with users) -----
export interface AuthState {
  isAuthed: boolean;
  user: User | null;
  settings: Settings | null;
  shops: Shop[];
}
const DEFAULT_AUTH_STATE: AuthState = {
  isAuthed: false,
  user: null,
  settings: null,
  shops: [],
};

export function getAuthState(): AuthState {
  return read<AuthState>(KEY.auth, DEFAULT_AUTH_STATE);
}
export function setAuthState(authState: AuthState) {
  write(KEY.auth, authState);
  if (authState.settings) {
    write(KEY.settings, authState.settings);
    applyTheme(authState.settings.theme);
  }
}
export function isAuthed(): boolean {
  return getAuthState().isAuthed;
}
export function signOut() {
  setAuthState(DEFAULT_AUTH_STATE);
}
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => getAuthState());
  useEffect(() => {
    const l = () => setAuthState(getAuthState());
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return authState;
}

// ----- Theme -----
export function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
