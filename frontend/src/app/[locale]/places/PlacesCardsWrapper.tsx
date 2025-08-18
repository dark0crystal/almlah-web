"use client"
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import PlaceCard from "./PlaceCard";
import { fetchPlaces } from "@/services/placesApi";
import { Place } from "@/types";

interface PlacesCardsWrapperProps {
  isMobileMapView?: boolean;
  selectedGovernateId?: string | null;
  onGovernateChange?: (governateId: string | null) => void;
  categoryId: string; // Required category ID prop
}

export default function PlacesCardsWrapper({
  isMobileMapView = false,
  selectedGovernateId,
  onGovernateChange,
  categoryId
}: PlacesCardsWrapperProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('places');
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Mobile map view - horizontal scrollable cards
  if (isMobileMapView) {
    return (
      <div className="w-full bg-white border-t border-gray-200 shadow-lg">
        {places.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-base">{t('noResults')}</p>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {places.map((place) => (
                <div key={place.id} className="flex-shrink-0 w-80">
                  <PlaceCard place={place} locale={locale} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop/tablet view - vertical stack with scrollable container
  return (
    <div className={`${locale === 'ar' ? 'rtl' : 'ltr'} h-full flex flex-col`}>
      {places.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg">{t('noResults')}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 pr-2">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}