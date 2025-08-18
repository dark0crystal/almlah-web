"use client"
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RestaurantCard from "./RestaurantCard";
import { fetchPlaces } from "@/services/placesApi"; // Using the scalable placesApi
import { Place } from "@/types"; // Using Place type instead of Restaurant

interface RestaurantsCardsWrapperProps {
  isMobileMapView?: boolean;
  selectedGovernateId?: string | null;
  onGovernateChange?: (governateId: string | null) => void;
  categoryId: string; // Required category ID prop (replaces restaurantCategoryId)
}

export default function RestaurantsCardsWrapper({
  isMobileMapView = false,
  selectedGovernateId,
  onGovernateChange,
  categoryId
}: RestaurantsCardsWrapperProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [restaurants, setRestaurants] = useState<Place[]>([]); // Using Place type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Localized text
  const text = {
    loading: locale === 'ar' ? 'جاري تحميل المطاعم...' : 'Loading restaurants...',
    error: locale === 'ar' ? 'خطأ' : 'Error',
    tryAgain: locale === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
    title: locale === 'ar' ? 'المطاعم' : 'Restaurants',
    noResults: locale === 'ar' ? 'لم يتم العثور على مطاعم' : 'No restaurants found',
  };

  // Fetch restaurants when governate or category changes
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading restaurants with categoryId:', categoryId, 'governateId:', selectedGovernateId);
        
        // Use the updated fetchPlaces function with category ID and governate ID
        const data = await fetchPlaces(categoryId, selectedGovernateId);
        
        console.log('Restaurants loaded:', data);
        setRestaurants(data);
      } catch (err: any) {
        console.error('Error loading restaurants:', err);
        setError(err.message || text.error);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    // Only load if we have a valid categoryId
    if (categoryId) {
      loadRestaurants();
    }
  }, [selectedGovernateId, categoryId, text.error]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
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
          className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
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
        {restaurants.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-base">{text.noResults}</p>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="flex-shrink-0 w-80">
                  <RestaurantCard restaurant={restaurant} />
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
      {restaurants.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg">{text.noResults}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 pr-2">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}