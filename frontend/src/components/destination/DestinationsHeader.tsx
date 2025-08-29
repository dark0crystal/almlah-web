"use client";

import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import img from "../../../public/G63.png"

interface DestinationsHeaderProps {
  imageSrc?: string;
  imageAlt?: string;
}

export default function DestinationsHeader({
  
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
        
        {/* Desktop/Tablet Layout - Two sections side by side */}
        <div className="hidden md:flex h-full">
          {/* Left Section - Title (when LTR) or Image (when RTL) */}
          <div className={`w-1/2 h-full flex flex-col justify-center ${isRTL ? 'order-2' : 'order-1'}`}>
            {isRTL ? (
              // Image section when RTL
              <div className="w-full h-full relative">
                <Image
                  src={img.src}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              // Text section when LTR
              <div className="p-8 lg:p-12 text-left">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                  {t('header.title')}
                </h1>
                <p className="text-sm md:text-base text-white/80 mb-6 leading-relaxed">
                  {t('header.subtitle')}
                </p>
              </div>
            )}
          </div>

          {/* Right Section - Image (when LTR) or Title (when RTL) */}
          <div className={`w-1/2 h-full flex flex-col justify-center ${isRTL ? 'order-1' : 'order-2'}`}>
            {isRTL ? (
              // Text section when RTL
              <div className="p-8 lg:p-12 text-right">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                  {t('header.title')}
                </h1>
                <p className="text-sm md:text-base text-white/80 mb-6 leading-relaxed">
                  {t('header.subtitle')}
                </p>
              </div>
            ) : (
              // Image section when LTR
              <div className="w-full h-full relative">
                <Image
                  src={img.src}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout - Image on top, text at bottom */}
        <div className="md:hidden flex flex-col h-full">
          {/* Top - Image */}
          <div className="w-full h-1/2 relative">
            <Image
              src={img.src}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Bottom - Text content */}
          <div className={`w-full h-1/2 flex flex-col justify-center px-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
              {t('header.title')}
            </h1>
            <p className="text-sm text-white/80 leading-relaxed">
              {t('header.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}