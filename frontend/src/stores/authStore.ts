// Simple Authentication Store
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
  roles: string[];
  permissions: string[];
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  googleLogin: (googleToken: string) => Promise<void>;
  googleSignup: (googleToken: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  
  // Getters
  isAuthenticated: () => boolean;
  hasPermission: (permission: string) => boolean;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9000';

// Token Storage Helpers
const setToken = (token: string) => {
  // Store in localStorage
  localStorage.setItem('authToken', token);
  
  // Store in cookie for server-side access
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  document.cookie = `authToken=${token}; path=/; max-age=${maxAge}; samesite=lax`;
  
  console.log('✅ Token stored in localStorage and cookie');
};

const removeToken = () => {
  localStorage.removeItem('authToken');
  document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  console.log('🗑️ Token removed from localStorage and cookie');
};

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Check localStorage first
  const localToken = localStorage.getItem('authToken');
  if (localToken) {
    console.log('💾 Token found in localStorage');
    return localToken;
  }
  
  // Check cookies as fallback
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('authToken='))
    ?.split('=')[1];
    
  if (cookieToken) {
    console.log('🍪 Token found in cookies');
    // If found in cookies but not localStorage, sync it
    localStorage.setItem('authToken', cookieToken);
    return cookieToken;
  }
  
  console.log('❌ No token found in localStorage or cookies');
  return null;
};

// API Calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

const loginWithCredentials = async (email: string, password: string) => {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (!data.success || !data.data.token) {
    throw new Error('Invalid response from server');
  }
  
  return data.data;
};

const loginWithGoogle = async (googleToken: string) => {
  const data = await apiCall('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ token: googleToken }),
  });
  
  if (!data.success || !data.data.token) {
    throw new Error('Invalid response from server');
  }
  
  return data.data;
};

const signupWithCredentials = async (userData: SignupData) => {
  const data = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName
    }),
  });
  
  if (!data.success || !data.data.token) {
    throw new Error('Invalid response from server');
  }
  
  return data.data;
};

const signupWithGoogle = async (googleToken: string) => {
  // For signup, we can use the same Google auth endpoint
  // The backend will handle creating new users automatically
  const data = await apiCall('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ token: googleToken }),
  });
  
  if (!data.success || !data.data.token) {
    throw new Error('Invalid response from server');
  }
  
  return data.data;
};

// Cache user data to reduce API calls
let userDataCache: { token: string; data: User; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchUserData = async (token: string, forceRefresh = false) => {
  // Check cache first
  if (!forceRefresh && userDataCache && 
      userDataCache.token === token && 
      Date.now() - userDataCache.timestamp < CACHE_DURATION) {
    console.log('📦 Using cached user data');
    return userDataCache.data;
  }

  console.log('🔄 Fetching fresh user data');
  const [profileRes, permissionsRes, rolesRes] = await Promise.all([
    apiCall('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    }),
    apiCall('/rbac/my-permissions', {
      headers: { 'Authorization': `Bearer ${token}` },
    }),
    apiCall('/rbac/my-roles', {
      headers: { 'Authorization': `Bearer ${token}` },
    }),
  ]);

  const userData = {
    ...profileRes.data.user,
    permissions: permissionsRes.data?.map((p: { name: string }) => p.name) || [],
    roles: rolesRes.data?.map((r: { role?: { name: string }; name?: string }) => r.role?.name || r.name) || [],
  };

  // Cache the data
  userDataCache = {
    token,
    data: userData,
    timestamp: Date.now()
  };

  return userData;
};

// Create Auth Store
export const useAuthStore = create<AuthState>()((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isLoading: false,

  // Login with email/password
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      // Call backend login API
      const authData = await loginWithCredentials(email, password);
      
      // Store token
      setToken(authData.token);
      
      // Fetch user data
      const userData = await fetchUserData(authData.token);
      
      // Update state
      set({
        user: userData,
        token: authData.token,
        isLoading: false,
      });
      
      console.log('✅ Login successful');
    } catch (error) {
      set({ isLoading: false });
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  // Google Login
  googleLogin: async (googleToken: string) => {
    try {
      set({ isLoading: true });
      
      // Call backend Google auth API
      const authData = await loginWithGoogle(googleToken);
      
      // Store token
      setToken(authData.token);
      
      // Fetch user data
      const userData = await fetchUserData(authData.token);
      
      // Update state
      set({
        user: userData,
        token: authData.token,
        isLoading: false,
      });
      
      console.log('✅ Google login successful');
    } catch (error) {
      set({ isLoading: false });
      console.error('❌ Google login failed:', error);
      throw error;
    }
  },

  // Signup with email/password
  signup: async (userData: SignupData) => {
    try {
      set({ isLoading: true });
      
      // Call backend signup API
      const authData = await signupWithCredentials(userData);
      
      // Store token
      setToken(authData.token);
      
      // Fetch user data
      const userProfile = await fetchUserData(authData.token);
      
      // Update state
      set({
        user: userProfile,
        token: authData.token,
        isLoading: false,
      });
      
      console.log('✅ Signup successful');
    } catch (error) {
      set({ isLoading: false });
      console.error('❌ Signup failed:', error);
      throw error;
    }
  },

  // Google Signup
  googleSignup: async (googleToken: string) => {
    try {
      set({ isLoading: true });
      
      // Call backend Google auth API (handles both login and signup)
      const authData = await signupWithGoogle(googleToken);
      
      // Store token
      setToken(authData.token);
      
      // Fetch user data
      const userData = await fetchUserData(authData.token);
      
      // Update state
      set({
        user: userData,
        token: authData.token,
        isLoading: false,
      });
      
      console.log('✅ Google signup successful');
    } catch (error) {
      set({ isLoading: false });
      console.error('❌ Google signup failed:', error);
      throw error;
    }
  },

  // Logout
  logout: () => {
    removeToken();
    // Clear cache
    userDataCache = null;
    set({
      user: null,
      token: null,
      isLoading: false,
    });
    console.log('✅ Logged out');
  },

  // Check authentication (on app load)
  checkAuth: async () => {
    try {
      const token = getToken();
      
      if (!token) {
        set({ user: null, token: null, isLoading: false });
        return;
      }

      set({ isLoading: true });
      
      // Verify token and get user data
      const userData = await fetchUserData(token);
      
      set({
        user: userData,
        token: token,
        isLoading: false,
      });
      
      console.log('✅ Auth check successful');
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      removeToken();
      // Clear cache on auth failure
      userDataCache = null;
      set({
        user: null,
        token: null,
        isLoading: false,
      });
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const { user, token } = get();
    return !!user && !!token;
  },

  // Check if user has permission
  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.roles.includes('super_admin')) return true;
    
    return user.permissions.includes(permission);
  },
}));

// Export helper functions
export const getAuthToken = () => getToken();
export const isAuthenticated = () => useAuthStore.getState().isAuthenticated();