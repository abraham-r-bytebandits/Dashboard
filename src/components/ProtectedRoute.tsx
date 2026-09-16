import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: ("SUPER_ADMIN" | "ADMIN" | "USER")[];
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isSuperAdmin, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const roles = Array.isArray(user.roles) ? user.roles.map((r) => r.toUpperCase()) : [];
    const hasSuperAdmin = isSuperAdmin || roles.includes("SUPER_ADMIN");
    const hasAdmin = isAdmin || roles.includes("ADMIN");

    let hasAccess = false;

    // SUPER_ADMIN has access to anything
    if (hasSuperAdmin) {
      hasAccess = true;
    }
    // ADMIN has access to things requiring ADMIN or USER
    else if (hasAdmin && (allowedRoles.includes("ADMIN") || allowedRoles.includes("USER"))) {
      hasAccess = true;
    }
    // Standard User
    else if (allowedRoles.includes("USER")) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
