import * as React from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "../features/auth/useAuthStore";

export interface GuardProps {
  children: React.ReactNode;
}

/**
 * Route guard restricting access to authenticated users with active token.
 * @param props - Wrapped route children.
 * @returns Protected view or redirect to login.
 */
export function ProtectedRoute(props: GuardProps) {
  const { children } = props;
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Route guard redirecting authenticated users away from public auth pages.
 * @param props - Wrapped route properties.
 * @returns Public view or redirect to application dashboard.
 */
export function PublicOnlyRoute(props: GuardProps) {
  const { children } = props;
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/profiles" replace />;
  }
  return <>{children}</>;
}
