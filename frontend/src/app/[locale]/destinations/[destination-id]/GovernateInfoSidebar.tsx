"use client";
import { MapPin, Navigation, Building, Calendar, Users, ExternalLink } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { GovernateDetails, SimpleWilayah } from '@/services/governateApi';

interface GovernateInfoSidebarProps {
  governate: GovernateDetails;
  wilayahs: SimpleWilayah[];
  language?: 'ar' | 'en';
  onGetDirections?: () => void;
}

export default function GovernateInfoSidebar({ 
  governate, 
  wilayahs, 
  language = 'ar',
  onGetDirections 
}: GovernateInfoSidebarProps) {
  
  const locale = useLocale() as 'ar' | 'en';
  const t = useTranslations('governate');
  
  const governateName = locale === 'ar' ? governate.name_ar : governate.name_en;

  return (
    <div className="space-y-6">
      
      {/* Quick Info Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          {t('info.quickInfo')}
        </h3>
        
        <div className="space-y-3">
          {/* Wilayahs Count */}
          {governate.wilayah_count > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Building className="w-4 h-4" />
                <span className="text-sm">{t('info.wilayahs')}</span>
              </div>
              <span className="font-semibold text-blue-600">
                {governate.wilayah_count}
              </span>
            </div>
          )}
          
          {/* Places Count */}
          {governate.place_count > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{t('info.places')}</span>
              </div>
              <span className="font-semibold text-blue-600">
                {governate.place_count}
              </span>
            </div>
          )}
          
          {/* Coordinates */}
          {governate.latitude && governate.longitude && (
            <div className="pt-2 border-t border-blue-200">
              <div className="text-xs text-gray-500 mb-1">
                {t('info.coordinates')}
              </div>
              <div className="text-sm font-mono text-gray-700">
                {governate.latitude.toFixed(4)}, {governate.longitude.toFixed(4)}
              </div>
            </div>
          )}
        </div>
        
        {/* Get Directions Button */}
        {governate.latitude && governate.longitude && onGetDirections && (
          <button
            onClick={onGetDirections}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Navigation className="w-4 h-4" />
            {t('actions.getDirections')}
          </button>
        )}
      </div>

      {/* Wilayahs List */}
      {wilayahs && wilayahs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            {t('info.wilayahs')}
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {wilayahs.map((wilayah) => (
              <div 
                key={wilayah.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
              >
                <div>
                  <h4 className="font-medium text-gray-900">
                    {locale === 'ar' ? wilayah.name_ar : wilayah.name_en}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {wilayah.slug}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            ))}
          </div>
          
          {wilayahs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {t('info.noWilayahs')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Additional Info Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          {t('info.additionalInfo')}
        </h3>
        
        <div className="space-y-3 text-sm">
          {/* Creation Date */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              {t('info.added')}
            </span>
            <span className="text-gray-900">
              {new Date(governate.created_at).toLocaleDateString(
                locale === 'ar' ? 'ar-AE' : 'en-US',
                { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                }
              )}
            </span>
          </div>
          
          {/* Last Update */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              {t('info.updated')}
            </span>
            <span className="text-gray-900">
              {new Date(governate.updated_at).toLocaleDateString(
                locale === 'ar' ? 'ar-AE' : 'en-US',
                { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                }
              )}
            </span>
          </div>
          
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              {t('info.status')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              governate.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {governate.is_active 
                ? t('status.active')
                : t('status.inactive')
              }
            </span>
          </div>
        </div>
      </div>

      {/* Help & Support Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          {t('needHelp')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('helpMessage')}
        </p>
        <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors text-sm font-medium">
          {t('actions.contactUs')}
        </button>
      </div>
    </div>
  );
}