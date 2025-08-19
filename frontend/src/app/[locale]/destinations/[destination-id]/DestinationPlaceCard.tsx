"use client";
import { useState } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Place } from "@/types";

interface DestinationPlaceCardProps {
  place: Place;
  locale: string;
}

export default function DestinationPlaceCard({ place, locale }: DestinationPlaceCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    const navigationPath = `/${locale}/places/${place.id}`;
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
      const primaryImage = place.images.find(img => img.is_primary) || place.images[0];
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

  return (
    <div 
      className="flex-shrink-0 w-64 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 hover:border-gray-300"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-40 w-full">
        {!imageError ? (
          <Image 
            src={getImageSrc()}
            alt={placeName}
            fill
            sizes="(max-width: 768px) 100vw, 256px"
            className="object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImageError(true)}
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Featured Badge */}
        {place.is_featured && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-xs font-bold text-blue-600">
              {locale === 'ar' ? 'مميز' : 'Featured'}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={`p-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
        {/* Place Name */}
        <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2 leading-tight">
          {placeName}
        </h3>

        {/* Location */}
        {wilayahName && (
          <div className={`flex items-center gap-2 text-gray-600 text-sm ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{wilayahName}</span>
          </div>
        )}

        {/* Rating if available */}
        {place.rating && place.rating > 0 && (
          <div className={`flex items-center gap-2 mt-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-sm font-medium text-gray-700">{place.rating.toFixed(1)}</span>
            </div>
            {place.review_count && place.review_count > 0 && (
              <span className="text-xs text-gray-500">
                ({place.review_count} {locale === 'ar' ? 'تقييم' : 'reviews'})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}