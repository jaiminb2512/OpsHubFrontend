// src/components/common/RoleBasedRoute.tsx

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUserRole } from '../../Services/ApiServices';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export const RoleBasedRoute = ({ children, allowedRoles, requireAuth = true }: RoleBasedRouteProps) => {
  // Check authentication
  if (requireAuth && !isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If no role restrictions, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Get current user role
  const userRole = getCurrentUserRole()?.toLowerCase();

  // Check if user role is in allowed roles
  if (userRole && allowedRoles.some(role => role.toLowerCase() === userRole)) {
    return <>{children}</>;
  }

  // Redirect to dashboard if not authorized
  return <Navigate to="/dashboard" replace />;
};

