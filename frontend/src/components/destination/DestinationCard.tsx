"use client"
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

// Fallback image for governorates without images
const fallbackImage = '/img5.jpeg';

export default function DestinationCard({ destination, isHighlighted = false }) {
  const locale = useLocale(); // Get current locale from next-intl
  const router = useRouter();

  // Get display name based on current locale
  const getDisplayName = () => {
    if (locale === 'ar') {
      return destination.governorateData?.name_ar || destination.name;
    }
    return destination.governorateData?.name_en || destination.name;
  };

  // Get subtitle based on current locale
  const getSubtitle = () => {
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
    return fallbackImage;
  };

  // Handle card click navigation
  const handleCardClick = () => {
    router.push(`/${locale}/destinations/${destination.id}`);
  };

  const hasImage = destination.image && destination.image !== '';

  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 w-full mx-auto cursor-pointer ${
        isHighlighted ? 'ring-2 ring-blue-500 shadow-lg scale-105' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="p-2">
        <div className="relative w-full aspect-[5/3] overflow-hidden rounded-2xl">
        {hasImage ? (
          <Image 
            src={getImageSrc()}
            alt={getDisplayName()}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = fallbackImage;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xl font-bold">
                  {getDisplayName().charAt(0)}
                </span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
                     
      {/* Text content - only title */}
      <div className="py-4 px-6 text-center">
        {/* Main title only */}
        <h3 className={`text-gray-900 text-xl font-medium leading-tight line-clamp-1 ${
          locale === 'ar' ? 'text-right font-arabic' : 'text-left'
        }`}>
          {getDisplayName()}
        </h3>
      </div>
    </div>
  );
}