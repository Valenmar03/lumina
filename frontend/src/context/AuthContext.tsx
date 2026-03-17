import { createContext, useCallback, useEffect, useState, ReactNode } from "react";
import { setAccessToken } from "../services/api";

export type AuthUser = {
  id: string;
  email: string | null;
  username: string | null;
  role: "OWNER" | "PRO";
  businessId: string;
  professionalId?: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (slug: string, identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchRefresh(): Promise<{ accessToken: string; user?: AuthUser } | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getRedirectUrl(): string {
  const slug = localStorage.getItem("lastSlug");
  return slug ? `/login/${slug}` : "/login";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent refresh on boot
  useEffect(() => {
    let active = true;
    fetchRefresh().then((data) => {
      if (!active) return;
      if (data) {
        setAccessToken(data.accessToken);
        if (data.user) setUser(data.user);
      }
      setIsLoading(false);
    });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (slug: string, identifier: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug, identifier, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Login failed" }));
      throw new Error(data.error ?? "Login failed");
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem("lastSlug", slug);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore network errors on logout
    }
    setAccessToken(null);
    setUser(null);
    window.location.href = getRedirectUrl();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
