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

    if (savedToken && savedUser) {
      if (Date.now() - loginAt > SESSION_MS) {
        doLogout();
      } else {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        // Slide the expiry window on every app open
        localStorage.setItem("loginAt", String(Date.now()));
      }
    }
    setIsLoading(false);
  }, []);

  function login(user: User, token: string) {
    setUser(user);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(user));
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
