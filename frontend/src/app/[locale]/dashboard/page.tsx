// components/Layout/ProtectedDashboard.tsx
"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { ComponentGuard, PageGuard } from '@/components/guards/AuthGuards';

interface MenuItem {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  route: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAny?: boolean;
}

const ProtectedDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const router = useRouter();
  
  // Zustand store hooks
  const { user, logout, isInitialized, initialize } = useAuthStore();
  const { 
    hasRole, 
    hasPermission 
  } = usePermissions();

  // Initialize auth on component mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Dashboard menu items with role/permission-based filtering
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      labelEn: 'Dashboard',
      icon: '📊',
      route: '/dashboard',
      requiredPermissions: [], // Everyone can see dashboard
    },
    {
      id: 'places',
      label: 'إدارة الأماكن',
      labelEn: 'Manage Places',
      icon: '🏛️',
      route: '/dashboard/admin/manage-places',
      requiredPermissions: ['can_view_place', 'can_create_place', 'can_manage_place'],
      requireAny: true
    },
    {
      id: 'categories',
      label: 'إدارة الفئات',
      labelEn: 'Manage Categories',
      icon: '🏷️',
      route: '/dashboard/admin/manage-categories',
      requiredPermissions: ['can_view_category', 'can_create_category', 'can_manage_category'],
      requireAny: true
    },
    {
      id: 'dishes',
      label: 'إدارة الأطباق',
      labelEn: 'Manage Dishes',
      icon: '🍽️',
      route: '/dashboard/admin/manage-dishes',
      requiredPermissions: ['can_view_dish', 'can_create_dish', 'can_manage_dish'],
      requireAny: true
    },
    {
      id: 'lists',
      label: 'إدارة القوائم',
      labelEn: 'Manage Lists',
      icon: '📝',
      route: '/dashboard/admin/manage-lists',
      requiredPermissions: ['can_view_list', 'can_create_list', 'can_manage_list'],
      requireAny: true
    },
    {
      id: 'governates',
      label: 'إدارة المحافظات',
      labelEn: 'Manage Governates',
      icon: '🗺️',
      route: '/dashboard/admin/manage-governorates',
      requiredRoles: ['admin', 'super_admin'],
      requireAny: true
    },
    {
      id: 'wilayah',
      label: 'إدارة الولايات',
      labelEn: 'Manage Wilayah',
      icon: '📍',
      route: '/dashboard/admin/manage-wilayah',
      requiredRoles: ['admin', 'super_admin'],
      requireAny: true
    },
    {
      id: 'properties',
      label: 'إدارة الخصائص',
      labelEn: 'Manage Properties',
      icon: '⚙️',
      route: '/dashboard/admin/manage-properties',
      requiredPermissions: ['can_view_property', 'can_create_property', 'can_manage_property'],
      requireAny: true
    },
    {
      id: 'users',
      label: 'إدارة المستخدمين',
      labelEn: 'Manage Users',
      icon: '👥',
      route: '/dashboard/admin/manage-users',
      requiredPermissions: ['can_manage_user'],
    },
    {
      id: 'rbac',
      label: 'إدارة الصلاحيات',
      labelEn: 'Manage RBAC',
      icon: '🔐',
      route: '/dashboard/admin/manage-rbac',
      requiredPermissions: ['can_manage_role', 'can_manage_permission'],
      requireAny: true
    }
  ];

  // Filter menu items based on user permissions (only when auth is initialized)
  const filteredMenuItems = isInitialized ? menuItems.filter(item => {
    // If no requirements, show to everyone
    if (!item.requiredRoles && !item.requiredPermissions) {
      return true;
    }

    // Check role requirements
    if (item.requiredRoles) {
      const hasRequiredRole = item.requireAny 
        ? item.requiredRoles.some(role => hasRole(role))
        : item.requiredRoles.every(role => hasRole(role));
      
      if (hasRequiredRole) return true;
    }

    // Check permission requirements
    if (item.requiredPermissions) {
      const hasRequiredPermission = item.requireAny
        ? item.requiredPermissions.some(permission => hasPermission(permission))
        : item.requiredPermissions.every(permission => hasPermission(permission));
      
      if (hasRequiredPermission) return true;
    }

    return false;
  }) : [];

  // Handle navigation with loading state
  const handleNavigation = async (item: MenuItem) => {
    if (isNavigating) return; // Prevent multiple clicks during navigation
    
    setIsNavigating(true);
    setNavigatingTo(item.id);
    setActiveItem(item.id);
    
    try {
      await router.push(item.route);
    } catch (error) {
      console.error('Navigation error:', error);
      // Reset state on error
      setIsNavigating(false);
      setNavigatingTo(null);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear loading state after navigation completes
  useEffect(() => {
    const clearLoadingState = () => {
      setIsNavigating(false);
      setNavigatingTo(null);
    };

    // Clear loading state when component mounts (after navigation)
    const timer = setTimeout(() => {
      clearLoadingState();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <PageGuard>
      <div className="min-h-screen bg-gray-50 rtl" dir="rtl">
      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-2xl border border-gray-200 flex items-center gap-4">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <div className="text-gray-900">
              <div className="font-semibold text-lg">جاري التحميل...</div>
              <div className="text-sm text-gray-600">Loading page...</div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-[8vh] right-0 h-[calc(100vh-8vh)] bg-white shadow-lg z-50 transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-72' : 'w-20'}
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🏛️</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">لوحة التحكم</h1>
                <p className="text-sm text-gray-500">نظام إدارة الأماكن</p>
              </div>
            )}
          </div>
          
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const isItemLoading = navigatingTo === item.id && isNavigating;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                disabled={isNavigating}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg text-right transition-all duration-200
                  ${activeItem === item.id 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${!sidebarOpen && 'justify-center px-2'}
                  ${isNavigating && !isItemLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isItemLoading ? 'bg-blue-100 border-blue-300' : ''}
                `}
              >
                <span className="text-xl flex-shrink-0">
                  {isItemLoading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  ) : (
                    item.icon
                  )}
                </span>
                {sidebarOpen && (
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {isItemLoading ? 'جاري التحميل...' : item.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isItemLoading ? 'Loading...' : item.labelEn}
                    </div>
                  </div>
                )}
                {sidebarOpen && activeItem === item.id && !isItemLoading && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
                {sidebarOpen && isItemLoading && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white`}>
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-10 h-10 rounded-full" />
              ) : (
                <span className="text-white font-bold">👤</span>
              )}
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{user?.fullName || user?.username}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
                <div className="text-xs text-blue-600">
                  {user?.roles?.map(userRole => userRole.role?.display_name).join(', ')}
                </div>
              </div>
            )}
            {sidebarOpen && (
              <div className="relative">
                <button 
                  className="p-1 rounded hover:bg-gray-100"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <button
                      onClick={() => router.push('/profile')}
                      className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      الملف الشخصي
                    </button>
                    <ComponentGuard requiredPermissions={['can_manage_system']}>
                      <button
                        onClick={() => router.push('/settings')}
                        className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        الإعدادات
                      </button>
                    </ComponentGuard>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 pt-[8vh] ${sidebarOpen ? 'mr-72' : 'mr-20'}`}>
        
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  مرحباً {user?.firstName || user?.username}
                </h1>
                <p className="text-gray-600">إدارة نظام الأماكن السياحية</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <ComponentGuard requiredPermissions={['can_view_notifications']}>
                <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5 5-5h-5m-6 0H4l5 5-5 5h5m3-10a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </ComponentGuard>

              {/* Settings */}
              <ComponentGuard requiredRoles={['admin', 'super_admin']} requireAll={false}>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </ComponentGuard>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* Total Places - Visible to users who can view places */}
            <ComponentGuard 
              requiredPermissions={['can_view_place', 'can_manage_place']} 
              requireAll={false}
              showFallback={false}
            >
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">إجمالي الأماكن</p>
                    <p className="text-3xl font-bold text-gray-900">1,247</p>
                    <p className="text-green-600 text-sm flex items-center gap-1 mt-2">
                      <span>↗️</span>
                      +12% من الشهر الماضي
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏛️</span>
                  </div>
                </div>
              </div>
            </ComponentGuard>

            {/* Active Users - Admin only */}
            <ComponentGuard 
              requiredPermissions={['can_manage_user', 'can_view_user']} 
              requireAll={false}
              showFallback={false}
            >
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">المستخدمين النشطين</p>
                    <p className="text-3xl font-bold text-gray-900">89</p>
                    <p className="text-green-600 text-sm flex items-center gap-1 mt-2">
                      <span>↗️</span>
                      +5 مستخدمين جدد
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>
            </ComponentGuard>

            {/* Categories */}
            <ComponentGuard 
              requiredPermissions={['can_view_category', 'can_manage_category']} 
              requireAll={false}
              showFallback={false}
            >
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">الفئات</p>
                    <p className="text-3xl font-bold text-gray-900">24</p>
                    <p className="text-blue-600 text-sm flex items-center gap-1 mt-2">
                      <span>📊</span>
                      فئة متنوعة
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏷️</span>
                  </div>
                </div>
              </div>
            </ComponentGuard>

            {/* Governates - Admin only */}
            <ComponentGuard 
              requiredRoles={['admin', 'super_admin']} 
              requireAll={false}
              showFallback={false}
            >
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">المحافظات</p>
                    <p className="text-3xl font-bold text-gray-900">11</p>
                    <p className="text-orange-600 text-sm flex items-center gap-1 mt-2">
                      <span>🗺️</span>
                      جميع المحافظات
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🗺️</span>
                  </div>
                </div>
              </div>
            </ComponentGuard>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
              <div className="grid grid-cols-2 gap-4">
                
                <ComponentGuard 
                  requiredPermissions={['can_create_place']}
                  showFallback={false}
                >
                  <button 
                    onClick={() => router.push('/places/new')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">➕</div>
                    <div className="text-sm font-medium">إضافة مكان جديد</div>
                  </button>
                </ComponentGuard>
                
                <ComponentGuard 
                  requiredPermissions={['can_create_category']}
                  showFallback={false}
                >
                  <button 
                    onClick={() => router.push('/dashboard/categories/create')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">🏷️</div>
                    <div className="text-sm font-medium">إضافة فئة جديدة</div>
                  </button>
                </ComponentGuard>
                
                <ComponentGuard 
                  requiredPermissions={['can_create_user']}
                  showFallback={false}
                >
                  <button 
                    onClick={() => router.push('/dashboard/users/create')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">👤</div>
                    <div className="text-sm font-medium">إضافة مستخدم</div>
                  </button>
                </ComponentGuard>
                
                <ComponentGuard 
                  requiredRoles={['admin', 'super_admin']}
                  requireAll={false}
                  showFallback={false}
                >
                  <button 
                    onClick={() => router.push('/dashboard/governates')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">🗺️</div>
                    <div className="text-sm font-medium">إدارة المحافظات</div>
                  </button>
                </ComponentGuard>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">النشاط الأخير</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">🏛️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">تم إضافة مكان جديد</p>
                    <p className="text-xs text-gray-500">منذ 5 دقائق</p>
                  </div>
                </div>
                
                <ComponentGuard 
                  requiredPermissions={['can_view_user']}
                  showFallback={false}
                >
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">👤</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">مستخدم جديد انضم</p>
                      <p className="text-xs text-gray-500">منذ ساعة</p>
                    </div>
                  </div>
                </ComponentGuard>
                
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">🏷️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">تم تحديث فئة</p>
                    <p className="text-xs text-gray-500">منذ 3 ساعات</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Health - Super Admin only */}
          <ComponentGuard 
            requiredRoles={['super_admin']}
            showFallback={false}
          >
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">حالة النظام</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">قاعدة البيانات</span>
                  <span className="text-green-600 text-sm font-medium">متصلة</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">خدمة التخزين</span>
                  <span className="text-green-600 text-sm font-medium">تعمل</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">ذاكرة التخزين المؤقت</span>
                  <span className="text-yellow-600 text-sm font-medium">85%</span>
                </div>
              </div>
            </div>
          </ComponentGuard>
        </main>
      </div>
      </div>
    </PageGuard>
  );
};

export default ProtectedDashboard;