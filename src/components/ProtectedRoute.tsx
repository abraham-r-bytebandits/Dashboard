import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: ("SUPER_ADMIN" | "ADMIN" | "USER")[];
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    let hasAccess = false;

    // SUPER_ADMIN has access to anything that requires SUPER_ADMIN, ADMIN, or USER
    if (isSuperAdmin && (allowedRoles.includes("SUPER_ADMIN") || allowedRoles.includes("ADMIN") || allowedRoles.includes("USER"))) {
      hasAccess = true;
    }
    // ADMIN has access to things requiring ADMIN or USER
    else if (isAdmin && (allowedRoles.includes("ADMIN") || allowedRoles.includes("USER"))) {
      hasAccess = true;
    }
    // Standard User
    else if (allowedRoles.includes("USER")) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center p-10 h-full w-full">
          <h2 className="text-2xl font-bold text-gray-800">403 - Access Denied</h2>
          <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
