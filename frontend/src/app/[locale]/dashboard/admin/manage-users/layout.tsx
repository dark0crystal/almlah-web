// app/[locale]/dashboard/admin/manage-users/layout.tsx - Protected users management layout
import { requirePermission } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function ManageUsersLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentPath = `/dashboard/admin/manage-users`;
  
  try {
    // Require user management permission
    await requirePermission('can_manage_user', currentPath);
    
    return (
      <div className="manage-users-layout">
        {children}
      </div>
    );
  } catch (error) {
    console.error('Manage users layout auth error:', error);
    redirect(`/${locale}/dashboard?error=insufficient_permissions`);
  }
}