import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "../api/axios";

// Define types for User Profile
interface UserProfile {
  id: string;
  accountPublicId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: string;
}

// Define types for User
interface User {
  id: string;
  publicId: string;
  email: string;
  username: string;
  status: string;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  profile: UserProfile;
  roles: string[];
  permissions: string[];
  providers: string[];
}

// Define types for Auth context
interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (identifier: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onAuthSuccess: (accessToken: string, refreshToken: string, remember: boolean) => Promise<void>;
}

// Define types for login response
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

// Create context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props type for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Robustly determine if the user is an admin
  const isAdmin = (() => {
    if (!user) return false;
    const actualUser = user.data ? user.data : user;
    const roles = Array.isArray(actualUser.roles) ? actualUser.roles : actualUser.roles ? [actualUser.roles] : [];
    if (actualUser.role) roles.push(actualUser.role);

    return roles.some((r: any) => {
      if (typeof r === 'string') return r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN';
      if (typeof r === 'object' && r.name) return r.name.toUpperCase() === 'ADMIN' || r.name.toUpperCase() === 'SUPER_ADMIN';
      return false;
    });
  })();

  const isSuperAdmin = (() => {
    if (!user) return false;
    const actualUser = user.data ? user.data : user;
    const roles = Array.isArray(actualUser.roles) ? actualUser.roles : actualUser.roles ? [actualUser.roles] : [];
    if (actualUser.role) roles.push(actualUser.role);

    return roles.some((r: any) => {
      if (typeof r === 'string') return r.toUpperCase() === 'SUPER_ADMIN';
      if (typeof r === 'object' && r.name) return r.name.toUpperCase() === 'SUPER_ADMIN';
      return false;
    });
  })();

  // Load user on app start
  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        const accessToken: string | null =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");

        if (!accessToken) {
          setShowModal(true);
          setLoading(false);
          return;
        }

        const res = await api.get<any>("/user/profile");
        setUser(res.data?.data ? res.data.data : res.data);
      } catch (error) {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const onAuthSuccess = async (accessToken: string, refreshToken: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("refreshToken", refreshToken);
    }
    const me = await api.get<any>("/user/profile");
    setUser(me.data?.data ? me.data.data : me.data);
    setShowModal(false);
  };

  const login = async (
    identifier: string,
    password: string,
    remember: boolean
  ): Promise<void> => {
    // Heuristic: if input is mostly digits, treat as phone number, otherwise treat as email
    const isPhone = /^\+?[\d\s\-\(\)]+$/.test(identifier) && identifier.replace(/\D/g, '').length >= 7;
    const payload = isPhone 
      ? { phone: identifier, password, remember }
      : { email: identifier, password, remember };

    const res = await api.post<LoginResponse>("/auth/login", payload);

    const { accessToken, refreshToken } = res.data;
    await onAuthSuccess(accessToken, refreshToken, remember);
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken: string | null =
        localStorage.getItem("refreshToken") ||
        sessionStorage.getItem("refreshToken");

      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (err) {
      console.error("Logout error");
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setShowModal(true);
    }
  };

  const value: AuthContextType = {
    user,
    setUser,
    login,
    logout,
    showModal,
    setShowModal,
    loading,
    isAdmin,
    isSuperAdmin,
    onAuthSuccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook with type safety
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};