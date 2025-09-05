"use client"
import { useState, useEffect } from "react";
import { MapPin, ChevronDown, ChevronUp, X, Search, SlidersHorizontal } from "lucide-react";
import { useParams } from "next/navigation";
import PlaceCard from "./PlaceCard";
import { fetchPlaces, CATEGORY_IDS, type CategoryType } from "@/services/placesApi";
import { Place } from "@/types";

// Interface defining props for the PlacesModal component
interface PlacesModalProps {
  isExpanded: boolean;       // Controls modal height (collapsed vs expanded)
  onToggleExpand: () => void; // Callback to toggle expansion state
  categoryType?: CategoryType; // Category type to filter places
  selectedGovernateId?: string | null; // Optional governate filter
  onClose?: () => void; // Optional close callback
}

/**
 * Modal component that displays place cards in a vertically expandable container
 * Can be collapsed (2/3 height) or expanded (5/6 height) for better content viewing
 * Now uses real data from the API instead of static data
 */
export default function PlacesModal({
  isExpanded, 
  onToggleExpand, 
  categoryType = "TOURISM",
  selectedGovernateId = null,
  onClose
}: PlacesModalProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get category ID from the category type
  const categoryId = CATEGORY_IDS[categoryType];

  // Localized text
  const text = {
    loading: locale === 'ar' ? 'جاري تحميل الأماكن...' : 'Loading places...',
    error: locale === 'ar' ? 'خطأ في تحميل الأماكن' : 'Error loading places',
    tryAgain: locale === 'ar' ? 'حاول مرة أخرى' : 'Try Again',
    noPlaces: locale === 'ar' ? 'لم يتم العثور على أماكن' : 'No places found',
    close: locale === 'ar' ? 'إغلاق' : 'Close'
  };

  // Load places data
  useEffect(() => {
    const loadPlaces = async () => {
      if (!categoryId) {
        setError('Invalid category');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading places for modal with categoryId:', categoryId, 'governateId:', selectedGovernateId);
        
        const data = await fetchPlaces(categoryId, selectedGovernateId);
        
        // Limit to first 8 places for modal display
        const limitedPlaces = data.slice(0, 8);
        
        console.log('Places loaded for modal:', limitedPlaces);
        setPlaces(limitedPlaces);
      } catch (err: unknown) {
        console.error('Error loading places for modal:', err);
        const errorMessage = err instanceof Error ? err.message : text.error;
        setError(errorMessage);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [categoryId, selectedGovernateId, text.error]);


  return (
    <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
      {/* Semi-transparent backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Main modal container with dynamic height based on expansion state */}
      <div className={`relative bg-white w-full transition-all duration-500 ease-out transform flex flex-col ${
        isExpanded 
          ? 'h-[90vh] rounded-t-2xl' 
          : 'h-[70vh] rounded-t-3xl'
      }`}>
        {/* Drag handle */}
        <div className="w-full flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        {/* Modal header with search and filters */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {categoryType === 'TOURISM' 
                  ? (locale === 'ar' ? 'الأماكن السياحية' : 'Places to visit') 
                  : (locale === 'ar' ? 'المطاعم والمقاهي' : 'Restaurants & Cafes')
                }
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {places.length} {locale === 'ar' ? 'مكان' : 'places'}
              </p>
            </div>
            
            <div className={`flex items-center space-x-2 ${locale === 'ar' ? 'space-x-reverse' : ''}`}>
              {/* Expand/collapse toggle button */}
              <button
                onClick={onToggleExpand}
                className="p-2.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
                aria-label={isExpanded ? (locale === 'ar' ? 'تصغير' : 'Collapse') : (locale === 'ar' ? 'توسيع' : 'Expand')}
              >
                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-700" /> : <ChevronUp className="w-5 h-5 text-gray-700" />}
              </button>
              
              {/* Close button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
                  aria-label={text.close}
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              )}
            </div>
          </div>
          
          {/* Search and filter bar */}
          <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={locale === 'ar' ? 'البحث عن الأماكن...' : 'Search places...'}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <button className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <SlidersHorizontal className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Scrollable content area containing place cards */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin">
          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
                <div className="text-lg text-gray-600">{text.loading}</div>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">{text.error}</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all duration-200 hover:scale-105"
                >
                  {text.tryAgain}
                </button>
              </div>
            </div>
          ) : places.length === 0 ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center text-gray-500">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <div className="text-lg">{text.noPlaces}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {places.map((place, index) => (
                <div 
                  key={place.id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PlaceCard 
                    key={place.id} 
                    place={place} 
                    locale={locale}
                    isHorizontalScroll={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}