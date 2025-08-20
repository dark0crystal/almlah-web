"use client";

import { useTranslations, useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, Mountain } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import WilayahCard from './WilayahCard';
import { SimpleWilayah, WilayahWithImages, fetchWilayahImages, getPrimaryWilayahImage } from '@/services/governateApi';

interface WilayahCardsWrapperProps {
  wilayahs: SimpleWilayah[];
  governateName: string;
  onWilayahClick?: (wilayah: WilayahWithImages) => void;
}

export default function WilayahCardsWrapper({ 
  wilayahs, 
  governateName, 
  onWilayahClick 
}: WilayahCardsWrapperProps) {
  const t = useTranslations('wilayah');
  const locale = useLocale() as 'ar' | 'en';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [wilayahsWithImages, setWilayahsWithImages] = useState<WilayahWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = 350; // Amount to scroll in pixels
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

  // Fetch images for all wilayahs
  useEffect(() => {
    const fetchImagesForWilayahs = async () => {
      setLoading(true);
      const wilayahsWithImagesData = await Promise.all(
        wilayahs.map(async (wilayah) => {
          try {
            const images = await fetchWilayahImages(wilayah.id);
            const primaryImageUrl = images.length > 0 ? getPrimaryWilayahImage(images) : undefined;
            return {
              ...wilayah,
              images,
              image_url: primaryImageUrl,
              place_count: Math.floor(Math.random() * 25) + 5 // Placeholder until backend provides this
            } as WilayahWithImages;
          } catch (error) {
            console.error(`Failed to fetch images for wilayah ${wilayah.id}:`, error);
            return {
              ...wilayah,
              images: [],
              place_count: Math.floor(Math.random() * 25) + 5 // Placeholder
            } as WilayahWithImages;
          }
        })
      );
      setWilayahsWithImages(wilayahsWithImagesData);
      setLoading(false);
    };

    if (wilayahs.length > 0) {
      fetchImagesForWilayahs();
    }
  }, [wilayahs]);

  const handleWilayahClick = (wilayah: WilayahWithImages) => {
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
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {t('wilayahsIn', { governate: governateName })}
        </h2>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center">
          <Mountain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {t('noWilayahsFound')}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {t('wilayahsIn', { governate: governateName })}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('exploreDistricts', { count: wilayahs.length })}
            </p>
          </div>
        </div>
        
        {/* Loading skeletons */}
        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="min-w-[320px] flex-shrink-0">
              <div className="bg-gray-200 animate-pulse rounded-xl h-48 mb-4" />
              <div className="space-y-3 p-5">
                <div className="bg-gray-200 animate-pulse rounded h-6 w-3/4" />
                <div className="bg-gray-200 animate-pulse rounded h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {t('wilayahsIn', { governate: governateName })}
          </h2>
          <p className="text-gray-600 text-lg">
            {t('exploreDistricts', { count: wilayahsWithImages.length })}
          </p>
        </div>
        
        {/* Navigation buttons */}
        {wilayahsWithImages.length > 3 && (
          <div className="flex gap-3">
            <button
              onClick={() => handleScroll('left')}
              className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 shadow-sm"
              aria-label={t('scrollLeft')}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 shadow-sm"
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
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* Internet Explorer 10+ */
          }}
        >
          {wilayahsWithImages.map((wilayah) => (
            <WilayahCard
              key={wilayah.id}
              wilayah={wilayah}
              locale={locale}
              onClick={handleWilayahClick}
            />
          ))}
        </div>
        
        {/* Enhanced gradient fade effects */}
        {wilayahsWithImages.length > 3 && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10" />
          </>
        )}
      </div>

      {/* Mobile scroll hint */}
      {wilayahsWithImages.length > 1 && (
        <div className="mt-6 flex justify-center md:hidden">
          <p className="text-sm text-gray-500 flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2">
            <span>←</span> {t('swipeToSeeMore')} <span>→</span>
          </p>
        </div>
      )}
    </div>
  );
}