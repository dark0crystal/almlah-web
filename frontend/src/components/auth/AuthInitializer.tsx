// components/auth/AuthInitializer.tsx
'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

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