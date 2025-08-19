"use client";

import { useTranslations } from 'next-intl';
import { MapPin, Users } from 'lucide-react';

export interface WilayahCardProps {
  wilayah: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
  };
  locale: 'ar' | 'en';
  onClick?: (wilayah: { id: string; name_ar: string; name_en: string; slug: string }) => void;
}

export default function WilayahCard({ wilayah, locale, onClick }: WilayahCardProps) {
  const t = useTranslations('wilayah');
  
  const wilayahName = locale === 'ar' ? wilayah.name_ar : wilayah.name_en;

  const handleClick = () => {
    if (onClick) {
      onClick(wilayah);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer min-w-[280px] flex-shrink-0"
      onClick={handleClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {wilayahName}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Show both names if different */}
          {locale === 'en' && wilayah.name_ar && wilayah.name_ar !== wilayah.name_en && (
            <p className="text-sm text-gray-600">
              <span className="text-gray-500">{t('arabicName')}:</span> {wilayah.name_ar}
            </p>
          )}
          {locale === 'ar' && wilayah.name_en && wilayah.name_en !== wilayah.name_ar && (
            <p className="text-sm text-gray-600">
              <span className="text-gray-500">{t('englishName')}:</span> {wilayah.name_en}
            </p>
          )}

          {/* Action hint */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {t('clickToExplore')}
            </span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}