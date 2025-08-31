"use client"
import { useState } from "react";
import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { Place } from "@/types";

interface PlaceCardProps {
  place: Place;
  locale: string;
  isSelected?: boolean;
  onPlaceClick?: (placeId: string) => void;
  isHorizontalScroll?: boolean; // New prop to handle horizontal scroll layout
}

export default function PlaceCard({ place, locale, isSelected = false, onPlaceClick, isHorizontalScroll = false }: PlaceCardProps) {
  const router = useRouter();
  const t = useTranslations('places');
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    // Call onPlaceClick if provided (for map interaction)
    if (onPlaceClick) {
      onPlaceClick(place.id);
    }
    
    // Fixed navigation path to match your dynamic route structure
    const navigationPath = locale 
      ? `/${locale}/places/${place.id}` 
      : `/places/${place.id}`;
    
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
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000";
    if (imageUrl.startsWith('/')) {
      return `${API_BASE_URL}${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Get localized content
  const placeName = locale === 'ar' ? place.name_ar : place.name_en;
  const placeSubtitle = locale === 'ar' ? place.subtitle_ar : place.subtitle_en;
  const governateName = place.governate 
    ? (locale === 'ar' ? place.governate.name_ar : place.governate.name_en)
    : '';
  const wilayahName = place.wilayah 
    ? (locale === 'ar' ? place.wilayah.name_ar : place.wilayah.name_en)
    : '';

  const locationString = [governateName, wilayahName]
    .filter(Boolean)
    .join(' | ') || t('sultanateOman');

  const getCategoryText = () => {
    if (place.categories && place.categories.length > 0) {
      const categoryNames = place.categories.map(cat => 
        locale === 'ar' ? cat.name_ar : cat.name_en
      );
      return categoryNames.join(', ');
    }
    if (place.category) {
      return locale === 'ar' ? place.category.name_ar : place.category.name_en;
    }
    return t('tourism');
  };

  // Render horizontal scroll card (for bottom sheet collapsed state)
  if (isHorizontalScroll) {
    return (
      <div 
        className={`rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden bg-white shadow-sm ${
          isSelected 
            ? 'border-2 border-blue-500' 
            : 'border border-gray-200'
        } ${locale === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}
        onClick={handleCardClick}
      >
        <div className="w-full">
          {/* Image Section */}
          <div className="w-full h-40 p-2">
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              {!imageError ? (
                <Image 
                  src={getImageSrc()}
                  alt={placeName}
                  fill
                  sizes="300px"
                  className="object-cover"
                  onError={() => setImageError(true)}
                  priority={false}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-xl">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {/* Corner badge */}
              {place.is_featured && (
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-1">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {locale === 'ar' ? 'م' : 'F'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className={`px-3 pb-3 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            {/* Location */}
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <p className="text-gray-500 text-xs line-clamp-1 font-medium">
                {locationString}
              </p>
            </div>

            {/* Place Name */}
            <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 leading-tight">
              {placeName}
            </h3>

            {/* Subtitle */}
            {placeSubtitle && (
              <p className="text-gray-600 text-xs line-clamp-1">
                {placeSubtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular card layout (for full list view) - horizontal layout like restaurant cards
  return (
    <div 
      className={`rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden xl:bg-transparent bg-white ${
        isSelected 
          ? 'border-2 border-blue-500 transform -translate-y-1' 
          : ''
      } ${
        isHovered && !isSelected ? 'transform -translate-y-1 shadow-lg' : ''
      } ${locale === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="flex h-36 sm:h-40 md:h-44">
        {/* Image Section - Responsive width: smaller on mobile, half on larger screens */}
        <div className="w-2/5 sm:w-2/5 md:w-1/2 p-2 flex items-center">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            {!imageError ? (
              <Image 
                src={getImageSrc()}
                alt={placeName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 30vw"
                className={`object-cover transition-transform duration-300 ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
                onError={() => setImageError(true)}
                priority={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-2xl">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
            )}

            {/* Corner badge for featured places */}
            {place.is_featured && (
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-1">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {locale === 'ar' ? 'م' : 'F'}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Content Section - Adjusted width and centered vertically */}
        <div className={`flex-1 p-4 flex flex-col justify-center ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          {/* Header */}
          <div>
            {/* Location - Now at top with black color and map marker */}
            <div className="flex items-center gap-1 mb-3">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-black flex-shrink-0" />
              <p className="text-black text-xs sm:text-xs line-clamp-1 font-medium">
                {locationString}
              </p>
            </div>

            {/* Place Name - Responsive sizing, smaller on mobile */}
            <h3 className="font-bold text-gray-800 text-base sm:text-lg md:text-xl lg:text-xl mb-1 line-clamp-2 leading-tight">
              {placeName}
            </h3>

            {/* Category/Subtitle - Show as subtitle with orange color like restaurants */}
            <p className="text-orange-600 text-xs sm:text-sm md:text-base lg:text-base font-medium mb-2 line-clamp-1">
              {placeSubtitle || getCategoryText()}
            </p>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>

          </div>
        </div>
      </div>
    </div>
  );
}