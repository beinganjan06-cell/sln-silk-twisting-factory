import { snakeToCamel, camelToSnake } from "./utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://192.168.1.7:5000/api";

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
}

export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const baseUrl = API_BASE_URL;
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data = await response.json();
    data = snakeToCamel(data);

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};

export const get = <T>(endpoint: string) =>
  apiRequest<T>(endpoint, { method: "GET" });

export const post = <T>(endpoint: string, body: any) =>
  apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(camelToSnake(body)),
  });

export const put = <T>(endpoint: string, body: any) =>
  apiRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(camelToSnake(body)),
  });

export const del = <T>(endpoint: string) =>
  apiRequest<T>(endpoint, { method: "DELETE" });
