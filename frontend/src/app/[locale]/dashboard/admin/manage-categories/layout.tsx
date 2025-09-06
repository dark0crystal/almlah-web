// app/[locale]/dashboard/admin/manage-categories/layout.tsx - Protected categories management layout
import { requireAnyPermission } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function ManageCategoriesLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentPath = `/dashboard/admin/manage-categories`;
  
  try {
    // Require category management permissions
    await requireAnyPermission([
      'can_view_category', 
      'can_create_category', 
      'can_manage_category'
    ], currentPath);
    
    return (
      <div className="manage-categories-layout">
        {children}
      </div>
    );
  } catch (error) {
    console.error('Manage categories layout auth error:', error);
    redirect(`/${locale}/dashboard?error=insufficient_permissions`);
  }
}