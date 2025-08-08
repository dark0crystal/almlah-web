"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Main Auth Page - Redirects to login by default
const AuthPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page by default
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
};

export default AuthPage;