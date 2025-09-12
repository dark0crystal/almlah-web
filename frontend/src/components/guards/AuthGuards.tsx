// Simplified Auth Guards
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// Component Guard
export const ComponentGuard = ({
  children,
  requiredRoles,
  requiredPermissions,
  requireAny = false,
  fallback = null,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAny?: boolean;
  fallback?: React.ReactNode;
}) => {
  const { user, hasPermission } = useAuthStore();

  // Helper function to check roles
  const hasRole = (role: string) => user?.roles?.includes(role) || false;

  // Check if user has required access
  const hasAccess = () => {
    if (!user) return false;

    // If no requirements, allow access
    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    // Check roles
    const roleCheck = requiredRoles?.length 
      ? requireAny 
        ? requiredRoles.some(role => hasRole(role))
        : requiredRoles.every(role => hasRole(role))
      : true;

    // Check permissions
    const permissionCheck = requiredPermissions?.length
      ? requireAny
        ? requiredPermissions.some(permission => hasPermission(permission))
        : requiredPermissions.every(permission => hasPermission(permission))
      : true;

    return roleCheck && permissionCheck;
  };

  if (!hasAccess()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Page Guard
export const PageGuard = ({
  children,
  requiredRoles,
  requiredPermissions,
  requireAny = false,
  redirectTo = '/auth/login'
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAny?: boolean;
  redirectTo?: string;
}) => {
  const { user, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect if not authenticated or authorized
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Check authorization if requirements are specified
      if (requiredRoles?.length || requiredPermissions?.length) {
        const hasRole = (role: string) => user?.roles?.includes(role) || false;
        
        const roleCheck = requiredRoles?.length 
          ? requireAny 
            ? requiredRoles.some(role => hasRole(role))
            : requiredRoles.every(role => hasRole(role))
          : true;

        const permissionCheck = requiredPermissions?.length
          ? requireAny
            ? requiredPermissions.some(permission => user.permissions?.includes(permission))
            : requiredPermissions.every(permission => user.permissions?.includes(permission))
          : true;

        if (!roleCheck || !permissionCheck) {
          router.push('/dashboard?error=insufficient_permissions');
          return;
        }
      }
    }
  }, [user, isLoading, router, redirectTo, requiredRoles, requiredPermissions, requireAny]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};