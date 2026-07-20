"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type UserRole = "FULL_ADMIN" | "EXECUTIVE_ADMIN" | "STAFF" | "VIP_USER" | "GENERAL_USER";
export type AdminPermission =
  | "MANAGE_USERS"
  | "RESOLVE_REPORTS"
  | "MARK_MATCHES_CALLED"
  | "MANAGE_ANNOUNCEMENTS"
  | "MANAGE_SETTINGS"
  | "VIEW_STATS";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  nickname: string | null;
  phoneNumber: string;
  address: string;
  emailVerified: boolean;
  isAdmin: boolean;
  isFullAdmin: boolean;
  role: UserRole;
  permissions: AdminPermission[];
  listingRestrictedAt: string | null;
  pointsBalance: number;
} | null;

type SessionContextValue = {
  user: SessionUser;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setUser(data.user);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ user, loading, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
