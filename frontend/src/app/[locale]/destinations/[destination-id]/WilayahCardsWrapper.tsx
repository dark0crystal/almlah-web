"use client";

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Mountain } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import WilayahCard from './WilayahCard';
import { WilayahWithImages, fetchWilayahImages, getPrimaryWilayahImage } from '@/services/governateApi';
import { WilayahCardsWrapperProps } from '../types';

export default function WilayahCardsWrapper({ 
  wilayahs, 
  governateName, 
  onWilayahClick 
}: WilayahCardsWrapperProps) {
  const t = useTranslations('wilayah');
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const params = useParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [wilayahsWithImages, setWilayahsWithImages] = useState<WilayahWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    // Get the width of the first card plus gap for more accurate scrolling
    const firstCard = container.children[0] as HTMLElement;
    const scrollAmount = firstCard ? firstCard.offsetWidth + 16 : 500; // card width + gap
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
      // Navigate to wilayah detail page
      const destinationId = params?.['destination-id'];
      if (destinationId) {
        router.push(`/destinations/${destinationId}/wilayah/${wilayah.id}`);
      }
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
              className="absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 lg:p-4 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-200 group"
              aria-label={t('scrollLeft')}
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-700 group-hover:text-gray-900" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 lg:p-4 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-200 group"
              aria-label={t('scrollRight')}
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-700 group-hover:text-gray-900" />
            </button>
          </>
        )}

        {/* Horizontal scrolling container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* Internet Explorer 10+ */
          }}
        >
          {wilayahsWithImages.map((wilayah) => (
            <div key={wilayah.id} className="snap-start snap-always">
              <WilayahCard
                wilayah={wilayah}
                locale={locale}
                onClick={handleWilayahClick}
              />
            </div>
          ))}
        </div>
        
      </div>

      {/* Carousel indicators */}
      {wilayahsWithImages.length > 1 && (
        <div className="flex justify-center mt-6 sm:mt-8 gap-2 sm:gap-3">
          {wilayahsWithImages.map((_, index) => (
            <button
              key={index}
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-300 hover:bg-gray-500 transition-colors duration-200"
              onClick={() => {
                if (scrollContainerRef.current) {
                  const container = scrollContainerRef.current;
                  const firstCard = container.children[0] as HTMLElement;
                  const cardWidth = firstCard?.offsetWidth || 500;
                  const gap = window.innerWidth >= 640 ? 24 : 16; // sm:gap-6 vs gap-4
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