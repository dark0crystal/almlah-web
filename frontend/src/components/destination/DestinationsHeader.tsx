"use client";

import { useParams } from "next/navigation";
import Image from "next/image";

interface DestinationsHeaderProps {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export default function DestinationsHeader({
  title = "Discover Destinations",
  subtitle = "Explore amazing places across the region",
  imageSrc = "/gallery/destination-hero.jpg",
  imageAlt = "Destination landscape"
}: DestinationsHeaderProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const isRTL = locale === 'ar';
  
  // Arabic translations
  const getTitle = () => {
    return locale === 'ar' ? 'اكتشف الوجهات' : title;
  };
  
  const getSubtitle = () => {
    return locale === 'ar' ? 'استكشف أماكن مذهلة عبر المنطقة' : subtitle;
  };

  return (
    <div className={`w-full h-[40vh] flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Main card container with rounded corners and dark background */}
      <div className="w-[88vw] h-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Desktop Layout - Side by side */}
        <div className={`hidden md:flex items-center h-full ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Left side - Image */}
          <div className="w-1/2 h-full relative">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Right side - Text content */}
          <div className={`w-1/2 h-full flex flex-col justify-center px-8 lg:px-12 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Main title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
              {getTitle()}
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm md:text-base text-white/80 mb-6 leading-relaxed">
              {getSubtitle()}
            </p>
          </div>
        </div>

        {/* Mobile Layout - Image on top, text below */}
        <div className="md:hidden flex flex-col h-full">
          {/* Top - Image */}
          <div className="w-full h-1/2 relative">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Bottom - Text content */}
          <div className={`w-full h-1/2 flex flex-col justify-center px-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Main title */}
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
              {getTitle()}
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm text-white/80 leading-relaxed">
              {getSubtitle()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}