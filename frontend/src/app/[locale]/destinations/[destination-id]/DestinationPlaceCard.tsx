"use client";
import { useState } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { DestinationPlaceCardProps } from '../types';

export default function DestinationPlaceCard({ place, locale }: DestinationPlaceCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const t = useTranslations('common');

  const handleCardClick = () => {
    const navigationPath = `/places/${place.id}`;
    console.log('Navigating to:', navigationPath);
    router.push(navigationPath);
  };

  // Get image source with proper URL handling
  const getImageSrc = () => {
    let imageUrl = '';
    
    // First try primary_image
    if (place.primary_image) {
      imageUrl = place.primary_image;
    }
    // Then try images array
    else if (place.images && place.images.length > 0) {
      const primaryImage = place.images.find((img: { is_primary: boolean; image_url: string }) => img.is_primary) || place.images[0];
      imageUrl = primaryImage.image_url;
    }
    
    // If no image found, return default
    if (!imageUrl) {
      return '/images/default-place.jpg';
    }
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path, add API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:9000";
    if (imageUrl.startsWith('/')) {
      return `${API_BASE_URL}${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Get localized content
  const placeName = locale === 'ar' ? place.name_ar : place.name_en;
  const wilayahName = place.wilayah 
    ? (locale === 'ar' ? place.wilayah.name_ar : place.wilayah.name_en)
    : '';
  const categoryName = place.categories && place.categories.length > 0
    ? (locale === 'ar' ? place.categories[0].name_ar : place.categories[0].name_en)
    : '';

  return (
    <div className="relative w-full rounded-3xl hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white p-2"
         onClick={handleCardClick}>
      
      {/* Featured Badge - Outside the card container */}
      {place.is_featured && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="relative">
            <svg width="48" height="48" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-[spin-60_2s_ease-in-out_infinite]">
              <path d="M3.77256 14.1251C3.1287 14.1251 2.65038 13.9688 2.33777 13.6564C2.02987 13.3486 1.87583 12.8729 1.87583 12.2292V10.7319C1.87583 10.6013 1.83157 10.4917 1.74288 10.4031L0.68604 9.33974C0.228617 8.88741 0 8.44205 0 8.00365C0 7.56525 0.228617 7.11744 0.685851 6.6604L1.74269 5.59706C1.83139 5.5084 1.87564 5.40111 1.87564 5.27518V3.77099C1.87564 3.12271 2.02968 2.64459 2.33758 2.33682C2.65019 2.02906 3.12851 1.87508 3.77237 1.87508H5.27025C5.40094 1.87508 5.51054 1.83085 5.59924 1.74219L6.66304 0.685812C7.12046 0.228777 7.56602 7.12149e-05 7.99991 7.12149e-05C8.4385 -0.00463467 8.88406 0.223883 9.33677 0.685624L10.4006 1.742C10.494 1.83066 10.6058 1.87489 10.7365 1.87489H12.2274C12.876 1.87489 13.3543 2.03113 13.6622 2.3436C13.9701 2.65607 14.1242 3.13193 14.1242 3.7708V5.27499C14.1242 5.40092 14.1709 5.50821 14.2641 5.59687L15.3209 6.66021C15.7735 7.11725 15.9998 7.56506 15.9998 8.00346C16.0045 8.44186 15.7782 8.88722 15.3209 9.33974L14.2641 10.4031C14.1707 10.4917 14.1242 10.6013 14.1242 10.7319V12.2292C14.1242 12.8774 13.9679 13.3556 13.6553 13.6633C13.3474 13.9711 12.8715 14.1251 12.2274 14.1251H10.7365C10.6058 14.1251 10.4938 14.1695 10.4006 14.258L9.33677 15.3213C8.88424 15.7736 8.43868 15.9999 7.99991 15.9999C7.56602 16.0046 7.12028 15.7783 6.66304 15.3213L5.59924 14.258C5.51054 14.1693 5.40094 14.1251 5.27025 14.1251H3.77237H3.77256Z" fill="#FFC00A"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-black text-[12px] font-extrabold">
              {locale === 'ar' ? t('featured') : t('new')}
            </span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin-60 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(60deg); }
        }
      `}</style>
      
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
        {!imageError ? (
          <Image
            src={getImageSrc()}
            alt={placeName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="pt-4 pb-2 px-2">
        {/* Category */}
        {categoryName && (
          <div className="mb-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              {categoryName.toUpperCase()}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
          {placeName}
        </h3>

        {/* Location */}
        {wilayahName && (
          <div className={`flex items-center gap-2 text-gray-600 text-sm ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{wilayahName}</span>
          </div>
        )}
      </div>
    </div>
  );
}