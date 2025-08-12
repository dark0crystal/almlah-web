"use client"
import { useState } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Place } from "@/types";

interface PlaceCardProps {
  place: Place;
}

export default function PlaceCard({ place }: PlaceCardProps) {
  const router = useRouter();
  const params = useParams();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const locale = (params?.locale as string) || 'en';

  const handleCardClick = () => {
    router.push(`/${locale}/places/${place.id}`);
  };

  // Get image source
  const getImageSrc = () => {
    if (place.primary_image) {
      try {
        new URL(place.primary_image);
        return place.primary_image;
      } catch {
        return `/images/${place.primary_image}`;
      }
    }
    
    if (place.images && place.images.length > 0) {
      const primaryImage = place.images.find(img => img.is_primary) || place.images[0];
      return primaryImage.image_url;
    }
    
    return '/images/default-place.jpg';
  };

  // Get localized content
  const placeName = locale === 'ar' ? place.name_ar : place.name_en;
  const governateName = place.governate 
    ? (locale === 'ar' ? place.governate.name_ar : place.governate.name_en)
    : '';
  const wilayahName = place.wilayah 
    ? (locale === 'ar' ? place.wilayah.name_ar : place.wilayah.name_en)
    : '';

  const locationString = [governateName, wilayahName]
    .filter(Boolean)
    .join(' | ') || (locale === 'ar' ? 'سلطنة عمان' : 'Sultanate of Oman');

  const getCategoryText = () => {
    if (place.category) {
      return locale === 'ar' ? place.category.name_ar : place.category.name_en;
    }
    return locale === 'ar' ? 'الأماكن والمشروبات' : 'Food & Beverages';
  };

  return (
    <div 
      className={`bg-white rounded-2xl  hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden  ${
        isHovered ? 'transform -translate-y-1' : ''
      } ${locale === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="flex h-36 md:h-44">
        {/* Image Section - Increased width and added padding */}
        <div className="w-2/5 p-2 flex items-center">
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

            {/* Corner logo/badge */}
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
            {/* Place Name */}
            <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">
              {placeName}
            </h3>

            {/* Location */}
            <p className="text-gray-600 text-sm line-clamp-1 mb-2">
              {locationString}
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