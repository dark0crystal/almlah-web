// components/auth/AuthInitializer.tsx
'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Helper function to check if cookie exists
const getCookieValue = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  return cookies[name] || null;
};

// Helper function to set cookie
const setCookie = (name: string, value: string) => {
  if (typeof window === 'undefined') return;
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
  console.log('🔄 AuthInitializer: Token synced to cookie for server-side access');
};

// Component to initialize auth store - use this once in your app
export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { initialize, isInitialized, token, user } = useAuthStore();

  useEffect(() => {
    console.log('AuthInitializer: useEffect triggered, isInitialized:', isInitialized);
    if (!isInitialized) {
      console.log('AuthInitializer: Calling initialize()');
      initialize();
    }
  }, [initialize, isInitialized]);

  useEffect(() => {
    console.log('AuthInitializer: Auth state changed - token:', !!token, 'user:', !!user, 'isInitialized:', isInitialized);
  }, [token, user, isInitialized]);

  // Sync token from localStorage to cookie if cookie is missing but localStorage has token
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    const localStorageToken = localStorage.getItem('authToken');
    const cookieToken = getCookieValue('authToken');

    if (localStorageToken && !cookieToken) {
      console.log('🔄 AuthInitializer: Found token in localStorage but not in cookie, syncing...');
      setCookie('authToken', localStorageToken);
      
      // Also update the Zustand store if it doesn't have the token
      if (!token) {
        console.log('🔄 AuthInitializer: Also updating Zustand store with recovered token');
        useAuthStore.getState().loadUserData(localStorageToken);
      }
    }
  }, [isInitialized, token]);

  return <>{children}</>;
};

// Alternative: Hook version if you prefer
export const useAuthInitializer = () => {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);
};