import { requireAuth } from '@/lib/auth-server';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Wait for params
  const { locale } = await params;
  
  // Check authentication before rendering
  await requireAuth('/dashboard');

  return (
    <div className="dashboard-layout min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <DashboardNavigation locale={locale}>
        {children}
      </DashboardNavigation>
    </div>
  );
}