// app/[locale]/dashboard/admin/layout.tsx - Protected admin layout
import { requireAnyRole } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  try {
    // Require admin or super_admin role to access admin section
    await requireAnyRole(['admin', 'super_admin']);
    
    return (
      <div className="admin-layout" style={{backgroundColor: '#f3f3eb'}}>
        {children}
      </div>
    );
  } catch (error) {
    console.error('Admin layout auth error:', error);
    redirect(`/${locale}/dashboard?error=insufficient_permissions`);
  }
}