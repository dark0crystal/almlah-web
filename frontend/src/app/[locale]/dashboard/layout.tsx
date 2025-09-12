// app/[locale]/dashboard/layout.tsx - Protected dashboard layout
import { requireAuth } from '@/lib/auth-server';
import { AuthRecovery } from '@/components/auth/AuthRecovery';

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Get the current path for redirect after login
  await params; // Consume params to avoid unused variable warning
  const currentPath = `/dashboard`;
  
  try {
    // Require authentication to access dashboard
    await requireAuth(currentPath);
    
    // If we get here, user is authenticated
    return (
      <div className="dashboard-layout">
        {children}
      </div>
    );
  } catch (error) {
    // If there's an error in auth verification, it might be due to missing cookie
    // Let the client-side component handle auth recovery first
    console.error('Dashboard layout auth error:', error);
    
    return (
      <AuthRecovery>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </AuthRecovery>
    );
  }
}