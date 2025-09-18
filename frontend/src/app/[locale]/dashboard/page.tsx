"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { ComponentGuard, PageGuard } from '@/components/guards/AuthGuards';
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  Tags, 
  Activity, 
  Calendar, 
  BarChart3, 
  PieChart, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, trend, icon, color }) => {
  const trendIcon = trend === 'up' ? <ArrowUpRight size={16} /> : trend === 'down' ? <ArrowDownRight size={16} /> : null;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600';

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
          {trendIcon}
          {change}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
        <p className="text-slate-600 text-sm">{title}</p>
      </div>
    </div>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group text-left w-full"
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </button>
  );
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, hasPermission } = useAuthStore();

  const hasRole = (roleName: string) => {
    return user?.roles?.includes(roleName) || false;
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <PageGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
              <div>
                <div className="font-semibold text-lg text-slate-900">جاري التحميل...</div>
                <div className="text-sm text-slate-600">Loading Dashboard...</div>
              </div>
            </div>
          </div>
        </div>
      </PageGuard>
    );
  }

  return (
    <PageGuard>
      <div className="space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                مرحباً {user?.firstName || user?.username} 👋
              </h1>
              <p className="text-blue-100 text-lg">
                إليك نظرة عامة على نشاط النظام اليوم
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-blue-100">
                  <Calendar size={16} />
                  <span className="text-sm">{new Date().toLocaleDateString('ar-OM')}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <Clock size={16} />
                  <span className="text-sm">{new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <Activity size={48} className="text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <ComponentGuard requiredPermissions={['can_view_place', 'can_manage_place']} requireAny={true}>
            <StatsCard
              title="إجمالي الأماكن"
              value="1,247"
              change="+12%"
              trend="up"
              icon={<MapPin size={24} className="text-white" />}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
          </ComponentGuard>

          <ComponentGuard requiredPermissions={['can_manage_user', 'can_view_user']} requireAny={true}>
            <StatsCard
              title="المستخدمين النشطين"
              value="89"
              change="+5"
              trend="up"
              icon={<Users size={24} className="text-white" />}
              color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
          </ComponentGuard>

          <ComponentGuard requiredPermissions={['can_view_category', 'can_manage_category']} requireAny={true}>
            <StatsCard
              title="الفئات النشطة"
              value="24"
              change="0%"
              trend="neutral"
              icon={<Tags size={24} className="text-white" />}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
          </ComponentGuard>

          <ComponentGuard requiredRoles={['admin', 'super_admin']} requireAny={true}>
            <StatsCard
              title="المحافظات"
              value="11"
              change="+1"
              trend="up"
              icon={<BarChart3 size={24} className="text-white" />}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
          </ComponentGuard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Quick Actions Grid */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Zap size={24} className="text-blue-600" />
              إجراءات سريعة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <ComponentGuard requiredPermissions={['can_create_place']}>
                <QuickAction
                  title="إضافة مكان جديد"
                  description="أضف مكان سياحي جديد إلى النظام"
                  icon={<Plus size={24} className="text-white" />}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                  onClick={() => router.push('/dashboard/admin/manage-places/new')}
                />
              </ComponentGuard>

              <ComponentGuard requiredPermissions={['can_create_category']}>
                <QuickAction
                  title="إضافة فئة جديدة"
                  description="أنشئ فئة جديدة لتصنيف الأماكن"
                  icon={<Tags size={24} className="text-white" />}
                  color="bg-gradient-to-br from-purple-500 to-purple-600"
                  onClick={() => router.push('/dashboard/admin/manage-categories')}
                />
              </ComponentGuard>

              <ComponentGuard requiredPermissions={['can_create_user']}>
                <QuickAction
                  title="إضافة مستخدم"
                  description="أضف مستخدم جديد للنظام"
                  icon={<Users size={24} className="text-white" />}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  onClick={() => router.push('/dashboard/admin/manage-users')}
                />
              </ComponentGuard>

              <ComponentGuard requiredPermissions={['can_create_list']}>
                <QuickAction
                  title="إنشاء قائمة"
                  description="أنشئ قائمة جديدة من الأماكن"
                  icon={<PieChart size={24} className="text-white" />}
                  color="bg-gradient-to-br from-orange-500 to-orange-600"
                  onClick={() => router.push('/dashboard/admin/manage-lists')}
                />
              </ComponentGuard>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Activity size={24} className="text-blue-600" />
              النشاط الأخير
            </h2>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 shadow-lg">
              <div className="space-y-4">
                
                <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">تم إضافة مكان جديد</p>
                    <p className="text-xs text-slate-600 mt-1">قلعة نزوى - منذ 5 دقائق</p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                </div>

                <ComponentGuard requiredPermissions={['can_view_user']}>
                  <div className="flex items-start gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">مستخدم جديد انضم</p>
                      <p className="text-xs text-slate-600 mt-1">أحمد المحرزي - منذ ساعة</p>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  </div>
                </ComponentGuard>

                <div className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100/50">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Tags size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">تم تحديث فئة</p>
                    <p className="text-xs text-slate-600 mt-1">الأماكن التراثية - منذ 3 ساعات</p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                </div>

                <div className="flex items-start gap-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100/50">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">تحديث النظام</p>
                    <p className="text-xs text-slate-600 mt-1">تحديث إعدادات الأمان - أمس</p>
                  </div>
                  <Clock size={16} className="text-orange-500 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status - Super Admin only */}
        <ComponentGuard requiredRoles={['super_admin']}>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Activity size={24} className="text-blue-600" />
              حالة النظام
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900">قاعدة البيانات</span>
                  <p className="text-xs text-emerald-600 font-medium">متصلة</p>
                </div>
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900">خدمة التخزين</span>
                  <p className="text-xs text-emerald-600 font-medium">تعمل</p>
                </div>
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100/50">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900">ذاكرة التخزين المؤقت</span>
                  <p className="text-xs text-orange-600 font-medium">85%</p>
                </div>
                <AlertCircle size={20} className="text-orange-500" />
              </div>
            </div>
          </div>
        </ComponentGuard>
      </div>
    </PageGuard>
  );
}