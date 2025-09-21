// app/[locale]/dashboard/admin/manage-wilayah/layout.tsx - Protected wilayah management layout
import { requireAnyRole } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function ManageWilayahLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  try {
    // Require admin or super_admin role for wilayah management
    await requireAnyRole(['admin', 'super_admin']);
    
    return (
      <div className="manage-wilayah-layout" style={{backgroundColor: '#f3f3eb'}}>
        {children}
      </div>
    );
  } catch (error) {
    console.error('Manage wilayah layout auth error:', error);
    redirect(`/${locale}/dashboard?error=insufficient_permissions`);
  }
}