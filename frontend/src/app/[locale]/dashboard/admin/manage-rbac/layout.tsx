// app/[locale]/dashboard/admin/manage-rbac/layout.tsx - Protected RBAC management layout
import { requireAnyPermission } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function ManageRbacLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  try {
    // Require role or permission management permissions
    await requireAnyPermission([
      'can_manage_role', 
      'can_manage_permission'
    ]);
    
    return (
      <div className="manage-rbac-layout" style={{backgroundColor: '#f3f3eb'}}>
        {children}
      </div>
    );
  } catch (error) {
    console.error('Manage RBAC layout auth error:', error);
    redirect(`/${locale}/dashboard?error=insufficient_permissions`);
  }
}