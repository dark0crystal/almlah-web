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
  const scrollableRef = useRef<HTMLDivElement>(null);
  
  // Drag functionality state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(0);
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

  // Initialize height based on expansion state
  useEffect(() => {
    if (modalRef.current) {
      const windowHeight = window.innerHeight;
      const targetHeight = isExpanded ? windowHeight * 5/6 : windowHeight * 2/3;
      setCurrentHeight(targetHeight);
    }
  }, [isExpanded]);

  // Drag handlers
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    setDragStart(clientY);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging || !modalRef.current) return;

    const windowHeight = window.innerHeight;
    const dragDelta = dragStart - clientY; // Positive when dragging up
    const minHeight = windowHeight * 0.3; // 30% minimum
    const maxHeight = windowHeight * 0.9; // 90% maximum
    
    let newHeight = currentHeight + dragDelta;
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    
    modalRef.current.style.height = `${newHeight}px`;
    modalRef.current.style.transition = 'none'; // Disable transition during drag
  }, [isDragging, dragStart, currentHeight]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || !modalRef.current) return;

    setIsDragging(false);
    const windowHeight = window.innerHeight;
    const currentModalHeight = modalRef.current.getBoundingClientRect().height;
    
    // Snap points
    const snapPoints = [
      windowHeight * 0.3,  // Collapsed
      windowHeight * 2/3,  // Medium (original collapsed)
      windowHeight * 5/6   // Expanded
    ];
    
    // Find closest snap point
    let closestSnap = snapPoints[0];
    let minDistance = Math.abs(currentModalHeight - snapPoints[0]);
    
    snapPoints.forEach(snap => {
      const distance = Math.abs(currentModalHeight - snap);
      if (distance < minDistance) {
        minDistance = distance;
        closestSnap = snap;
      }
    });
    
    // Update states based on snap point
    const newIsExpanded = closestSnap >= windowHeight * 5/6;
    if (newIsExpanded !== isExpanded) {
      onToggleExpand();
    }
    
    // Re-enable transition and snap to final position
    modalRef.current.style.transition = 'height 0.3s ease-out';
    modalRef.current.style.height = `${closestSnap}px`;
    setCurrentHeight(closestSnap);
    
    // Reset transition after animation
    setTimeout(() => {
      if (modalRef.current) {
        modalRef.current.style.transition = '';
      }
    }, 300);
  }, [isDragging, isExpanded, onToggleExpand]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientY);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Prevent scroll event bubbling
  const handleScrollableWheel = useCallback((e: React.WheelEvent) => {
    const scrollable = scrollableRef.current;
    if (!scrollable) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollable;
    const isScrollingUp = e.deltaY < 0;
    const isScrollingDown = e.deltaY > 0;

    // If scrolling up and already at top, prevent default to stop propagation
    if (isScrollingUp && scrollTop <= 0) {
      e.preventDefault();
      return;
    }

    // If scrolling down and already at bottom, prevent default to stop propagation
    if (isScrollingDown && scrollTop + clientHeight >= scrollHeight) {
      e.preventDefault();
      return;
    }

    // Allow normal scrolling within the modal
    e.stopPropagation();
  }, []);

  // Prevent touch scroll propagation
  const handleScrollableTouch = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    // Store original body overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Cleanup: restore original overflow when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      {/* Semi-transparent backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />
      
      {/* Main modal container with dynamic height based on expansion state */}
      <div 
        ref={modalRef}
        className={`relative bg-white rounded-t-3xl shadow-2xl w-full max-w-4xl transition-all duration-500 ease-out transform ${
          isExpanded ? 'h-5/6' : 'h-2/3'
        } ${isDragging ? 'select-none' : ''}`}
      >

        {/* Drag handle */}
        <div 
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Modal header with title and control buttons */}
        <div className={`flex items-center justify-between px-6 pb-6 pt-2 border-b border-gray-100 ${
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
        <div 
          ref={scrollableRef}
          className="flex-1 overflow-y-auto p-6"
          onWheel={handleScrollableWheel}
          onTouchMove={handleScrollableTouch}
          onTouchStart={handleScrollableTouch}
        >
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