// hooks/usePermissions.ts
import { useAuthStore } from '@/stores/authStore';

// Custom hook for easier permission checking with Zustand
export const usePermissions = () => {
  const { 
    user, 
    hasRole, 
    hasAnyRole, 
    hasPermission, 
    hasAnyPermission 
  } = useAuthStore();
  
  return {
    // User info
    user,
    
    // Role checking
    hasRole,
    hasAnyRole,
    isAdmin: () => hasAnyRole(['admin', 'super_admin']),
    isSuperAdmin: () => hasRole('super_admin'),
    isModerator: () => hasAnyRole(['moderator', 'admin', 'super_admin']),
    isUser: () => hasRole('user'),
    
    // Permission checking
    hasPermission,
    hasAnyPermission,
    
    // Common permission patterns
    canCreate: (resource: string) => hasPermission(`can_create_${resource}`),
    canEdit: (resource: string) => hasPermission(`can_edit_${resource}`),
    canDelete: (resource: string) => hasPermission(`can_delete_${resource}`),
    canView: (resource: string) => hasPermission(`can_view_${resource}`),
    canManage: (resource: string) => hasPermission(`can_manage_${resource}`),
    canModerate: (resource: string) => hasPermission(`can_moderate_${resource}`),
    
    // Specific resource permissions
    canCreatePlace: () => hasPermission('can_create_place'),
    canEditPlace: () => hasPermission('can_edit_place'),
    canDeletePlace: () => hasPermission('can_delete_place'),
    canManagePlace: () => hasPermission('can_manage_place'),
    
    canCreateUser: () => hasPermission('can_create_user'),
    canEditUser: () => hasPermission('can_edit_user'),
    canDeleteUser: () => hasPermission('can_delete_user'),
    canManageUser: () => hasPermission('can_manage_user'),
    
    canCreateCategory: () => hasPermission('can_create_category'),
    canEditCategory: () => hasPermission('can_edit_category'),
    canDeleteCategory: () => hasPermission('can_delete_category'),
    canManageCategory: () => hasPermission('can_manage_category'),
    
    canManageRoles: () => hasPermission('can_manage_role'),
    canManagePermissions: () => hasPermission('can_manage_permission'),
    canManageSystem: () => hasPermission('can_manage_system'),
  };
};

// Alternative hook that directly subscribes to specific auth state slices
export const useAuth = () => {
  const { 
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUserData
  } = useAuthStore();

  return {
    user,
    token,
    isLoading,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    refreshUserData
  };
};

// Hook for checking if user is authenticated (optimized)
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated());
};

// Hook for getting current user (optimized)
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user);
};

// Hook for auth loading state (optimized)
export const useAuthLoading = () => {
  return useAuthStore((state) => state.isLoading);
};