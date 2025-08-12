"use client"
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PlaceCard from "./PlaceCard";
import GovernateFilter from "./GovernateFilterComponent";
import { fetchPlaces } from "@/services/placesApi";
import { Place } from "@/types";

export default function PlacesCardsWrapper() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGovernateId, setSelectedGovernateId] = useState<string | null>(null);

  // Localized text
  const text = {
    loading: locale === 'ar' ? 'جاري تحميل الأماكن السياحية...' : 'Loading tourism places...',
    error: locale === 'ar' ? 'خطأ' : 'Error',
    tryAgain: locale === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
    title: locale === 'ar' ? 'الأماكن السياحية' : 'Tourism Places',
    noResults: locale === 'ar' ? 'لم يتم العثور على أماكن سياحية' : 'No tourism places found',
    resultsCount: (count: number) => 
      locale === 'ar' 
        ? `تم العثور على ${count} مكان سياحي` 
        : `Found ${count} tourism place${count !== 1 ? 's' : ''}`
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

  return (
    <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{text.title}</h1>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <GovernateFilter 
          selectedGovernateId={selectedGovernateId}
          onGovernateChange={setSelectedGovernateId}
        />
      </div>

      {/* Results */}
      {places.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {text.resultsCount(places.length)}
        </div>
      )}

      {/* Places List - Single Column */}
      {places.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p className="text-lg">{text.noResults}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}