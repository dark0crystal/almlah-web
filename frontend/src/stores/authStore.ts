// stores/authStore.ts - Updated to store token as 'authToken' in localStorage
import { create } from 'zustand';

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
  roles: UserRole[];
  permissions: string[];
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
}

interface UserRole {
  id: string;
  assigned_at: string;
  assigned_by: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  expires_at: string | null;
  is_active: boolean;
  role: {
    id: string;
    name: string;
    display_name: string;
    is_active: boolean;
  };
  user: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
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
  loadUserData: (authToken: string) => Promise<void>;

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

// Helper functions for localStorage token management
const getTokenFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

const setTokenInStorage = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
  // Also set as httpOnly cookie for server-side access
  document.cookie = `authToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
};

const removeTokenFromStorage = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
  // Also remove old format if it exists
  localStorage.removeItem('auth-storage');
  // Clear the cookie
  document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

// Create Zustand store (without persist middleware)
export const useAuthStore = create<AuthState>()((set, get) => ({
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
      // Get token from localStorage
      const token = getTokenFromStorage();
      
      if (token) {
        set({ token });
        await get().loadUserData(token);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear invalid token
      removeTokenFromStorage();
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

      // Store token in localStorage
      setTokenInStorage(authToken);

    } catch (error) {
      console.error('Failed to load user data:', error);
      // Clear invalid token
      removeTokenFromStorage();
      set({ user: null, token: null });
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
    removeTokenFromStorage();
    set({ 
      user: null, 
      token: null, 
      isLoading: false 
    });
  },

  // Refresh user data
  refreshUserData: async () => {
    const { token } = get();
    if (!token) {
      // Try to get token from localStorage
      const storedToken = getTokenFromStorage();
      if (storedToken) {
        set({ token: storedToken });
        await get().loadUserData(storedToken);
        return;
      }
      return;
    }

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
    return user.roles.some(userRole => 
      userRole.role?.name === roleName && userRole.role?.is_active && userRole.is_active
    );
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
}));

// Initialize auth on app start (call this once in your app)
export const initializeAuth = async () => {
  await useAuthStore.getState().initialize();
};

// Helper function to get current token (useful for API calls)
export const getAuthToken = (): string | null => {
  const state = useAuthStore.getState();
  return state.token || getTokenFromStorage();
};

// Helper function to check if user is authenticated (useful for API calls)
export const isAuthenticated = (): boolean => {
  return useAuthStore.getState().isAuthenticated();
};