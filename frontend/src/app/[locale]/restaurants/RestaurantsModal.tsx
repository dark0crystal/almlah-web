"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import { Utensils, ChevronDown, ChevronUp, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import RestaurantCard from "./RestaurantCard";
import { fetchPlaces, CATEGORY_IDS } from "@/services/placesApi";
import { Place } from "@/types";

// Interface defining props for the RestaurantsModal component
interface RestaurantsModalProps {
  isExpanded: boolean;       // Controls modal height (collapsed vs expanded)
  onToggleExpand: () => void; // Callback to toggle expansion state
  selectedGovernateId?: string | null; // Optional governate filter
  onClose?: () => void; // Optional close callback
}

/**
 * Modal component that displays restaurant cards in a vertically expandable container
 * Can be collapsed (2/3 height) or expanded (5/6 height) for better content viewing
 * Now uses real data from the API instead of static data
 */
export default function RestaurantsModal({
  isExpanded, 
  onToggleExpand, 
  selectedGovernateId = null,
  onClose
}: RestaurantsModalProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('restaurantsModal');
  
  const [restaurants, setRestaurants] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag state management
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get restaurant category ID from the scalable system
  const restaurantCategoryId = CATEGORY_IDS.RESTAURANTS;

  // Load restaurants data
  useEffect(() => {
    const loadRestaurants = async () => {
      if (!restaurantCategoryId) {
        setError(t('invalidCategory'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading restaurants for modal with categoryId:', restaurantCategoryId, 'governateId:', selectedGovernateId);
        
        const data = await fetchPlaces(restaurantCategoryId, selectedGovernateId);
        
        // Limit to first 8 restaurants for modal display
        const limitedRestaurants = data.slice(0, 8);
        
        console.log('Restaurants loaded for modal:', limitedRestaurants);
        setRestaurants(limitedRestaurants);
      } catch (err: any) {
        console.error('Error loading restaurants for modal:', err);
        setError(err.message || t('error'));
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, [restaurantCategoryId, selectedGovernateId, t]);

  // Drag handlers for touch and mouse events
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY);
    setCurrentTranslateY(0);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = clientY - dragStartY;
    const clampedDeltaY = Math.max(0, deltaY); // Only allow dragging down
    setCurrentTranslateY(clampedDeltaY);
  }, [isDragging, dragStartY]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const threshold = 100; // Pixels to trigger state change
    
    if (currentTranslateY > threshold) {
      if (isExpanded) {
        onToggleExpand(); // Collapse if expanded
      } else {
        onClose?.(); // Close if collapsed
      }
    }
    
    setCurrentTranslateY(0);
    setDragStartY(0);
  }, [isDragging, currentTranslateY, isExpanded, onToggleExpand, onClose]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientY);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch event handlers  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      {/* Semi-transparent backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Main modal container with dynamic height based on expansion state */}
      <div 
        ref={modalRef}
        className={`relative bg-white rounded-t-3xl shadow-2xl w-full max-w-4xl transition-all duration-300 ease-out transform select-none ${
          isExpanded ? 'h-5/6 xl:h-5/6' : 'h-2/3 xl:h-2/3'
        } ${isDragging ? 'transition-none' : ''}`}
        style={{
          transform: `translateY(${currentTranslateY}px)`,
        }}
      >
        {/* Drag handle */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"></div>
        </div>

        {/* Modal header with title and control buttons */}
        <div className={`flex items-center justify-between px-6 pb-6 border-b border-gray-100 ${
          locale === 'ar' ? 'flex-row-reverse' : ''
        }`}>
          <div className={`flex items-center space-x-3 ${locale === 'ar' ? 'space-x-reverse' : ''}`}>
            <Utensils className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-800">{t('title')}</h2>
          </div>
          <div className={`flex items-center space-x-2 ${locale === 'ar' ? 'space-x-reverse' : ''}`}>
            {/* Expand/collapse toggle button */}
            <button
              onClick={onToggleExpand}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={isExpanded ? t('collapse') : t('expand')}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
            
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content area containing restaurant cards */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <div className="text-lg text-gray-600">{t('loading')}</div>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">{t('error')}</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {t('tryAgain')}
                </button>
              </div>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center text-gray-500">
                <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <div className="text-lg">{t('noRestaurants')}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}