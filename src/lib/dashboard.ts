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

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    return get<DashboardStats>("/dashboard");
  },
};
