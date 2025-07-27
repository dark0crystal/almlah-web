"use client"
import { useState } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/**
 * Individual place card component with background image and overlay text
 * Features hover effects and text overlay on bottom right corner
 */
export default function PlaceCard({ place, isExpanded }) {
  const router = useRouter();
  // State to track hover status for interactive effects
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    // Navigate to place details page using slug or id
    const placeIdentifier = place.slug || place.id || place.name.toLowerCase().replace(/\s+/g, '-');
    router.push(`/places/${placeIdentifier}`);
  };

  return (
    <div 
      className="relative rounded-2xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer h-64 w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Background image */}
      {!imageError ? (
        <Image 
          src={place.image}
          alt={place.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-transform duration-300 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          onError={() => setImageError(true)}
          priority={false}
        />
      ) : (
        // Fallback when image fails to load
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">{place.name}</p>
          </div>
        </div>
      )}
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Text overlay - bottom right corner */}
      <div className="absolute bottom-4 right-4 text-right">
        <h3 className="text-white text-xl font-bold mb-1 drop-shadow-lg">
          {place.name}
        </h3>
        <p className="text-white/90 text-sm font-medium drop-shadow-md">
          {place.wilayah || place.location || 'Oman'}
        </p>
      </div>
    </div>
  );
}