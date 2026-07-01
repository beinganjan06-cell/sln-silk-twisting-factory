import { User, Shop, Settings } from "./store";
import { post } from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  settings: Settings;
  shops: Shop[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  defaultShopId?: string;
}

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return post<LoginResponse>("/auth/login", data);
  },

  register: async (data: RegisterRequest): Promise<{ success: boolean; user: User }> => {
    return post("/auth/register", data);
  },
};
