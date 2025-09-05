// app/[locale]/dashboard/admin/manage-places/layout.tsx - Protected places management layout
import { requireAnyPermission } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function ManagePlacesLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentPath = `/dashboard/admin/manage-places`;
  
  try {
    // Require place management permissions
    await requireAnyPermission([
      'can_view_place', 
      'can_create_place', 
      'can_manage_place'
    ], currentPath);
    
    return (
      <div className="manage-places-layout">
        {children}
      </div>
    );
  } catch (error) {
    console.error('Manage places layout auth error:', error);
    redirect(`/${locale}/dashboard?error=insufficient_permissions`);
  }
}