"use client"
import { useState, useEffect } from "react";
import { MapPin, Star, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
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
      } catch (err: any) {
        console.error('Error loading places for modal:', err);
        setError(err.message || text.error);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [categoryId, selectedGovernateId, text.error]);


  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      {/* Semi-transparent backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Main modal container with dynamic height based on expansion state */}
      <div className={`relative bg-white rounded-t-3xl shadow-2xl w-full max-w-4xl transition-all duration-500 ease-out transform flex flex-col ${
        isExpanded ? 'h-5/6' : 'h-2/3'
      }`}>
        {/* Modal header with control buttons only */}
        <div className={`flex items-center justify-end p-6 border-b border-gray-100`}>
          <div className={`flex items-center space-x-2 ${locale === 'ar' ? 'space-x-reverse' : ''}`}>
            {/* Expand/collapse toggle button */}
            <button
              onClick={onToggleExpand}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={isExpanded ? (locale === 'ar' ? 'تصغير' : 'Collapse') : (locale === 'ar' ? 'توسيع' : 'Expand')}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
            
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={text.close}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content area containing place cards */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}