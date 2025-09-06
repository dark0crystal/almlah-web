"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { MapMarkerProps } from './types';

export default function MapMarker({ destination, isActive = false, onClick }: MapMarkerProps) {
  const locale = useLocale();
  const [imageError, setImageError] = useState(false);

  // Get display name based on current locale
  const getDisplayName = () => {
    if (locale === 'ar') {
      return destination.governorateData?.name_ar || destination.name;
    }
    return destination.governorateData?.name_en || destination.name;
  };

  // Get category/subtitle based on current locale
  const getCategory = () => {
    if (locale === 'ar') {
      return destination.governorateData?.subtitle_ar || destination.category || 'محافظة عمانية';
    }
    return destination.governorateData?.subtitle_en || destination.category || 'Omani Governorate';
  };

  // Handle image display
  const getImageSrc = () => {
    if (destination.image) {
      return destination.image;
    }
    return null;
  };

  // Generate a consistent color based on destination ID
  const getMarkerColor = () => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500'
    ];
    return colors[destination.id % colors.length];
  };

  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      style={{
        left: `${destination.coordinates.x}%`,
        top: `${destination.coordinates.y}%`
      }}
      onClick={() => onClick(destination.id)}
    >
      <div className={`relative ${isActive ? 'z-20' : 'z-10'}`}>
        <div className={`w-12 h-12 rounded-full border-4 border-white shadow-lg transition-all duration-300 overflow-hidden ${
          isActive ? 'scale-125 border-blue-500' : 'hover:scale-110'
        }`}>
          {getImageSrc() && !imageError ? (
            <Image 
              src={getImageSrc() || ''}
              alt={getDisplayName()}
              fill
              className="rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div 
              className={`w-full h-full ${getMarkerColor()} flex items-center justify-center text-white font-bold text-sm`}
            >
              {getDisplayName().charAt(0)}
            </div>
          )}
        </div>
        
        {/* Active state label */}
        {isActive && (
          <div className={`absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap border ${
            locale === 'ar' ? 'text-right font-arabic' : 'text-left'
          }`}>
            <span className="text-sm font-medium text-gray-900">
              {getDisplayName()}
            </span>
            <div className="text-xs text-gray-600 mt-1">
              {getCategory()}
            </div>
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
          <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75"></div>
        )}
      </div>
    </div>
  );
}