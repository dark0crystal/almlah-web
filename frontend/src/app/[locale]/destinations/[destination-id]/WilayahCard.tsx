"use client";

import { useTranslations } from 'next-intl';
import { MapPin, Users, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export interface WilayahCardProps {
  wilayah: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    image_url?: string;
    place_count?: number;
  };
  locale: 'ar' | 'en';
  onClick?: (wilayah: { id: string; name_ar: string; name_en: string; slug: string; image_url?: string; place_count?: number }) => void;
}

export default function WilayahCard({ wilayah, locale, onClick }: WilayahCardProps) {
  const t = useTranslations('wilayah');
  const [imageError, setImageError] = useState(false);
  
  const wilayahName = locale === 'ar' ? wilayah.name_ar : wilayah.name_en;
  const alternativeName = locale === 'ar' ? wilayah.name_en : wilayah.name_ar;

  const handleClick = () => {
    if (onClick) {
      onClick(wilayah);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageSrc = () => {
    if (imageError || !wilayah.image_url) {
      return '/img1.jpeg'; // Default fallback image
    }
    return wilayah.image_url;
  };

  return (
    <div 
      className="group bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer min-w-[320px] flex-shrink-0 overflow-hidden"
      onClick={handleClick}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={getImageSrc()}
          alt={wilayahName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Place count badge */}
        {wilayah.place_count && wilayah.place_count > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4" />
              <span>{wilayah.place_count}</span>
            </div>
          </div>
        )}
        
        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-bold text-white text-xl leading-tight mb-1 drop-shadow-lg">
            {wilayahName}
          </h3>
          {alternativeName && alternativeName !== wilayahName && (
            <p className="text-white/80 text-sm drop-shadow">
              {alternativeName}
            </p>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Main info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t('exploreDistrict')}
            </span>
          </div>
          
          {/* Action indicator */}
          <div className="flex items-center gap-1 text-blue-600 group-hover:translate-x-1 transition-transform duration-200">
            <span className="text-sm font-medium">{t('explore')}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
        
        {/* Additional info */}
        {wilayah.place_count && wilayah.place_count > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {t('placesToVisit', { count: wilayah.place_count })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}