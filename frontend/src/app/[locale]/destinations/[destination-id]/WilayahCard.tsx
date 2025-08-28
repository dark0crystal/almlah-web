"use client";

import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
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
      className="group relative w-full h-96 sm:h-80 md:h-96 lg:h-[28rem] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl min-w-[320px] sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px] flex-shrink-0"
      onClick={handleClick}
    >
      {/* Background Image */}
      <Image
        src={getImageSrc()}
        alt={wilayahName}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        onError={handleImageError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      {/* Place count badge - Top Right */}
      {wilayah.place_count && wilayah.place_count > 0 && (
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 bg-white/90 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
          <div className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-semibold text-gray-800">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{wilayah.place_count}</span>
          </div>
        </div>
      )}
      
      {/* Content - Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
        <div className="space-y-2 sm:space-y-3">
          {/* Alternative name - small text */}
          {alternativeName && alternativeName !== wilayahName && (
            <p className="text-white/80 text-sm sm:text-base font-medium tracking-wide">
              {alternativeName}
            </p>
          )}
          
          {/* Main title - large text */}
          <h3 className={`font-bold text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight drop-shadow-lg ${
            locale === 'ar' ? 'text-right' : 'text-left'
          }`}>
            {wilayahName}
          </h3>
          
          {/* Subtitle */}
          <p className="text-white/90 text-sm sm:text-base lg:text-lg font-medium">
            {locale === 'ar' ? 'ولاية في عُمان' : 'Wilayah in Oman'}
          </p>
        </div>
        
        {/* Hover indicator */}
        <div className="mt-4 sm:mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="inline-flex items-center gap-2 sm:gap-3 text-white/90 text-sm sm:text-base">
            <span>{locale === 'ar' ? 'استكشف المنطقة' : 'Explore Area'}</span>
            <div className="w-5 sm:w-6 h-0.5 bg-white/70 rounded-full group-hover:w-8 sm:group-hover:w-10 transition-all duration-300" />
          </div>
        </div>
      </div>
      
      {/* Subtle border on hover */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-2xl transition-colors duration-300 pointer-events-none" />
    </div>
  );
}