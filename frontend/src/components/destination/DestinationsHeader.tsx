"use client";

import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import Image from "next/image";

interface DestinationsHeaderProps {
  imageSrc?: string;
  imageAlt?: string;
}

export default function DestinationsHeader({
  imageSrc = "/gallery/destination-hero.jpg",
  imageAlt = "Destination landscape"
}: DestinationsHeaderProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('destinations');
  
  const isRTL = locale === 'ar';

  return (
    <div className={`w-full h-[40vh] flex items-center justify-center mt-10`}>
      {/* Main card container with rounded corners and dark background */}
      <div className="w-[88vw] h-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Desktop Layout - Full width with text positioned at corners */}
        <div className="hidden md:block h-full relative">
          {/* Background Image - Full width */}
          <div className="w-full h-full relative">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Text overlay positioned at bottom corners */}
          <div className="absolute inset-0 flex items-end">
            {/* Text content positioned at bottom corner based on locale */}
            <div className={`p-8 lg:p-12 max-w-md ${isRTL ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
              {/* Main title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                {t('header.title')}
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm md:text-base text-white/80 mb-6 leading-relaxed">
                {t('header.subtitle')}
              </p>
            </div>
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
          <div className={`w-full h-1/2 flex flex-col justify-center px-6`}>
            {/* Main title */}
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
              {t('header.title')}
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm text-white/80 leading-relaxed">
              {t('header.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}