// components/auth/AuthRecovery.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Client-side component to handle auth recovery
export const AuthRecovery = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    // Check if we have a token in localStorage but no cookie
    const localStorageToken = localStorage.getItem('authToken');
    
    if (localStorageToken) {
      // Check if cookie exists
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      if (!cookies.authToken) {
        console.log('🔄 AuthRecovery: Found token in localStorage, syncing to cookie and refreshing...');
        
        // Set the cookie
        const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
        document.cookie = `authToken=${localStorageToken}; path=/; max-age=${maxAge}; samesite=lax`;
        
        // Refresh the page to re-trigger server-side auth with the new cookie
        setTimeout(() => {
          router.refresh();
        }, 100);
      }
    }
  }, [router]);

  return <>{children}</>;
};