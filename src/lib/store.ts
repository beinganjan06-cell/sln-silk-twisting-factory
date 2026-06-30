// Lightweight localStorage-backed data layer with a pub/sub hook.
// All entities live under the `sln.*` key namespace.
import { useEffect, useState } from "react";

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
  type: "Cash" | "Credit";
  customerId: string;
  customerSnapshot: { name: string; address: string; tin: string };
  orderNumber: string;
  partyTin: string;
  vehicleNumber: string;
  lines: BillLine[];
  discountTotal: number;
  gstTotal: number;
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
  password: string;
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
  shops: Shop[];
  selectedShopId: string;
  users: User[];
  currentUserId: string | null;
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
  shops: [
    {
      id: "shop-sln",
      name: "Sri Lakshmi Narasimhaswamy Silk Twisting Factory",
      address: "Hosapet Road, Magadi Town - 562 120, Ramanagaram Dist.",
      phone: "94480 17596",
      tin: "29510839729",
      logoVariant: "sln",
    },
    {
      id: "shop-vinayaka",
      name: "Sri Vinayaka Silk Twisting Factory",
      address: "Hosapet Main Road, Magadi Town - 562 120, Ramanagaram Dist.",
      phone: "94480 17596",
      tin: "29510839729",
      logoVariant: "vinayaka",
    },
  ],
  selectedShopId: "shop-sln",
  users: [
    {
      id: "user-sln",
      email: "sln@gmail.com",
      password: "123456",
      defaultShopId: "shop-sln",
    },
    {
      id: "user-vinayaka",
      email: "vinayaka@gmail.com",
      password: "123456",
      defaultShopId: "shop-vinayaka",
    },
  ],
  currentUserId: null,
};

const DEFAULT_UNITS: Unit[] = ["Kg", "Gram", "Piece", "Bundle", "Cone", "Box", "Roll"];
const DEFAULT_CATEGORIES = ["Silk Yarn", "Twisted Silk", "Raw Material", "Finished Goods"];

function seedIfEmpty() {
  if (typeof window === "undefined") return;
  
  // Ensure we always have both shops and both users with fixed IDs!
  const existingSettings = read(KEY.settings, null);
  const finalShops = [
    {
      id: "shop-sln",
      name: "Sri Lakshmi Narasimhaswamy Silk Twisting Factory",
      address: "Hosapet Road, Magadi Town - 562 120, Ramanagaram Dist.",
      phone: "94480 17596",
      tin: "29510839729",
      logoVariant: "sln",
    },
    {
      id: "shop-vinayaka",
      name: "Sri Vinayaka Silk Twisting Factory",
      address: "Hosapet Main Road, Magadi Town - 562 120, Ramanagaram Dist.",
      phone: "94480 17596",
      tin: "29510839729",
      logoVariant: "vinayaka",
    },
  ];
  
  const finalUsers = [
    {
      id: "user-sln",
      email: "sln@gmail.com",
      password: "123456",
      defaultShopId: "shop-sln",
    },
    {
      id: "user-vinayaka",
      email: "vinayaka@gmail.com",
      password: "123456",
      defaultShopId: "shop-vinayaka",
    },
  ];
  
  if (existingSettings) {
    write(KEY.settings, {
      ...existingSettings,
      shops: finalShops,
      users: finalUsers,
      selectedShopId: existingSettings.selectedShopId || "shop-sln",
    });
  } else {
    write(KEY.settings, DEFAULT_SETTINGS);
  }
  
  if (!localStorage.getItem(KEY.units)) write(KEY.units, DEFAULT_UNITS);
  if (!localStorage.getItem(KEY.categories)) write(KEY.categories, DEFAULT_CATEGORIES);
  if (!localStorage.getItem(KEY.products)) {
    const now = new Date().toISOString();
    const sample: Product[] = [
      { id: uid(), name: "Pure Silk Yarn 20/22D", code: "SLK-2022", category: "Silk Yarn", unit: "Kg", rate: 4200, gst: 5, hsn: "5004", active: true, createdAt: now },
      { id: uid(), name: "Twisted Silk 2-Ply", code: "TWS-2P", category: "Twisted Silk", unit: "Kg", rate: 4650, gst: 5, hsn: "5004", active: true, createdAt: now },
      { id: uid(), name: "Twisted Silk 3-Ply", code: "TWS-3P", category: "Twisted Silk", unit: "Kg", rate: 4850, gst: 5, hsn: "5004", active: true, createdAt: now },
      { id: uid(), name: "Silk Cone 500g", code: "CONE-500", category: "Finished Goods", unit: "Cone", rate: 2400, gst: 5, hsn: "5004", active: true, createdAt: now },
    ];
    write(KEY.products, sample);
  }
  if (!localStorage.getItem(KEY.customers)) {
    const sample: Customer[] = [
      { id: uid(), name: "Sri Venkateshwara Silks", phone: "9845012345", address: "Kanakapura Road, Bangalore", gstNumber: "29ABCDE1234F1Z5", tinNumber: "29510111111", state: "Karnataka", district: "Bangalore", balance: 0, active: true },
      { id: uid(), name: "Lakshmi Weavers", phone: "9900112233", address: "Channapatna", gstNumber: "", tinNumber: "29510222222", state: "Karnataka", district: "Ramanagaram", balance: 12500, active: true },
    ];
    write(KEY.customers, sample);
  }
  if (!localStorage.getItem(KEY.bills)) write(KEY.bills, []);
}

if (typeof window !== "undefined") seedIfEmpty();

// ----- Hooks -----
function useStored<T>(key: string, fallback: T): [T, (next: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => read(key, fallback));
  useEffect(() => {
    const l = () => setVal(read(key, fallback));
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, [key]); // eslint-disable-line
  const setter = (next: T | ((p: T) => T)) => {
    const value = typeof next === "function" ? (next as (p: T) => T)(read(key, fallback)) : next;
    write(key, value);
  };
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
export function getCurrentUser(settings?: Settings): User | null {
  const s = settings || getSettings();
  if (!s.currentUserId) return null;
  return s.users.find(u => u.id === s.currentUserId) || null;
}
export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  const s = getSettings();
  return !!s.currentUserId;
}
export function signIn(email: string, password: string): User | null {
  const s = getSettings();
  const user = s.users.find(u => u.email === email && u.password === password);
  if (user) {
    write(KEY.settings, {
      ...s,
      currentUserId: user.id,
      selectedShopId: user.defaultShopId,
    });
    return user;
  }
  return null;
}
export function signOut() {
  const s = getSettings();
  write(KEY.settings, {
    ...s,
    currentUserId: null,
  });
}
export function useAuth() {
  const [authed, setAuthed] = useState<boolean>(() => isAuthed());
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  useEffect(() => {
    const l = () => {
      setAuthed(isAuthed());
      setCurrentUser(getCurrentUser());
    };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { authed, currentUser };
}

// ----- Theme -----
export function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  const s = getSettings();
  write(KEY.settings, { ...s, theme });
}
