"use client";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import DestinationPlaceCard from "./DestinationPlaceCard";
import { fetchTourismPlaces, CATEGORY_IDS } from "@/services/placesApi";
import { Place } from "@/types";

interface DestinationPlacesWrapperProps {
  governateId: string;
  locale: string;
  categoryId?: string; // Optional category filter
}

export default function DestinationPlacesWrapper({ 
  governateId, 
  locale,
  categoryId = CATEGORY_IDS.TOURISM // Default to tourism places
}: DestinationPlacesWrapperProps) {
  const t = useTranslations('places');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch places for this governate
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading places for governate:', governateId, 'category:', categoryId);
        
        // Use the fetchTourismPlaces function which accepts governateId
        const data = await fetchTourismPlaces(governateId);
        
        console.log('Places loaded:', data);
        setPlaces(data);
      } catch (err: any) {
        console.error('Error loading places:', err);
        setError(err.message || t('error'));
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    if (governateId) {
      loadPlaces();
    }
  }, [governateId, categoryId, t]);

  // Scroll functions
  const scrollLeft = () => {
    const container = document.getElementById('places-scroll-container');
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('places-scroll-container');
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8">
        <div className={`flex items-center gap-3 mb-6 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <MapPin className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {locale === 'ar' ? 'أماكن للزيارة' : 'Places to Visit'}
          </h2>
        </div>
        
        <div className="flex gap-4 overflow-hidden">
          {/* Loading skeletons */}
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-64 bg-gray-200 rounded-xl h-72 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8">
        <div className={`flex items-center gap-3 mb-6 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <MapPin className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {locale === 'ar' ? 'أماكن للزيارة' : 'Places to Visit'}
          </h2>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-center">
            {locale === 'ar' ? 'خطأ في تحميل الأماكن' : 'Error loading places'}: {error}
          </p>
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="w-full py-8">
        <div className={`flex items-center gap-3 mb-6 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <MapPin className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {locale === 'ar' ? 'أماكن للزيارة' : 'Places to Visit'}
          </h2>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg">
              {locale === 'ar' ? 'لا توجد أماكن متاحة في هذه المحافظة حاليًا' : 'No places available in this governate currently'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      {/* Section Header */}
      <div className={`flex items-center justify-between mb-6 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <MapPin className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {locale === 'ar' ? 'أماكن للزيارة' : 'Places to Visit'}
          </h2>
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
            {places.length}
          </span>
        </div>

        {/* Navigation Buttons - Show only if more than 3 places */}
        {places.length > 3 && (
          <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={locale === 'ar' ? scrollRight : scrollLeft}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={locale === 'ar' ? 'التالي' : 'Previous'}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={locale === 'ar' ? scrollLeft : scrollRight}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={locale === 'ar' ? 'السابق' : 'Next'}
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Places Container */}
      <div className="relative">
        <div
          id="places-scroll-container"
          className={`flex gap-4 overflow-x-auto scrollbar-hide pb-2 ${
            locale === 'ar' ? 'flex-row-reverse' : ''
          }`}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' }
          }}
        >
          {places.map((place) => (
            <DestinationPlaceCard 
              key={place.id} 
              place={place} 
              locale={locale}
            />
          ))}
        </div>

        {/* Fade edges for better scroll indication */}
        {places.length > 3 && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
          </>
        )}
      </div>

      {/* View All Link */}
      {places.length >= 4 && (
        <div className="mt-6 text-center">
          <button className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
            {locale === 'ar' ? 'عرض جميع الأماكن' : 'View All Places'}
          </button>
        </div>
      )}
    </div>
  );
}