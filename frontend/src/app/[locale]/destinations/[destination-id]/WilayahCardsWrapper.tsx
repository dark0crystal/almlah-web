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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {t('wilayahsIn', { governate: governateName })}
        </h2>
        <p className="text-gray-600 text-lg">
          {t('exploreDistricts', { count: wilayahsWithImages.length })}
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation buttons - Overlaid on carousel */}
        {wilayahsWithImages.length > 1 && (
          <>
            <button
              onClick={() => handleScroll('left')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-200 group"
              aria-label={t('scrollLeft')}
            >
              <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-gray-900" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-200 group"
              aria-label={t('scrollRight')}
            >
              <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-gray-900" />
            </button>
          </>
        )}

        {/* Horizontal scrolling container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* Internet Explorer 10+ */
          }}
        >
          {wilayahsWithImages.map((wilayah) => (
            <div key={wilayah.id} className="snap-start">
              <WilayahCard
                wilayah={wilayah}
                locale={locale}
                onClick={handleWilayahClick}
              />
            </div>
          ))}
        </div>
        
        {/* Subtle gradient fade effects */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#f3f3eb] to-transparent pointer-events-none z-20" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#f3f3eb] to-transparent pointer-events-none z-20" />
      </div>

      {/* Carousel indicators */}
      {wilayahsWithImages.length > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {wilayahsWithImages.map((_, index) => (
            <button
              key={index}
              className="w-2 h-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
              onClick={() => {
                if (scrollContainerRef.current) {
                  const container = scrollContainerRef.current;
                  const cardWidth = container.children[0]?.clientWidth || 400;
                  const gap = 16; // 4 * 4px (gap-4)
                  const scrollPosition = index * (cardWidth + gap);
                  container.scrollTo({
                    left: scrollPosition,
                    behavior: 'smooth'
                  });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Mobile scroll hint */}
      <div className="mt-4 flex justify-center md:hidden">
        <p className="text-xs text-gray-500 flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
          <span>←</span> {t('swipeToSeeMore')} <span>→</span>
        </p>
      </div>
    </div>
  );
}