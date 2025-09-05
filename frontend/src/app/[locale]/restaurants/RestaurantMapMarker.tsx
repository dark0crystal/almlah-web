"use client"

import React from 'react';
import { useLocale } from 'next-intl';
import { Place } from '@/types';
import Image from 'next/image';

interface RestaurantMapMarkerProps {
  restaurant: Place;
  isActive: boolean;
  onClick: (restaurantId: string) => void;
}

export default function RestaurantMapMarker({ restaurant, isActive, onClick }: RestaurantMapMarkerProps) {
  const locale = useLocale();

  // Get display name based on current locale
  const getDisplayName = () => {
    if (locale === 'ar') {
      return restaurant.name_ar || restaurant.name_en;
    }
    return restaurant.name_en || restaurant.name_ar;
  };

  // Get category/cuisine type based on current locale
  const getCategory = () => {
    if (restaurant.categories && restaurant.categories.length > 0) {
      if (locale === 'ar') {
        return restaurant.categories[0].name_ar || restaurant.categories[0].name_en;
      }
      return restaurant.categories[0].name_en || restaurant.categories[0].name_ar;
    }
    return locale === 'ar' ? 'مطعم' : 'Restaurant';
  };

  // Handle image display with proper URL handling
  const getImageSrc = (): string => {
    let imageUrl = '';
    
    // First try primary_image
    if (restaurant.primary_image) {
      imageUrl = restaurant.primary_image;
    }
    // Then try images array
    else if (restaurant.images && restaurant.images.length > 0) {
      const primaryImage = restaurant.images.find(img => img.is_primary) || restaurant.images[0];
      imageUrl = primaryImage.image_url;
    }
    
    // If no image found, return empty string (will use fallback)
    if (!imageUrl) {
      return '';
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

  // Generate a consistent color based on restaurant ID
  const getMarkerColor = () => {
    const colors = [
      'bg-orange-500', 'bg-red-500', 'bg-amber-500', 'bg-yellow-500', 
      'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
      'bg-orange-600', 'bg-cyan-500', 'bg-emerald-500'
    ];
    return colors[restaurant.id.length % colors.length];
  };

  // Get location text
  const getLocationText = () => {
    const governateName = restaurant.governate 
      ? (locale === 'ar' ? restaurant.governate.name_ar : restaurant.governate.name_en)
      : '';
    const wilayahName = restaurant.wilayah 
      ? (locale === 'ar' ? restaurant.wilayah.name_ar : restaurant.wilayah.name_en)
      : '';
    
    return [governateName, wilayahName].filter(Boolean).join(' | ');
  };

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    
    // Show the fallback colored marker
    const fallbackElement = target.nextSibling as HTMLElement;
    if (fallbackElement) {
      fallbackElement.style.display = 'flex';
    }
  };

  const imageSrc = getImageSrc();

  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      onClick={() => onClick(restaurant.id)}
    >
      <div className={`relative ${isActive ? 'z-20' : 'z-10'}`}>
        <div className={`w-12 h-12 rounded-full border-4 border-white shadow-lg transition-all duration-300 overflow-hidden ${
          isActive ? 'scale-125 border-orange-500' : 'hover:scale-110'
        }`}>
          {imageSrc ? (
            <Image 
              src={imageSrc}
              alt={getDisplayName()}
              fill
              className="rounded-full object-cover"
              onError={handleImageError}
            />
          ) : null}
          
          {/* Fallback colored marker with restaurant initial */}
          <div 
            className={`w-full h-full ${getMarkerColor()} flex items-center justify-center text-white font-bold text-sm ${
              imageSrc ? 'hidden' : 'flex'
            }`}
          >
            {getDisplayName().charAt(0)}
          </div>
        </div>
        
        {/* Active state label */}
        {isActive && (
          <div className={`absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap border max-w-64 ${
            locale === 'ar' ? 'text-right' : 'text-left'
          }`}>
            <span className="text-sm font-medium text-gray-900">
              {getDisplayName()}
            </span>
            <div className="text-xs text-orange-600 mt-1">
              🍽️ {getCategory()}
            </div>
            {getLocationText() && (
              <div className="text-xs text-gray-600 mt-1">
                📍 {getLocationText()}
              </div>
            )}
            {restaurant.rating && (
              <div className="text-xs text-gray-600 mt-1">
                ⭐ {restaurant.rating.toFixed(1)} {locale === 'ar' ? 'تقييم' : 'rating'}
              </div>
            )}
          </div>
        )}

        {/* Hover tooltip */}
        <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
          isActive ? 'hidden' : 'block'
        } ${locale === 'ar' ? 'font-arabic' : ''}`}>
          {getDisplayName()}
        </div>

        {/* Pulse animation for active marker */}
        {isActive && (
          <div className="absolute inset-0 rounded-full border-4 border-orange-400 animate-ping opacity-75"></div>
        )}
      </div>
    </div>
  );
}