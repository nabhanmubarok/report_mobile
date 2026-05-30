import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "https://backendreport-production-cd31.up.railway.app/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("user");
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data: { username: string; password: string }) => api.post("/users/login", data),
  register: (data: { username: string; password: string }) => api.post("/users/register", data),
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data: { username: string }) => api.put("/users/profile", data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put("/users/profile/change-password", data),
  updateAvatar: (formData: FormData) =>
    api.put("/users/profile/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

export const reportApi = {
  getAll: (params?: { status?: string; category_id?: number; page?: number; limit?: number }) =>
    api.get("/reports", { params }),
  getById: (id: number) => api.get(`/reports/${id}`),
  create: (formData: FormData) =>
    api.post("/reports", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  updateStatus: (id: number, status: string) => api.patch(`/reports/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/reports/${id}`),
  getCategories: () => api.get("/reports/categories"),
};

export const commentApi = {
  getByReport: (reportId: number) => api.get(`/comments/report/${reportId}`),
  create: (data: { body: string; public_report_id: number }) => api.post("/comments", data),
  update: (id: number, body: string) => api.put(`/comments/${id}`, { body }),
  delete: (id: number) => api.delete(`/comments/${id}`),
};

export const notificationApi = {
  getAll: () => api.get("/notifications"),
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
};

export default api;
