// Simple Dashboard Layout with Auth Protection
import { requireAuth } from '@/lib/auth-server';

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Wait for params
  await params;
  
  // Check authentication before rendering
  await requireAuth('/dashboard');

  return (
    <div className="dashboard-layout">
      <div className="min-h-screen bg-gray-50">
        <main>{children}</main>
      </div>
    </div>
  );
}