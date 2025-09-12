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
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9000'}/api/v1`;

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
  console.log('🔐 SETTING token in localStorage:', token.substring(0, 20) + '...');
  localStorage.setItem('authToken', token);
  // Also set as cookie for server-side access
  // Use simple cookie setting for development
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  document.cookie = `authToken=${token}; path=/; max-age=${maxAge}; samesite=lax`;
  console.log('🍪 SETTING token in cookie for server-side access');
  
  // Verify cookie was set
  setTimeout(() => {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    console.log('🍪 Cookie verification - authToken present:', !!cookies.authToken);
    if (cookies.authToken) {
      console.log('🍪 Cookie value preview:', cookies.authToken.substring(0, 20) + '...');
    }
  }, 100);
};

const removeTokenFromStorage = (): void => {
  if (typeof window === 'undefined') return;
  console.log('🗑️ REMOVING token from localStorage');
  localStorage.removeItem('authToken');
  // Also remove old format if it exists
  localStorage.removeItem('auth-storage');
  // Clear the cookie
  document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax';
  console.log('🍪 REMOVING token from cookie');
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
      console.warn('Keeping token despite initialization error');
      // Don't clear token during initialization - let it persist
      // removeTokenFromStorage(); // COMMENTED OUT
      // set({ user: null, token: null }); // COMMENTED OUT
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  // Load user data from API
  loadUserData: async (authToken: string) => {
    try {
      // First store the token immediately, regardless of user data loading
      set({ token: authToken, isLoading: false });
      setTokenInStorage(authToken);

      const [profileResponse, permissionsResponse, rolesResponse] = await Promise.all([
        AuthAPI.getUserProfile(authToken),
        AuthAPI.getUserPermissions(authToken),
        AuthAPI.getUserRoles(authToken)
      ]);

      const userData: User = {
        ...profileResponse.data.user,
        permissions: permissionsResponse.data.map((p: { name: string }) => p.name),
        roles: rolesResponse.data
      };

      set({ 
        user: userData, 
        token: authToken,
        isLoading: false 
      });

    } catch (error) {
      console.error('Failed to load user data:', error);
      console.warn('Token preserved despite user data loading failure');
      
      // IMPORTANT: Don't clear the token if user data loading fails
      // The token is still valid, we just couldn't load additional user info
      // removeTokenFromStorage(); // COMMENTED OUT to preserve token
      
      // Keep the token but clear user data
      set({ 
        user: null, 
        token: authToken, // Keep the token
        isLoading: false 
      });
      
      // Don't throw error to prevent login page from showing error
      // throw error; // COMMENTED OUT
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