// Simple Server-Side Authentication
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9000';

// Get token from cookies
export async function getServerAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value || null;
  console.log('🍪 Server token:', token ? 'Found' : 'Not found');
  return token;
}

// Verify token with backend
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    
    console.log('🔍 Token verification:', response.ok ? 'Valid' : 'Invalid');
    return response.ok;
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return false;
  }
}

// Get user data from token
export async function getUserFromToken(token: string) {
  try {
    const [profileRes, permissionsRes, rolesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_BASE_URL}/api/v1/rbac/my-permissions`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_BASE_URL}/api/v1/rbac/my-roles`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      }),
    ]);

    if (!profileRes.ok) return null;

    const profileData = await profileRes.json();
    const permissionsData = permissionsRes.ok ? await permissionsRes.json() : { data: [] };
    const rolesData = rolesRes.ok ? await rolesRes.json() : { data: [] };

    return {
      ...profileData.data.user,
      permissions: permissionsData.data?.map((p: { name: string }) => p.name) || [],
      roles: rolesRes.ok ? rolesData.data?.map((r: { role?: { name: string }; name?: string }) => r.role?.name || r.name) || [] : [],
    };
  } catch {
    return null;
  }
}

// Check if user is authenticated (for dashboard access)
export async function requireAuth(redirectPath?: string): Promise<void> {
  const token = await getServerAuthToken();
  
  if (!token) {
    console.log('❌ No token found, redirecting to login');
    const loginUrl = redirectPath ? `/auth/login?redirect=${encodeURIComponent(redirectPath)}` : '/auth/login';
    redirect(loginUrl);
  }

  const isValid = await verifyToken(token);
  
  if (!isValid) {
    console.log('❌ Invalid token, redirecting to login');
    const loginUrl = redirectPath ? `/auth/login?redirect=${encodeURIComponent(redirectPath)}` : '/auth/login';
    redirect(loginUrl);
  }

  console.log('✅ Authentication successful');
}

// Permission-based access control
export async function requirePermission(permission: string, redirectPath?: string): Promise<void> {
  const token = await getServerAuthToken();
  
  if (!token) {
    redirect('/auth/login');
  }

  const user = await getUserFromToken(token);
  
  if (!user || (!user.roles.includes('super_admin') && !user.permissions.includes(permission))) {
    redirect('/dashboard?error=insufficient_permissions');
  }
}

export async function requireAnyPermission(permissions: string[], redirectPath?: string): Promise<void> {
  const token = await getServerAuthToken();
  
  if (!token) {
    redirect('/auth/login');
  }

  const user = await getUserFromToken(token);
  
  if (!user || (!user.roles.includes('super_admin') && !permissions.some(p => user.permissions.includes(p)))) {
    redirect('/dashboard?error=insufficient_permissions');
  }
}

export async function requireAnyRole(roles: string[], redirectPath?: string): Promise<void> {
  const token = await getServerAuthToken();
  
  if (!token) {
    redirect('/auth/login');
  }

  const user = await getUserFromToken(token);
  
  if (!user || !roles.some(role => user.roles.includes(role))) {
    redirect('/dashboard?error=insufficient_permissions');
  }
}