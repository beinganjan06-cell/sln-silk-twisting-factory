import { Customer } from "./store";
import { get, post, put, del } from "./api";

export const customersAPI = {
  getAll: async (): Promise<Customer[]> => {
    return get<Customer[]>("/customers");
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
