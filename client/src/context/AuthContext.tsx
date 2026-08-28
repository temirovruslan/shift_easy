import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface User {
  name: string;
  role: "worker" | "manager";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ROLES = ["worker", "manager"] as const;

/**
 * The only shape allowed into browser storage, and the only one accepted back
 * out of it.
 *
 * Two directions, two problems. Writing whatever the API returned means
 * trusting a remote response with something the app later reads as its own
 * state; storing an explicit projection keeps an unexpected field from
 * arriving with it. Reading it back with a bare `JSON.parse` was worse: a
 * corrupted entry threw inside the effect that restores the session, so the
 * app rendered nothing and the user could not even sign out to clear it.
 *
 * Anything that does not match is treated as no session at all.
 */
const asUser = (value: unknown): User | null => {
  if (typeof value !== "object" || value === null) return null;

  const { name, role } = value as Record<string, unknown>;
  if (typeof name !== "string" || name.length === 0) return null;
  if (!ROLES.includes(role as User["role"])) return null;

  return { name, role: role as User["role"] };
};

const readStoredUser = (raw: string | null): User | null => {
  if (!raw) return null;
  try {
    return asUser(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sliding session: resets on every app open. Only expires after 90 days of inactivity.
  const SESSION_MS = 90 * 24 * 60 * 60 * 1000;

  function doLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("loginAt");
    setUser(null);
    setToken(null);
  }

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    const loginAt = Number(localStorage.getItem("loginAt") ?? 0);

    const restored = readStoredUser(savedUser);

    if (savedToken && restored) {
      if (Date.now() - loginAt > SESSION_MS) {
        doLogout();
      } else {
        setUser(restored);
        setToken(savedToken);
        // Slide the expiry window on every app open
        localStorage.setItem("loginAt", String(Date.now()));
      }
    } else if (savedToken || savedUser) {
      // One half present or the stored user unreadable: there is no usable
      // session, and leaving the remains behind would fail the same way on
      // every load.
      doLogout();
    }
    setIsLoading(false);
  }, []);

  function login(user: User, token: string) {
    const safe = asUser(user);
    if (!safe) {
      doLogout();
      return;
    }

    setUser(safe);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(safe));
    localStorage.setItem("token", token);
    localStorage.setItem("loginAt", String(Date.now()));
  }

  function logout() {
    doLogout();
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
