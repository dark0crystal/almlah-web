// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePicture: string;
  userType: string;
  provider: string;
  isVerified: boolean;
  roles: Role[];
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  initialize: () => Promise<void>;

  // Computed getters
  isAuthenticated: () => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

// API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

class AuthAPI {
  static async getUserProfile(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  }

  static async getUserPermissions(token: string) {
    const response = await fetch(`${API_BASE_URL}/rbac/my-permissions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch permissions');
    return response.json();
  }

  static async getUserRoles(token: string) {
    const response = await fetch(`${API_BASE_URL}/rbac/my-roles`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch roles');
    return response.json();
  }
}

// Create Zustand store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      isInitialized: false,

      // Initialize auth from localStorage
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        set({ isLoading: true });

        try {
          // Get token from persisted state
          const { token } = state;
          
          if (token) {
            await get().loadUserData(token);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Clear invalid token
          set({ user: null, token: null });
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      // Load user data from API
      loadUserData: async (authToken: string) => {
        try {
          const [profileResponse, permissionsResponse, rolesResponse] = await Promise.all([
            AuthAPI.getUserProfile(authToken),
            AuthAPI.getUserPermissions(authToken),
            AuthAPI.getUserRoles(authToken)
          ]);

          const userData: User = {
            ...profileResponse.data.user,
            permissions: permissionsResponse.data.map((p: any) => p.name),
            roles: rolesResponse.data
          };

          set({ 
            user: userData, 
            token: authToken,
            isLoading: false 
          });

        } catch (error) {
          console.error('Failed to load user data:', error);
          throw error;
        }
      },

      // Login function
      login: async (authToken: string) => {
        set({ isLoading: true });
        try {
          await get().loadUserData(authToken);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Logout function
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isLoading: false 
        });
      },

      // Refresh user data
      refreshUserData: async () => {
        const { token } = get();
        if (!token) return;

        try {
          await get().loadUserData(token);
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          get().logout();
        }
      },

      // Computed getters
      isAuthenticated: () => {
        const { user, token } = get();
        return !!user && !!token;
      },

      hasRole: (roleName: string) => {
        const { user } = get();
        if (!user?.roles) return false;
        return user.roles.some(role => role.name === roleName && role.isActive);
      },

      hasAnyRole: (roleNames: string[]) => {
        const { hasRole } = get();
        return roleNames.some(roleName => hasRole(roleName));
      },

      hasPermission: (permission: string) => {
        const { user, hasRole } = get();
        if (!user?.permissions) return false;
        // Super admin has all permissions
        if (hasRole('super_admin')) return true;
        return user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions: string[]) => {
        const { hasPermission } = get();
        return permissions.some(permission => hasPermission(permission));
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        token: state.token,
        user: state.user 
      }), // Only persist token and user
    }
  )
);

// Initialize auth on app start (call this once in your app)
export const initializeAuth = async () => {
  await useAuthStore.getState().initialize();
};