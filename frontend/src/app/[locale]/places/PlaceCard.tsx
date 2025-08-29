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
    if (place.category) {
      return locale === 'ar' ? place.category.name_ar : place.category.name_en;
    }
    return t('foodBeverages');
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

  // Regular card layout (for full list view) - Airbnb style
  return (
    <div 
      className={`group bg-white rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 ${
        isSelected 
          ? 'ring-2 ring-rose-500 shadow-lg transform -translate-y-1' 
          : ''
      } ${
        isHovered && !isSelected ? 'transform -translate-y-1 shadow-xl' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="p-3">
        {/* Image Section */}
        <div className="relative mb-3">
          <div className="relative w-full h-64 rounded-xl overflow-hidden">
            {!imageError ? (
              <Image 
                src={getImageSrc()}
                alt={placeName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-cover transition-all duration-500 group-hover:scale-105`}
                onError={() => setImageError(true)}
                priority={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            
            {/* Featured badge */}
            {place.is_featured && (
              <div className="absolute top-3 left-3 bg-rose-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                {locale === 'ar' ? 'مميز' : 'Featured'}
              </div>
            )}
            
            {/* Heart icon (like Airbnb) */}
            <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110">
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className={`${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          {/* Location */}
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <p className="text-gray-500 text-sm line-clamp-1">
              {locationString}
            </p>
          </div>
          
          {/* Place Name */}
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors duration-200">
            {placeName}
          </h3>
          
          {/* Subtitle */}
          {placeSubtitle && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {placeSubtitle}
            </p>
          )}
          
          {/* Bottom section with rating/category */}
          <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-900">4.5</span>
              <span className="text-sm text-gray-500">(12)</span>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {getCategoryText()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}