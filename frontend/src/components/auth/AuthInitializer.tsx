// Simple Auth Initializer
'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication when app loads
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
};