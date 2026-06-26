"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/shared/Spinner";
import api, { User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isServerDown: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    name?: string;
    accessCode?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  connectGoogle: () => void;
  connectGmail: () => Promise<void>;
  disconnectGmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerDown, setIsServerDown] = useState(false);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.auth.getMe();
      setUser(userData);
      setIsServerDown(false);
      return userData;
    } catch (err) {
      // Only clear the session if the error is explicitly an authentication/authorization failure (401 or 403)
      const errorWithStatus = err as { status?: number };
      if (errorWithStatus && (errorWithStatus.status === 401 || errorWithStatus.status === 403)) {
        api.setToken(null);
        setUser(null);
        setIsServerDown(false);
      } else {
        // Network / refused connection error - do not clear session, log error but do not trigger reconnect loop
        console.error("Network error during auth check:", err);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      // Sync localStorage token to sessionStorage on init (for new tabs)
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("token");
        if (stored && !sessionStorage.getItem("token")) {
          sessionStorage.setItem("token", stored);
        }
      }
      await refreshUser();
      setIsLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: userData, token } = await api.auth.login(email, password);
    api.setToken(token);
    setUser(userData);
    router.push("/dashboard");
  }, [router]);

  const signup = useCallback(async (data: {
    email: string;
    password: string;
    name?: string;
    accessCode?: string;
  }) => {
    const { user: userData, token } = await api.auth.signup(data);
    api.setToken(token);
    setUser(userData);
    router.push("/dashboard");
  }, [router]);

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const connectGoogle = useCallback(async () => {
    // Direct login/signup — no ticket needed
    window.location.href = api.auth.googleAuthUrl();
  }, []);

  const connectGmail = useCallback(async () => {
    try {
      // Get a short-lived ticket for the Gmail connection flow (authenticated users only)
      const { ticket } = await api.auth.generateGoogleAuthTicket();
      window.location.href = api.auth.googleAuthUrl(ticket);
    } catch (error) {
      console.error("Failed to initiate Google connection:", error);
      throw error;
    }
  }, []);

  const disconnectGmail = useCallback(async () => {
    await api.auth.disconnectGmail();
    await refreshUser();
  }, [refreshUser]);

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isServerDown,
      login,
      signup,
      logout,
      refreshUser,
      connectGoogle,
      connectGmail,
      disconnectGmail,
    }),
    [
      user,
      isLoading,
      isServerDown,
      login,
      signup,
      logout,
      refreshUser,
      connectGoogle,
      connectGmail,
      disconnectGmail,
    ]
  );



  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected route wrapper
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const { isAuthenticated, isLoading, isServerDown } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated && !isServerDown) {
        router.push("/login");
      }
    }, [isAuthenticated, isLoading, isServerDown, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size={48} className="text-primary" />
        </div>
      );
    }

    if (!isAuthenticated && !isServerDown) {
      return null;
    }

    return <Component {...props} />;
  };
}
