"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("erp_token");
    const storedUser = localStorage.getItem("erp_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("erp_token");
        localStorage.removeItem("erp_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Verify token with backend on load
  useEffect(() => {
    if (!token) return;
    authService
      .me()
      .then((u) => {
        setUser(u);
        localStorage.setItem("erp_user", JSON.stringify(u));
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("erp_token");
        localStorage.removeItem("erp_user");
      });
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    localStorage.setItem("erp_token", res.token);
    localStorage.setItem("erp_user", JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    router.push("/dashboard");
  }, [router]);

  const logout = useCallback(async () => {
    await authService.logout();
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
