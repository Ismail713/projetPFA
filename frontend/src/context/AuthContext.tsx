"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("smartmatch-auth");
    if (saved) {
      try {
        const { token: t, user: u } = JSON.parse(saved);
        setToken(t);
        setUser(u);
      } catch {
        localStorage.removeItem("smartmatch-auth");
      }
    }
    setIsLoading(false);
  }, []);

  const setAuth = useCallback((t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem("smartmatch-auth", JSON.stringify({ token: t, user: u }));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("smartmatch-auth");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, setAuth, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
