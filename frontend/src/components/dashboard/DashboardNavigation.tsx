"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { ComponentGuard } from '@/components/guards/AuthGuards';
import { 
  LayoutDashboard, 
  MapPin, 
  Tags, 
  UtensilsCrossed, 
  FileText, 
  Map, 
  MapPinned, 
  Settings, 
  Users, 
  Shield,
  Home,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  route: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAny?: boolean;
}

interface DashboardNavigationProps {
  children: React.ReactNode;
  locale: string;
}

export default function DashboardNavigation({ children, locale }: DashboardNavigationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const { user, logout, hasPermission } = useAuthStore();
  const isRTL = locale === 'ar';

  // Check if user has role
  const hasRole = (roleName: string) => {
    return user?.roles?.includes(roleName) || false;
  };

  // Dashboard menu items
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      labelEn: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      route: '/dashboard',
    },
    {
      id: 'places',
      label: 'إدارة الأماكن',
      labelEn: 'Manage Places',
      icon: <MapPin size={20} />,
      route: '/dashboard/admin/manage-places',
      requiredPermissions: ['can_view_place', 'can_create_place', 'can_manage_place'],
      requireAny: true
    },
    {
      id: 'categories',
      label: 'إدارة الفئات',
      labelEn: 'Manage Categories',
      icon: <Tags size={20} />,
      route: '/dashboard/admin/manage-categories',
      requiredPermissions: ['can_view_category', 'can_create_category', 'can_manage_category'],
      requireAny: true
    },
    {
      id: 'dishes',
      label: 'إدارة الأطباق',
      labelEn: 'Manage Dishes',
      icon: <UtensilsCrossed size={20} />,
      route: '/dashboard/admin/manage-dishes',
      requiredPermissions: ['can_view_dish', 'can_create_dish', 'can_manage_dish'],
      requireAny: true
    },
    {
      id: 'lists',
      label: 'إدارة القوائم',
      labelEn: 'Manage Lists',
      icon: <FileText size={20} />,
      route: '/dashboard/admin/manage-lists',
      requiredPermissions: ['can_view_list', 'can_create_list', 'can_manage_list'],
      requireAny: true
    },
    {
      id: 'governates',
      label: 'إدارة المحافظات',
      labelEn: 'Manage Governates',
      icon: <Map size={20} />,
      route: '/dashboard/admin/manage-governorate',
      requiredRoles: ['admin', 'super_admin'],
      requireAny: true
    },
    {
      id: 'wilayah',
      label: 'إدارة الولايات',
      labelEn: 'Manage Wilayah',
      icon: <MapPinned size={20} />,
      route: '/dashboard/admin/manage-wilayah',
      requiredRoles: ['admin', 'super_admin'],
      requireAny: true
    },
    {
      id: 'properties',
      label: 'إدارة الخصائص',
      labelEn: 'Manage Properties',
      icon: <Settings size={20} />,
      route: '/dashboard/admin/manage-properties',
      requiredPermissions: ['can_view_property', 'can_create_property', 'can_manage_property'],
      requireAny: true
    },
    {
      id: 'users',
      label: 'إدارة المستخدمين',
      labelEn: 'Manage Users',
      icon: <Users size={20} />,
      route: '/dashboard/admin/manage-users',
      requiredPermissions: ['can_manage_user'],
    },
    {
      id: 'rbac',
      label: 'إدارة الصلاحيات',
      labelEn: 'Manage RBAC',
      icon: <Shield size={20} />,
      route: '/dashboard/admin/manage-rbac',
      requiredPermissions: ['can_manage_role', 'can_manage_permission'],
      requireAny: true
    }
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = user ? menuItems.filter(item => {
    if (!item.requiredRoles && !item.requiredPermissions) {
      return true;
    }

    if (item.requiredRoles) {
      const hasRequiredRole = item.requireAny 
        ? item.requiredRoles.some(role => hasRole(role))
        : item.requiredRoles.every(role => hasRole(role));
      
      if (hasRequiredRole) return true;
    }

    if (item.requiredPermissions) {
      const hasRequiredPermission = item.requireAny
        ? item.requiredPermissions.some(permission => hasPermission(permission))
        : item.requiredPermissions.every(permission => hasPermission(permission));
      
      if (hasRequiredPermission) return true;
    }

    return false;
  }) : [];

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = filteredMenuItems.find(item => pathname.startsWith(item.route));
    return currentItem ? (isRTL ? currentItem.label : currentItem.labelEn) : (isRTL ? 'لوحة التحكم' : 'Dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Handle navigation
  const handleNavigation = (route: string) => {
    router.push(route);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Responsive sidebar management
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

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Mobile backdrop */}
      {sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 ${isRTL ? 'right-0' : 'left-0'} z-50 h-screen
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-72' : 'w-16'}
        ${sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full bg-white/90 backdrop-blur-xl border-r border-slate-200/50 shadow-xl flex flex-col">
          
          {/* Logo Header */}
          <div className="flex items-center gap-3 p-6 border-b border-slate-200/50">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home size={20} className="text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isRTL ? 'لوحة التحكم' : 'Dashboard'}
                </h1>
                <p className="text-sm text-slate-500">{isRTL ? 'نظام إدارة الأماكن' : 'Place Management System'}</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const isActive = pathname.startsWith(item.route);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.route)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl text-${isRTL ? 'right' : 'left'} 
                    transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }
                    ${!sidebarOpen && 'justify-center px-2'}
                  `}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`}>
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {isRTL ? item.label : item.labelEn}
                      </div>
                    </div>
                  )}
                  {sidebarOpen && isActive && (
                    <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-200/50">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  {user?.profilePicture ? (
                    <Image src={user.profilePicture} alt="Profile" width={40} height={40} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <User size={20} className="text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{user?.fullName || user?.username}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                </div>
              )}
              {sidebarOpen && (
                <div className="relative">
                  <button 
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <ChevronDown size={16} className="text-slate-500" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute bottom-full mb-2 right-0 w-48 bg-white rounded-xl shadow-lg border border-slate-200/50 py-2 backdrop-blur-xl">
                      <button
                        onClick={() => router.push('/profile')}
                        className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User size={16} />
                        {isRTL ? 'الملف الشخصي' : 'Profile'}
                      </button>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                        {isRTL ? 'تبديل الوضع' : 'Toggle Mode'}
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        {isRTL ? 'تسجيل الخروج' : 'Logout'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? (isRTL ? 'mr-72' : 'ml-72') : (isRTL ? 'mr-16' : 'ml-16')}`}>
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu size={20} />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {getCurrentPageTitle()}
                </h1>
                <p className="text-slate-600">
                  {isRTL ? `مرحباً ${user?.firstName || user?.username}` : `Welcome ${user?.firstName || user?.username}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isRTL ? 'البحث...' : 'Search...'}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <ComponentGuard requiredPermissions={['can_view_notifications']}>
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200/50 py-2 backdrop-blur-xl">
                      <div className="px-4 py-2 border-b border-slate-200">
                        <h3 className="font-semibold text-slate-900">{isRTL ? 'الإشعارات' : 'Notifications'}</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-slate-500">{isRTL ? 'لا توجد إشعارات جديدة' : 'No new notifications'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </ComponentGuard>

              {/* Settings */}
              <ComponentGuard requiredRoles={['admin', 'super_admin']} requireAny={true}>
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                  <Settings size={20} />
                </button>
              </ComponentGuard>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}