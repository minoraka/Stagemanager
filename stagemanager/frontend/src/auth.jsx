import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("access"));

  useEffect(() => {
    if (!localStorage.getItem("access")) return;
    api.get("/auth/me/").then((r) => setUser(r.data)).catch(() => localStorage.removeItem("access")).finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/token/", { username, password });
    localStorage.setItem("access", data.access);
    const me = await api.get("/auth/me/");
    setUser(me.data);
  };
  const logout = () => {
    localStorage.removeItem("access");
    setUser(null);
  };

  const value = {
    user, loading, login, logout,
    isAdmin: user?.role === "admin",
    canEdit: user?.role === "admin" || user?.role === "manager",
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
