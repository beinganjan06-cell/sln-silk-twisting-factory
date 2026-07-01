import { Settings, Shop } from "./store";
import { get, put, post } from "./api";

export interface GetSettingsResponse {
  settings: Settings;
  shops: Shop[];
  users: any[];
}

export const settingsAPI = {
  getAll: async (): Promise<GetSettingsResponse> => {
    return get<GetSettingsResponse>("/settings");
  },

  update: async (settings: Partial<Settings>): Promise<{ success: boolean; settings: Settings }> => {
    return put("/settings", settings);
  },

  getShops: async (): Promise<Shop[]> => {
    return get<Shop[]>("/settings/shops");
  },

  createShop: async (shop: Omit<Shop, "id" | "createdAt">): Promise<{ success: boolean; shop: Shop }> => {
    return post("/settings/shops", shop);
  },

  updateShop: async (id: string, shop: Partial<Shop>): Promise<{ success: boolean; shop: Shop }> => {
    return put(`/settings/shops/${id}`, shop);
  },
};
