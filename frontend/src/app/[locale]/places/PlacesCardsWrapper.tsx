"use client"
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import PlaceCard from "./PlaceCard";
import GovernateFilter from "./GovernateFilterComponent";
import PlaceSearchBar from "./PlaceSearchBar";
import FilterButton from "./FilterButton";
import PlacesFilterModal from "./PlacesFilterModal";
import { fetchPlaces } from "@/services/placesApi";
import { Place } from "@/types";

interface PlacesCardsWrapperProps {
  isMobileMapView?: boolean;
  selectedGovernateId?: string | null;
  onGovernateChange?: (governateId: string | null) => void;
  categoryId: string; // Required category ID prop
  selectedCategoryIds?: string[];
  onCategoryIdsChange?: (categoryIds: string[]) => void;
  selectedPlaceId?: string | null;
  onPlaceClick?: (placeId: string) => void;
}

export default function PlacesCardsWrapper({
  isMobileMapView = false,
  selectedGovernateId,
  onGovernateChange,
  categoryId,
  selectedPlaceId,
  onPlaceClick
}: PlacesCardsWrapperProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('places');
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch places when governate or category changes
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading places with categoryId:', categoryId, 'governateId:', selectedGovernateId);
        
        // Use the updated fetchPlaces function with category ID and governate ID
        const data = await fetchPlaces(categoryId, selectedGovernateId);
        
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

    // Only load if we have a valid categoryId
    if (categoryId) {
      loadPlaces();
    }
  }, [selectedGovernateId, categoryId, t]);

  // Scroll to selected place when selectedPlaceId changes
  useEffect(() => {
    if (selectedPlaceId && scrollContainerRef.current) {
      const selectedElement = scrollContainerRef.current.querySelector(`[data-place-id="${selectedPlaceId}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        });
      }
    }
  }, [selectedPlaceId]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-lg">{t('loadingPlaces')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        <div className="text-lg font-semibold">{t('error')}: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  // Mobile map view - horizontal scrollable cards with filter
  if (isMobileMapView) {
    return (
      <div className="w-full border-t border-gray-200">
        {/* Mobile Filter and Search */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-3 space-y-3">
          <GovernateFilter
            selectedGovernateId={selectedGovernateId}
            onGovernateChange={onGovernateChange}
            locale={locale}
          />
          <PlaceSearchBar
            selectedGovernateId={selectedGovernateId}
            categoryId={categoryId}
            onPlaceSelect={onPlaceClick}
            locale={locale}
            placeholder={locale === 'ar' ? 'البحث عن الأماكن...' : 'Search places...'}
          />
        </div>
        
        {places.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-base">{t('noResults')}</p>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div 
              ref={scrollContainerRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            >
              {places.map((place) => (
                <div 
                  key={place.id} 
                  className="flex-shrink-0 w-64"
                  data-place-id={place.id}
                >
                  <PlaceCard 
                    place={place} 
                    locale={locale}
                    isSelected={selectedPlaceId === place.id}
                    onPlaceClick={onPlaceClick}
                    isHorizontalScroll={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop/tablet view - vertical stack with sticky filter and scrollable container
  return (
    <div className={`${locale === 'ar' ? 'rtl' : 'ltr'} h-full flex flex-col`}>
      {/* Sticky Filter and Search Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('filterAndSearch')}
          </h2>
        </div>
        
        {/* Filter and Search Container */}
        <div className={`flex gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          {/* Governate Filter */}
          <div className="flex-shrink-0 w-64">
            <GovernateFilter
              selectedGovernateId={selectedGovernateId}
              onGovernateChange={onGovernateChange}
              locale={locale}
            />
          </div>
          
          {/* Search Bar */}
          <div className="flex-1">
            <PlaceSearchBar
              selectedGovernateId={selectedGovernateId}
              categoryId={categoryId}
              onPlaceSelect={onPlaceClick}
              locale={locale}
              placeholder={locale === 'ar' ? 'البحث عن الأماكن...' : 'Search places...'}
            />
          </div>
          
          {/* Filter Button */}
          <div className="flex-shrink-0">
            <FilterButton
              onClick={() => setIsFilterModalOpen(true)}
              hasActiveFilters={selectedGovernateId !== null || selectedCategoryIds.length > 0}
              filterCount={(selectedGovernateId ? 1 : 0) + selectedCategoryIds.length}
              locale={locale}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {places.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg">{t('noResults')}</p>
          </div>
        </div>
      ) : (
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          <div className="space-y-4">
            {places.map((place) => (
              <div key={place.id} data-place-id={place.id}>
                <PlaceCard 
                  place={place} 
                  locale={locale}
                  isSelected={selectedPlaceId === place.id}
                  onPlaceClick={onPlaceClick}
                  isHorizontalScroll={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Filter Modal */}
      <PlacesFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedGovernateId={selectedGovernateId}
        selectedCategoryIds={selectedCategoryIds}
        onApplyFilters={(governateId, categoryIds) => {
          onGovernateChange?.(governateId);
          onCategoryIdsChange?.(categoryIds);
        }}
        locale={locale}
      />
    </div>
  );
}