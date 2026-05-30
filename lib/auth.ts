import * as SecureStore from "expo-secure-store";

export interface User {
  id: number;
  username: string;
  role: "user" | "admin" | "super_admin";
}

export const getUser = async (): Promise<User | null> => {
  try {
    const raw = await SecureStore.getItemAsync("user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const setAuth = async (token: string, user: User) => {
  await SecureStore.setItemAsync("token", token);
  await SecureStore.setItemAsync("user", JSON.stringify(user));
};

export const clearAuth = async () => {
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("user");
};

export const isAdmin = (user: User | null) =>
  user?.role === "admin" || user?.role === "super_admin";

export const getImageUrl = (filename: string | null) => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `https://backendreport-production-cd31.up.railway.app/uploads/${filename}`;
};

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
