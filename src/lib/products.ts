import { Product } from "./store";
import { get, post, put, del } from "./api";

export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    return get<Product[]>("/products");
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
