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
      </div>
    </div>
  );
}