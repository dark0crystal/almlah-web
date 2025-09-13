// contexts/AuthContext.tsx
'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  refreshUserData: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8080/api/v1';

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

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('authToken');
        if (savedToken) {
          await loadUserData(savedToken);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Load user data from API
  const loadUserData = async (authToken: string) => {
    try {
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

      setUser(userData);
      setToken(authToken);
      localStorage.setItem('authToken', authToken);
    } catch (error) {
      console.error('Failed to load user data:', error);
      throw error;
    }
  };

  // Login function - call this from your existing login page
  const login = async (authToken: string) => {
    setIsLoading(true);
    try {
      await loadUserData(authToken);
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    // Redirect to login will be handled by route guards
  };

  // Permission checking functions
  const hasRole = (roleName: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => role.name === roleName && role.isActive);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    // Super admin has all permissions
    if (hasRole('super_admin')) return true;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (!token) return;
    try {
      await loadUserData(token);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      logout();
    }
  };

  const isAuthenticated = !!user && !!token;

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};