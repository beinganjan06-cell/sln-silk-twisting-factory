import { get } from "./api";

export interface DashboardStats {
  todaysBills: number;
  todaysSales: number;
  monthlySales: number;
  productsCount: number;
  customersCount: number;
  outstanding: number;
  recentBills: any[];
  chartData: { day: string; sales: number }[];
  topProducts: { name: string; qty: number; amount: number }[];
}

export interface DashboardFilterResult {
  filter: string;
  label: string;
  from?: string;
  to?: string;
  bills?: any[];
  customers?: any[];
  total: number;
  count: number;
}

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    return get<DashboardStats>("/dashboard");
  },

  getFiltered: async (type: "today" | "month" | "outstanding"): Promise<DashboardFilterResult> => {
    return get<DashboardFilterResult>(`/dashboard/filter?type=${type}`);
  },
};
