//"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronUp, Map } from "lucide-react";
import RestaurantsCardsWrapper from "./RestaurantsCardsWrapper";

interface RestaurantBottomSheetProps {
  categoryId: string;
  selectedGovernateId?: string | null;
  onGovernateChange?: (governateId: string | null) => void;
  selectedCategoryIds?: string[];
  onCategoryIdsChange?: (categoryIds: string[]) => void;
  selectedPlaceId?: string | null;
  onPlaceClick?: (placeId: string) => void;
  locale?: string;
  title?: string;
  onStateChange?: (state: SheetState) => void;
  forceState?: SheetState;
}

export type SheetState = 'hidden' | 'collapsed' | 'half' | 'full';

export default function RestaurantBottomSheet({
  categoryId,
  selectedGovernateId,
  onGovernateChange,
  selectedCategoryIds = [],
  onCategoryIdsChange,
  selectedPlaceId,
  onPlaceClick,
  locale = 'en',
  title = 'Restaurants',
  onStateChange,
  forceState
}: RestaurantBottomSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>('collapsed');

  // Handle forced state changes from parent
  useEffect(() => {
    if (forceState && forceState !== sheetState) {
      setSheetState(forceState);
    }
  }, [forceState, sheetState]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(sheetState);
    }
  }, [sheetState, onStateChange]);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Height configurations for different states
  const getSheetHeight = (state: SheetState) => {
    switch (state) {
      case 'hidden':
        return '80px'; // Just shows header bar to allow reopening
      case 'collapsed':
        return '45vh'; // Shows horizontal scroll cards - increased height for better scrolling
      case 'half':
        return '75vh'; // Increased from 60vh for better visibility
      case 'full':
        return '95vh'; // Increased from 90vh for maximum visibility
      default:
        return '45vh';
    }
  };

  // Get transform based on state and drag
  const getTransform = () => {
    if (isDragging || isMouseDragging) {
      const deltaY = currentY - startY;
      return `translateY(${Math.max(0, deltaY)}px)`;
    }
    return 'translateY(0)';
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 50;

    if (deltaY > threshold) {
      // Swipe down
      if (sheetState === 'full') {
        setSheetState('half');
      } else if (sheetState === 'half') {
        setSheetState('collapsed');
      } else if (sheetState === 'collapsed') {
        setSheetState('hidden');
      }
    } else if (deltaY < -threshold) {
      // Swipe up
      if (sheetState === 'hidden') {
        setSheetState('collapsed');
      } else if (sheetState === 'collapsed') {
        setSheetState('half');
      } else if (sheetState === 'half') {
        setSheetState('full');
      }
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  // Mouse event handlers for desktop dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsMouseDragging(true);
    setStartY(e.clientY);
    setCurrentY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDragging) return;
    setCurrentY(e.clientY);
  };

  const handleMouseUp = useCallback(() => {
    if (!isMouseDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 50;

    if (deltaY > threshold) {
      // Drag down
      if (sheetState === 'full') {
        setSheetState('half');
      } else if (sheetState === 'half') {
        setSheetState('collapsed');
      } else if (sheetState === 'collapsed') {
        setSheetState('hidden');
      }
    } else if (deltaY < -threshold) {
      // Drag up
      if (sheetState === 'hidden') {
        setSheetState('collapsed');
      } else if (sheetState === 'collapsed') {
        setSheetState('half');
      } else if (sheetState === 'half') {
        setSheetState('full');
      }
    }

    setIsMouseDragging(false);
    setStartY(0);
    setCurrentY(0);
  }, [isMouseDragging, currentY, startY, sheetState]);

  // Add global mouse up listener to handle mouse release outside component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDragging) {
        handleMouseUp();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isMouseDragging) {
        setCurrentY(e.clientY);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isMouseDragging, currentY, startY, sheetState, handleMouseUp]);

  // Handle header click to toggle states
  const handleHeaderClick = () => {
    if (sheetState === 'hidden') {
      setSheetState('collapsed');
    } else if (sheetState === 'collapsed') {
      setSheetState('half');
    } else if (sheetState === 'half') {
      setSheetState('full');
    } else {
      setSheetState('half');
    }
  };

  // Handle mouse wheel for desktop users - only on header area
  const handleHeaderWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const threshold = 100;
    
    if (e.deltaY > threshold) {
      // Scroll down
      if (sheetState === 'full') {
        setSheetState('half');
      } else if (sheetState === 'half') {
        setSheetState('collapsed');
      } else if (sheetState === 'collapsed') {
        setSheetState('hidden');
      }
    } else if (e.deltaY < -threshold) {
      // Scroll up
      if (sheetState === 'hidden') {
        setSheetState('collapsed');
      } else if (sheetState === 'collapsed') {
        setSheetState('half');
      } else if (sheetState === 'half') {
        setSheetState('full');
      }
    }
  };

  // Convert undefined to null for selectedGovernateId
  const normalizedSelectedGovernateId = selectedGovernateId === undefined ? null : selectedGovernateId;

  return (
    <div 
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out"
      style={{ 
        height: getSheetHeight(sheetState),
        transform: getTransform()
      }}
    >
      {/* Drag Handle */}
      <div 
        className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleHeaderWheel}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
      </div>

      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 cursor-pointer bg-white"
        onClick={handleHeaderClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleHeaderWheel}
      >
        {/* Title - Right for Arabic, Left for English */}
        <div className={`flex flex-col ${locale === 'ar' ? 'items-end order-2' : 'items-start order-1'}`}>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <div className="text-sm text-gray-500 mt-1">
            {sheetState === 'hidden' && (locale === 'ar' ? 'اضغط لعرض المطاعم' : 'Tap to show restaurants')}
            {sheetState === 'collapsed' && (locale === 'ar' ? 'اضغط أو اسحب للأعلى للمزيد' : 'Tap or swipe up for more')}
            {sheetState === 'half' && (locale === 'ar' ? 'اسحب للأعلى للعرض الكامل' : 'Swipe up for full view')}
            {sheetState === 'full' && (locale === 'ar' ? 'اسحب للأسفل لتصغير' : 'Swipe down to minimize')}
          </div>
        </div>
        
        {/* Buttons - Left for Arabic, Right for English */}
        <div className={`flex items-center space-x-2 ${locale === 'ar' ? 'space-x-reverse order-1' : 'order-2'}`}>
          {/* Go to Map button - only show when not hidden */}
          {sheetState !== 'hidden' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSheetState('hidden');
              }}
              className={`flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-sm font-medium ${locale === 'ar' ? 'space-x-reverse' : ''}`}
              aria-label={locale === 'ar' ? 'عرض الخريطة الكاملة' : 'Show full map'}
            >
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">
                {locale === 'ar' ? 'خريطة' : 'Map'}
              </span>
            </button>
          )}
          
          <ChevronUp 
            className={`w-6 h-6 text-gray-500 transition-transform duration-200 ${
              sheetState === 'full' ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </div>

      {/* Content */}
      {sheetState !== 'hidden' && (
        <div className="bottom-sheet-content">
          {sheetState === 'collapsed' ? (
            // Horizontal scroll view for collapsed state (like Airbnb)
            <div className="bottom-sheet-scrollable">
              <RestaurantsCardsWrapper
                isMobileMapView={true}
                categoryId={categoryId}
                selectedGovernateId={normalizedSelectedGovernateId}
                onGovernateChange={onGovernateChange}
                selectedCategoryIds={selectedCategoryIds}
                onCategoryIdsChange={onCategoryIdsChange}
                selectedPlaceId={selectedPlaceId}
                onPlaceClick={onPlaceClick}
              />
            </div>
          ) : (
            // Vertical grid view for half and full states
            <div className="h-full px-6 pb-6 overflow-hidden">
              <RestaurantsCardsWrapper
                isMobileMapView={false}
                categoryId={categoryId}
                selectedGovernateId={normalizedSelectedGovernateId}
                onGovernateChange={onGovernateChange}
                selectedCategoryIds={selectedCategoryIds}
                onCategoryIdsChange={onCategoryIdsChange}
                selectedPlaceId={selectedPlaceId}
                onPlaceClick={onPlaceClick}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}