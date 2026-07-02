import { Product } from "./store";
import { get, post, put, del } from "./api";
import type { PaginatedResponse } from "./bills";

export interface ProductsQueryParams {
  q?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const productsAPI = {
  getAll: async (params?: ProductsQueryParams): Promise<PaginatedResponse<Product>> => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.perPage) qs.set("per_page", String(params.perPage));
    if (params?.sortBy) qs.set("sort_by", params.sortBy);
    if (params?.sortDir) qs.set("sort_dir", params.sortDir);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return get<PaginatedResponse<Product>>(`/products${query}`);
  },

  getById: async (id: string): Promise<Product> => {
    return get<Product>(`/products/${id}`);
  },

  create: async (product: Omit<Product, "id" | "createdAt">): Promise<{ success: boolean; product: Product }> => {
    return post("/products", product);
  },

  update: async (id: string, product: Partial<Product>): Promise<{ success: boolean; product: Product }> => {
    return put(`/products/${id}`, product);
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return del(`/products/${id}`);
  },
};
