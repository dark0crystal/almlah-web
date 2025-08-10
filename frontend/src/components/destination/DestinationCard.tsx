"use client"
import React from 'react';
import { Heart, Star, MapPin, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

// Fallback image for governorates without images
const fallbackImage = '/img5.jpeg'; // You can replace this with a default governorate image

export default function DestinationCard({ destination, language = 'ar' }) {
  // Handle image display
  const getImageSrc = () => {
    if (destination.image) {
      return destination.image;
    }
    return fallbackImage;
  };

  // Check if image exists
  const hasImage = destination.image && destination.image !== '';

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-md overflow-hidden mb-4 hover:shadow-lg transition-all duration-300 p-2 w-full max-w-sm mx-auto sm:max-w-none min-h-[120px] md:min-h-[280px] lg:min-h-[320px]">
      {/* Mobile: Horizontal Layout / Desktop: Vertical Layout */}
      <div className="flex md:flex-col h-full">
        {/* Image Section */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-full md:aspect-[4/3] lg:aspect-[16/10] flex-shrink-0 rounded-xl md:rounded-3xl overflow-hidden bg-gray-200">
          {hasImage ? (
            <Image 
              src={getImageSrc()}
              alt={destination.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback if image fails to load
                e.target.src = fallbackImage;
              }}
            />
          ) : (
            // Placeholder when no image is available
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 hidden md:block">No Image</p>
              </div>
            </div>
          )}
          
          {/* Optional overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          
          {/* Image count indicator if multiple images */}
          {destination.governorateData?.images && destination.governorateData.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
              <ImageIcon className="w-3 h-3 inline mr-1" />
              {destination.governorateData.images.length}
            </div>
          )}
        </div>
                
        {/* Text content */}
        <div className="flex-1 p-4 md:p-6 flex flex-col justify-center md:justify-start">
          {/* Category/Subtitle */}
          <p className={`text-gray-600 text-xs sm:text-sm mb-2 md:mb-3 opacity-90 line-clamp-2 ${
            language === 'ar' ? 'text-right' : 'text-left'
          }`}>
            {destination.category || (language === 'ar' ? 'محافظة عمانية' : 'Omani Governorate')}
          </p>
          
          {/* Main title */}
          <h3 className={`text-gray-900 text-base sm:text-lg md:text-xl font-bold leading-tight line-clamp-2 mb-2 ${
            language === 'ar' ? 'text-right' : 'text-left'
          }`}>
            {destination.name}
          </h3>

          {/* Additional info */}
          <div className="flex items-center justify-between mt-auto">
            {/* Coordinates info */}
            {destination.governorateData?.latitude && destination.governorateData?.longitude && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="w-3 h-3 mr-1" />
                <span>
                  {destination.governorateData.latitude.toFixed(2)}, {destination.governorateData.longitude.toFixed(2)}
                </span>
              </div>
            )}

            {/* Rating */}
            {destination.rating && (
              <div className="flex items-center text-xs text-gray-500">
                <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                <span>{destination.rating}</span>
              </div>
            )}
          </div>

          {/* Places count if available */}
          {destination.governorateData?.place_count !== undefined && (
            <div className="mt-2 text-xs text-gray-500">
              {language === 'ar' 
                ? `${destination.governorateData.place_count} أماكن` 
                : `${destination.governorateData.place_count} places`
              }
            </div>
          )}

          {/* Wilayahs count if available */}
          {destination.governorateData?.wilayah_count !== undefined && (
            <div className="text-xs text-gray-500">
              {language === 'ar' 
                ? `${destination.governorateData.wilayah_count} ولايات` 
                : `${destination.governorateData.wilayah_count} wilayahs`
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}