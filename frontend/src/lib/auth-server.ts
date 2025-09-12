// lib/auth-server.ts - Server-side authentication utilities
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9000'}/api/v1`;
console.log('🌐 Server-side API_BASE_URL:', API_BASE_URL);

// Types matching the client-side auth store
interface UserRole {
  id: string;
  assigned_at: string;
  assigned_by: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  expires_at: string | null;
  is_active: boolean;
  role: {
    id: string;
    name: string;
    display_name: string;
    is_active: boolean;
  };
  user: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

interface ServerUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePicture: string;
  userType: string;
  provider: string;
  isVerified: boolean;
  roles: UserRole[];
  permissions: string[];
}

interface AuthResult {
  isAuthenticated: boolean;
  user: ServerUser | null;
  token: string | null;
}

// Get auth token from cookies
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value || null;
  console.log('🍪 Server-side token from cookies:', token ? token.substring(0, 20) + '...' : 'null');
  return token;
}

// Verify token and get user data
export async function verifyAuth(): Promise<AuthResult> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.log('❌ Server-side auth failed: No token found in cookies');
      return { isAuthenticated: false, user: null, token: null };
    }

    console.log('🔍 Server-side verifying token with API...');

    // Fetch user data from API
    const [profileResponse, permissionsResponse, rolesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store' // Ensure fresh data
      }),
      fetch(`${API_BASE_URL}/rbac/my-permissions`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      }),
      fetch(`${API_BASE_URL}/rbac/my-roles`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      })
    ]);

    if (!profileResponse.ok) {
      console.log('❌ Server-side auth failed: Profile API returned', profileResponse.status, profileResponse.statusText);
      return { isAuthenticated: false, user: null, token: null };
    }

    console.log('✅ Server-side auth successful: Profile API responded OK');

    const profileData = await profileResponse.json();
    const permissionsData = permissionsResponse.ok ? await permissionsResponse.json() : { data: [] };
    const rolesData = rolesResponse.ok ? await rolesResponse.json() : { data: [] };

    const user: ServerUser = {
      ...profileData.data.user,
      permissions: permissionsData.data.map((p: { name: string }) => p.name),
      roles: rolesData.data
    };

    return { isAuthenticated: true, user, token };
  } catch (error) {
    console.error('❌ Server auth verification failed with error:', error);
    return { isAuthenticated: false, user: null, token: null };
  }
}

// Check if user has specific role
export function hasRole(user: ServerUser | null, roleName: string): boolean {
  if (!user?.roles) return false;
  return user.roles.some(userRole => 
    userRole.role?.name === roleName && userRole.role?.is_active && userRole.is_active
  );
}

// Check if user has any of the specified roles
export function hasAnyRole(user: ServerUser | null, roleNames: string[]): boolean {
  return roleNames.some(roleName => hasRole(user, roleName));
}

// Check if user has specific permission
export function hasPermission(user: ServerUser | null, permission: string): boolean {
  if (!user?.permissions) return false;
  // Super admin has all permissions
  if (hasRole(user, 'super_admin')) return true;
  return user.permissions.includes(permission);
}

// Check if user has any of the specified permissions
export function hasAnyPermission(user: ServerUser | null, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

// Require authentication - redirect to login if not authenticated
export async function requireAuth(redirectTo?: string): Promise<AuthResult> {
  const auth = await verifyAuth();
  
  if (!auth.isAuthenticated) {
    const loginUrl = redirectTo ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}` : '/auth/login';
    redirect(loginUrl);
  }
  
  return auth;
}

// Require specific role - redirect if user doesn't have role
export async function requireRole(roleName: string, redirectTo?: string): Promise<AuthResult> {
  const auth = await requireAuth(redirectTo);
  
  if (!hasRole(auth.user, roleName)) {
    redirect('/dashboard?error=insufficient_permissions');
  }
  
  return auth;
}

// Require any of the specified roles
export async function requireAnyRole(roleNames: string[], redirectTo?: string): Promise<AuthResult> {
  const auth = await requireAuth(redirectTo);
  
  if (!hasAnyRole(auth.user, roleNames)) {
    redirect('/dashboard?error=insufficient_permissions');
  }
  
  return auth;
}

// Require specific permission
export async function requirePermission(permission: string, redirectTo?: string): Promise<AuthResult> {
  const auth = await requireAuth(redirectTo);
  
  if (!hasPermission(auth.user, permission)) {
    redirect('/dashboard?error=insufficient_permissions');
  }
  
  return auth;
}

// Require any of the specified permissions
export async function requireAnyPermission(permissions: string[], redirectTo?: string): Promise<AuthResult> {
  const auth = await requireAuth(redirectTo);
  
  if (!hasAnyPermission(auth.user, permissions)) {
    redirect('/dashboard?error=insufficient_permissions');
  }
  
  return auth;
}