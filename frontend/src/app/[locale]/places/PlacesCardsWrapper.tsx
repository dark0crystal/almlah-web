"use client"
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PlaceCard from "./PlaceCard";
import { fetchPlaces } from "@/services/placesApi";
import { Place } from "@/types";

interface PlacesCardsWrapperProps {
  isMobileMapView?: boolean;
  selectedGovernateId?: string | null;
  onGovernateChange?: (governateId: string | null) => void;
}

export default function PlacesCardsWrapper({ 
  isMobileMapView = false, 
  selectedGovernateId,
  onGovernateChange 
}: PlacesCardsWrapperProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
    
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Localized text
  const text = {
    loading: locale === 'ar' ? 'جاري تحميل الأماكن السياحية...' : 'Loading tourism places...',
    error: locale === 'ar' ? 'خطأ' : 'Error',
    tryAgain: locale === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
    title: locale === 'ar' ? 'الأماكن السياحية' : 'Tourism Places',
    noResults: locale === 'ar' ? 'لم يتم العثور على أماكن سياحية' : 'No tourism places found',
   
  };

  // Fetch places when governate changes
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPlaces(selectedGovernateId);
        setPlaces(data);
      } catch (err: any) {
        console.error('Error loading places:', err);
        setError(err.message || text.error);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [selectedGovernateId, text.error]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-lg">{text.loading}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        <div className="text-lg font-semibold">{text.error}: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {text.tryAgain}
        </button>
      </div>
    );
  }

  // Mobile map view - horizontal scrollable cards
  if (isMobileMapView) {
    return (
      <div className="w-full bg-white border-t border-gray-200 shadow-lg">
       

        {/* Horizontally scrollable cards */}
        {places.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-base">{text.noResults}</p>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {places.map((place) => (
                <div key={place.id} className="flex-shrink-0 w-80">
                  <PlaceCard place={place} />
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
     
      {/* Places List - Single Column with scroll */}
      {places.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg">{text.noResults}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 pr-2">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}