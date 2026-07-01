import { Bill } from "./store";
import { get, post, put, del } from "./api";

export interface BillsQueryParams {
  q?: string;
  from?: string;
  to?: string;
}

export const billsAPI = {
  getAll: async (params?: BillsQueryParams): Promise<Bill[]> => {
    const queryString = new URLSearchParams();
    if (params?.q) queryString.set("q", params.q);
    if (params?.from) queryString.set("from", params.from);
    if (params?.to) queryString.set("to", params.to);
    
    const query = queryString.toString() ? `?${queryString.toString()}` : "";
    return get<Bill[]>(`/bills${query}`);
  },

  getById: async (id: string): Promise<Bill> => {
    return get<Bill>(`/bills/${id}`);
  },

  create: async (bill: Omit<Bill, "id" | "createdAt">): Promise<{ success: boolean; bill: Bill }> => {
    return post("/bills", bill);
  },

  update: async (id: string, bill: Partial<Bill>): Promise<{ success: boolean; bill: Bill }> => {
    return put(`/bills/${id}`, bill);
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return del(`/bills/${id}`);
  },

  duplicate: async (id: string): Promise<{ success: boolean; bill: Bill }> => {
    return post(`/bills/${id}/duplicate`, {});
  },
};
