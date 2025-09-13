// app/[locale]/dashboard/admin/manage-governorate/layout.tsx - Protected governorate management layout
import { requireAnyRole } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function ManageGovernorateLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentPath = `/dashboard/admin/manage-governorate`;
  
  try {
    // Require admin or super_admin role for governorate management
    await requireAnyRole(['admin', 'super_admin'], currentPath);
    
    return (
      <div className="manage-governorate-layout" style={{backgroundColor: '#f3f3eb'}}>
        {children}
      </div>
    );
  } catch (error) {
    console.error('Manage governorate layout auth error:', error);
    redirect(`/${locale}/dashboard?error=insufficient_permissions`);
  }
}