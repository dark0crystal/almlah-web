"use client"
import { useState } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Place, Governate, Wilayah } from "@/types";

interface PlaceCardProps {
  place: Place;
}

// Helper function to get localized name from bilingual data
const getLocalizedName = (place: Place, locale: string = 'en'): string => {
  return locale === 'ar' ? place.name_ar : place.name_en;
};

// Helper function to get governate name
const getGovernateName = (governate: Governate | undefined, locale: string = 'en'): string => {
  if (!governate) return '';
  return locale === 'ar' ? governate.name_ar : governate.name_en;
};

// Helper function to get wilayah name
const getWilayahName = (wilayah: Wilayah | undefined, locale: string = 'en'): string => {
  if (!wilayah) return '';
  return locale === 'ar' ? wilayah.name_ar : wilayah.name_en;
};

// Helper function to get place description
const getPlaceDescription = (place: Place, locale: string = 'en'): string => {
  return locale === 'ar' ? place.description_ar || '' : place.description_en || '';
};

export default function PlaceCard({ place }: PlaceCardProps) {
  const router = useRouter();
  const params = useParams();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get current locale from params
  const locale = (params?.locale as string) || 'en';

  const handleCardClick = () => {
    router.push(`/${locale}/places/${place.id}`);
  };

  // Get safe image source
  const getImageSrc = () => {
    if (place.primary_image) {
      // Check if it's a valid URL (http/https) or local path
      try {
        new URL(place.primary_image);
        return place.primary_image;
      } catch {
        return `/images/${place.primary_image}`;
      }
    }
    
    // Fallback to first image if available
    if (place.images && place.images.length > 0) {
      const primaryImage = place.images.find(img => img.is_primary) || place.images[0];
      return primaryImage.image_url;
    }
    
    return '/images/default-place.jpg'; // Fallback default image
  };

  // Get the appropriate names for current locale
  const placeName = getLocalizedName(place, locale);
  const governateName = getGovernateName(place.governate, locale);
  const wilayahName = getWilayahName(place.wilayah, locale);
  const description = getPlaceDescription(place, locale);

  // Format location string
  const locationString = governateName && wilayahName 
    ? `${governateName} | ${wilayahName}`
    : governateName || wilayahName || (locale === 'ar' ? 'صور، جنوب الشرقية' : 'Sur, South Eastern');

  return (
    <div 
      className="relative rounded-2xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer h-52 w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {!imageError ? (
        <Image 
          src={getImageSrc()}
          alt={placeName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-transform duration-300 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          onError={() => setImageError(true)}
          priority={false}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">{placeName}</p>
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      <div className={`absolute bottom-4 ${locale === 'ar' ? 'left-4 text-left' : 'right-4 text-right'}`}>
        <h3 className="text-white text-xl font-bold mb-1 drop-shadow-lg">
          {placeName}
        </h3>
        <p className="text-white/90 text-sm font-medium drop-shadow-md">
          {locationString}
        </p>
        {place.rating && (
          <div className={`flex items-center ${locale === 'ar' ? 'justify-start' : 'justify-end'} mt-1`}>
            <span className="text-yellow-400 text-sm">{place.rating.toFixed(1)}</span>
          </div>
        )}
        {description && (
          <p className="text-white/80 text-xs mt-1 drop-shadow-md line-clamp-2 max-w-48">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}