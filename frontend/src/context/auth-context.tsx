"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { markAccount } from "@/lib/account";
import { api } from "@/lib/api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
};

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    api("/users/me")
      .then(async (response) => {
        if (!active) {
          return;
        }
        if (response.ok) {
          markAccount();
          setUser(await response.json());
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const response = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      return false;
    }

    markAccount();
    const me = await api("/users/me");
    if (!me.ok) {
      return false;
    }
    setUser(await me.json());
    return true;
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return value;
}
