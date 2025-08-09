"use client"
import { useState } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";

// Add this interface for the name object
interface PlaceName {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

interface Place {
  id: string;
  name: string | PlaceName; // Updated to handle both formats
  wilayah?: string;
  location?: string;
  image?: string;
  rating?: number;
  duration?: string;
}

interface PlaceCardProps {
  place: Place;
}

// Helper function to safely get place name
const getPlaceName = (name: Place['name'], locale: string = 'en'): string => {
  if (typeof name === 'string') {
    return name;
  }
  
  if (typeof name === 'object' && name !== null) {
    return locale === 'ar' ? name.name_ar : name.name_en;
  }
  
  return 'Unknown Place';
};

export default function PlaceCard({ place }: PlaceCardProps) {
  const router = useRouter();
  const params = useParams();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get current locale from params
  const locale = (params?.locale as string) || 'en';

  const handleCardClick = () => {
    router.push(`/places/${place.id}`);
  };

  // Get safe image source
  const getImageSrc = () => {
    if (!place.image) {
      return '/images/default-place.jpg'; // Fallback default image
    }
    
    // Check if it's a valid URL (http/https) or local path
    try {
      new URL(place.image);
      return place.image;
    } catch {
      return `/images/${place.image}`;
    }
  };

  // Get the appropriate name for current locale
  const placeName = getPlaceName(place.name, locale);

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
      
      <div className="absolute bottom-4 right-4 text-right">
        <h3 className="text-white text-xl font-bold mb-1 drop-shadow-lg">
          {placeName}
        </h3>
        <p className="text-white/90 text-sm font-medium drop-shadow-md">
          {place.wilayah || place.location || 'صور، جنوب الشرقية'}
        </p>
        {place.rating && (
          <div className="flex items-center justify-end mt-1">
            <span className="text-yellow-400 text-sm">{place.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}