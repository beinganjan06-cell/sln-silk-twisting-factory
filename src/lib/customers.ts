import { Customer } from "./store";
import { get, post, put, del } from "./api";
import type { PaginatedResponse } from "./bills";

export interface CustomersQueryParams {
  q?: string;
  outstanding?: boolean;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const customersAPI = {
  getAll: async (params?: CustomersQueryParams): Promise<PaginatedResponse<Customer>> => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.outstanding) qs.set("outstanding", "true");
    if (params?.page) qs.set("page", String(params.page));
    if (params?.perPage) qs.set("per_page", String(params.perPage));
    if (params?.sortBy) qs.set("sort_by", params.sortBy);
    if (params?.sortDir) qs.set("sort_dir", params.sortDir);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return get<PaginatedResponse<Customer>>(`/customers${query}`);
  },

  getById: async (id: string): Promise<Customer> => {
    return get<Customer>(`/customers/${id}`);
  },

  create: async (customer: Omit<Customer, "id">): Promise<{ success: boolean; customer: Customer }> => {
    return post("/customers", customer);
  },

  update: async (id: string, customer: Partial<Customer>): Promise<{ success: boolean; customer: Customer }> => {
    return put(`/customers/${id}`, customer);
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return del(`/customers/${id}`);
  },
};
