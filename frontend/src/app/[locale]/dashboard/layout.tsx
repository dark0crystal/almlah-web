// app/[locale]/dashboard/layout.tsx - Protected dashboard layout
import { requireAuth } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Get the current path for redirect after login
  const { locale } = await params;
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
    // If there's an error in auth verification, redirect to login
    console.error('Dashboard layout auth error:', error);
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  }
}