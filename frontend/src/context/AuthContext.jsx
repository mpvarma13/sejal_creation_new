import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("sc_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("sc_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("sc_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const adminLogin = async (identifier, password) => {
    const { data } = await api.post("/auth/admin-login", { identifier, password });
    localStorage.setItem("sc_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("sc_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("sc_token");
    setUser(null);
  };

  const setTokenAndUser = (token, u) => {
    localStorage.setItem("sc_token", token);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, register, logout, setTokenAndUser, refresh: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
