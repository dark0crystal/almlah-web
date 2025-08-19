"use client";

import { useTranslations, useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import WilayahCard from './WilayahCard';
import { SimpleWilayah } from '@/services/governateApi';

interface WilayahCardsWrapperProps {
  wilayahs: SimpleWilayah[];
  governateName: string;
  onWilayahClick?: (wilayah: SimpleWilayah) => void;
}

export default function WilayahCardsWrapper({ 
  wilayahs, 
  governateName, 
  onWilayahClick 
}: WilayahCardsWrapperProps) {
  const t = useTranslations('wilayah');
  const locale = useLocale() as 'ar' | 'en';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = 300; // Amount to scroll in pixels
    const currentScrollLeft = container.scrollLeft;
    
    if (direction === 'left') {
      container.scrollTo({
        left: currentScrollLeft - scrollAmount,
        behavior: 'smooth'
      });
    } else {
      container.scrollTo({
        left: currentScrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleWilayahClick = (wilayah: SimpleWilayah) => {
    if (onWilayahClick) {
      onWilayahClick(wilayah);
    } else {
      // Default behavior: navigate to wilayah page
      // You can implement navigation logic here
      console.log('Navigate to wilayah:', wilayah.slug);
    }
  };

  if (!wilayahs || wilayahs.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t('wilayahsIn', { governate: governateName })}
        </h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            {t('noWilayahsFound')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('wilayahsIn', { governate: governateName })}
          </h2>
          <p className="text-gray-600">
            {t('exploreDistricts', { count: wilayahs.length })}
          </p>
        </div>
        
        {/* Navigation buttons */}
        {wilayahs.length > 3 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleScroll('left')}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label={t('scrollLeft')}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label={t('scrollRight')}
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal scrolling container */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* Internet Explorer 10+ */
          }}
        >
          {wilayahs.map((wilayah) => (
            <WilayahCard
              key={wilayah.id}
              wilayah={wilayah}
              locale={locale}
              onClick={handleWilayahClick}
            />
          ))}
        </div>
        
        {/* Gradient fade effects */}
        {wilayahs.length > 3 && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
          </>
        )}
      </div>

      {/* Mobile scroll hint */}
      {wilayahs.length > 1 && (
        <div className="mt-4 flex justify-center md:hidden">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <span>←</span> {t('swipeToSeeMore')} <span>→</span>
          </p>
        </div>
      )}
    </div>
  );
}