"use client"
import { useState, useEffect, useRef } from "react";
import { ChevronUp, X, Map } from "lucide-react";
import RestaurantsCardsWrapper from "./RestaurantsCardsWrapper";

interface RestaurantBottomSheetProps {
  categoryId: string;
  selectedGovernateId?: string | null;
  onGovernateChange?: (governateId: string | null) => void;
  selectedRestaurantId?: string | null;
  onRestaurantClick?: (restaurantId: string) => void;
  locale?: string;
  title?: string;
  onStateChange?: (state: SheetState) => void;
  forceState?: SheetState; // Allow parent to control state
}

export type SheetState = 'hidden' | 'collapsed' | 'half' | 'full';

export default function RestaurantBottomSheet({
  categoryId,
  selectedGovernateId,
  onGovernateChange,
  selectedRestaurantId,
  onRestaurantClick,
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

  // Sheet height configurations
  const getSheetHeight = () => {
    switch (sheetState) {
      case 'hidden':
        return 'translate-y-full';
      case 'collapsed':
        return 'translate-y-[calc(100%-180px)]'; // Show ~180px
      case 'half':
        return 'translate-y-[50%]'; // Show 50% of screen
      case 'full':
        return 'translate-y-[120px]'; // Show full with top margin
      default:
        return 'translate-y-[calc(100%-180px)]';
    }
  };

  const getSheetOpacity = () => {
    return sheetState === 'hidden' ? 'opacity-0' : 'opacity-100';
  };

  // Handle touch/mouse events for dragging
  const handleStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setCurrentY(clientY);
  };

  const handleMove = (clientY: number) => {
    if (!isDragging) return;
    
    setCurrentY(clientY);
    const deltaY = clientY - startY;
    
    // Optional: Add visual feedback during drag
    if (sheetRef.current) {
      const currentTransform = getSheetHeight();
      // You could add smooth dragging animation here if needed
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 50; // Minimum drag distance to trigger state change
    
    // Determine new state based on drag direction and current state
    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Dragging down
        switch (sheetState) {
          case 'full':
            setSheetState('half');
            break;
          case 'half':
            setSheetState('collapsed');
            break;
          case 'collapsed':
            setSheetState('hidden');
            break;
        }
      } else {
        // Dragging up
        switch (sheetState) {
          case 'hidden':
            setSheetState('collapsed');
            break;
          case 'collapsed':
            setSheetState('half');
            break;
          case 'half':
            setSheetState('full');
            break;
        }
      }
    }
    
    setIsDragging(false);
    setIsMouseDragging(false);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMouseDragging(true);
    handleStart(e.clientY);
    
    // Add global mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDragging) {
        handleMove(e.clientY);
      }
    };
    
    const handleMouseUp = () => {
      handleEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && (sheetState === 'half' || sheetState === 'full')) {
      setSheetState('collapsed');
    }
  };

  // Handle header drag area click for quick state toggle
  const handleHeaderClick = () => {
    switch (sheetState) {
      case 'collapsed':
        setSheetState('half');
        break;
      case 'half':
        setSheetState('full');
        break;
      case 'full':
        setSheetState('collapsed');
        break;
      default:
        setSheetState('collapsed');
    }
  };

  const handleClose = () => {
    setSheetState('hidden');
  };

  const handleMapToggle = () => {
    setSheetState(sheetState === 'hidden' ? 'collapsed' : 'hidden');
  };

  return (
    <>
      {/* Backdrop */}
      {(sheetState === 'half' || sheetState === 'full') && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleBackdropClick}
        />
      )}

      {/* Map toggle button when sheet is hidden */}
      {sheetState === 'hidden' && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={handleMapToggle}
            className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 flex items-center gap-2"
          >
            <Map className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-700 pr-1">
              {title}
            </span>
          </button>
        </div>
      )}

      {/* Bottom Sheet */}
      <div 
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-out ${getSheetHeight()} ${getSheetOpacity()}`}
        style={{ height: 'calc(100vh - 60px)' }}
      >
        {/* Sheet Container */}
        <div className="bg-white rounded-t-3xl shadow-2xl h-full flex flex-col overflow-hidden">
          {/* Drag Handle and Header */}
          <div 
            className="flex-shrink-0 bg-white rounded-t-3xl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div 
              className={`flex items-center justify-between px-6 py-3 cursor-pointer ${
                locale === 'ar' ? 'flex-row-reverse' : ''
              }`}
              onClick={handleHeaderClick}
            >
              <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <ChevronUp className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                  sheetState === 'full' ? 'rotate-180' : ''
                }`} />
              </div>
              
              {sheetState === 'full' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <div className="h-full px-4 py-2">
              <RestaurantsCardsWrapper 
                isMobileMapView={sheetState === 'collapsed'}
                categoryId={categoryId}
                selectedGovernateId={selectedGovernateId}
                onGovernateChange={onGovernateChange}
                selectedRestaurantId={selectedRestaurantId}
                onRestaurantClick={onRestaurantClick}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}