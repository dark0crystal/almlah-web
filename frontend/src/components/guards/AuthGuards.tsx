// components/guards/AuthGuards.tsx
'use client';
import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <h2 className="text-lg font-medium text-gray-900 mb-2">جاري التحقق من الهوية</h2>
      <p className="text-gray-600">يرجى الانتظار...</p>
    </div>
  </div>
);

// Unauthorized Component
const UnauthorizedPage = () => {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.768 0L4.046 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h1>
        <p className="text-gray-600 mb-6">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        <div className="space-y-2">
          <button
            onClick={() => router.back()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            العودة
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            الذهاب للوحة التحكم
          </button>
        </div>
      </div>
    </div>
  );
};

// 1. PAGE GUARD - Protects entire pages/routes
interface PageGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean;
  redirectTo?: string;
}

export const PageGuard: React.FC<PageGuardProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  redirectTo = '/auth/login'
}) => {
  const { 
    isLoading, 
    isInitialized,
    isAuthenticated, 
    hasRole, 
    hasPermission, 
    hasAnyRole, 
    hasAnyPermission,
    initialize 
  } = useAuthStore();
  
  const router = useRouter();

  // Initialize auth store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Handle redirects after auth is initialized
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated()) {
      const currentPath = window.location.pathname;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
    }
  }, [isInitialized, isLoading, isAuthenticated, router, redirectTo]);

  // Show loading while initializing or checking auth
  if (!isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated()) {
    return null;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRoles = requireAll 
      ? requiredRoles.every(role => hasRole(role))
      : hasAnyRole(requiredRoles);
    
    if (!hasRequiredRoles) {
      return <UnauthorizedPage />;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every(permission => hasPermission(permission))
      : hasAnyPermission(requiredPermissions);
    
    if (!hasRequiredPermissions) {
      return <UnauthorizedPage />;
    }
  }

  return <>{children}</>;
};

// 2. COMPONENT GUARD - Protects individual components
interface ComponentGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const ComponentGuard: React.FC<ComponentGuardProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
  showFallback = true
}) => {
  const { 
    isAuthenticated, 
    hasRole, 
    hasPermission, 
    hasAnyRole, 
    hasAnyPermission 
  } = useAuthStore();

  // If not authenticated, don't show anything
  if (!isAuthenticated()) {
    return showFallback ? fallback : null;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRoles = requireAll 
      ? requiredRoles.every(role => hasRole(role))
      : hasAnyRole(requiredRoles);
    
    if (!hasRequiredRoles) {
      return showFallback ? fallback : null;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every(permission => hasPermission(permission))
      : hasAnyPermission(requiredPermissions);
    
    if (!hasRequiredPermissions) {
      return showFallback ? fallback : null;
    }
  }

  return <>{children}</>;
};

// 3. BUTTON GUARD - Protects buttons and interactive elements
interface ButtonGuardProps {
  children: ReactNode;
  onClick: () => void;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean;
  className?: string;
  disabled?: boolean;
  hideIfNoAccess?: boolean;
}

export const ButtonGuard: React.FC<ButtonGuardProps> = ({
  children,
  onClick,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  className = '',
  disabled = false,
  hideIfNoAccess = false
}) => {
  const { 
    isAuthenticated, 
    hasRole, 
    hasPermission, 
    hasAnyRole, 
    hasAnyPermission 
  } = useAuthStore();

  // Check if user has required access
  const hasAccess = () => {
    if (!isAuthenticated()) return false;

    // Check role requirements
    if (requiredRoles.length > 0) {
      const hasRequiredRoles = requireAll 
        ? requiredRoles.every(role => hasRole(role))
        : hasAnyRole(requiredRoles);
      
      if (!hasRequiredRoles) return false;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requireAll
        ? requiredPermissions.every(permission => hasPermission(permission))
        : hasAnyPermission(requiredPermissions);
      
      if (!hasRequiredPermissions) return false;
    }

    return true;
  };

  const userHasAccess = hasAccess();

  // Hide button if user doesn't have access and hideIfNoAccess is true
  if (!userHasAccess && hideIfNoAccess) {
    return null;
  }

  // Disable button if user doesn't have access
  const isDisabled = disabled || !userHasAccess;

  return (
    <button
      onClick={userHasAccess ? onClick : undefined}
      disabled={isDisabled}
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={!userHasAccess ? 'ليس لديك صلاحية لهذا الإجراء' : ''}
    >
      {children}
    </button>
  );
};