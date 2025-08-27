"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { MapPin } from "lucide-react";
import RestaurantsCardsWrapper from "./RestaurantsCardsWrapper";
import RestaurantsMap from "./RestaurantsMap";
import RestaurantGovernateFilter from "./RestaurantsGovernatesFilter";
import RestaurantBottomSheet, { SheetState } from "./RestaurantBottomSheet";
import { CATEGORY_IDS, type CategoryType, getCategoryName } from "@/services/placesApi";

interface RestaurantsProps {
  categoryType?: CategoryType; // Optional category type prop
}

/**
 * Main Restaurants component that renders the restaurants discovery page
 * Features responsive layout with full-screen map on mobile and split view on desktop
 * Now uses the scalable category system with the restaurant category ID
 */
export default function Restaurants({ categoryType = "FOOD_BEVERAGES" }: RestaurantsProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('places');
  
  // State for sharing filters between components
  const [selectedGovernateId, setSelectedGovernateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [bottomSheetState, setBottomSheetState] = useState<SheetState>('collapsed');
  const [forceBottomSheetState, setForceBottomSheetState] = useState<SheetState | undefined>(undefined);

  // Reset force state after it's been applied
  const handleBottomSheetStateChange = (state: SheetState) => {
    setBottomSheetState(state);
    if (forceBottomSheetState) {
      setForceBottomSheetState(undefined);
    }
  };

  // Handle marker click - show and expand bottom sheet (for screens < 1280px only)
  const handleMarkerClick = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    
    // Only handle bottom sheet expansion for screens < 1280px
    // For xl screens (desktop), just update selected restaurant
    if (window.innerWidth < 1280) {
      // If sheet is hidden, bring it to half state for better visibility
      if (bottomSheetState === 'hidden') {
        setForceBottomSheetState('half');
      }
      // If sheet is collapsed, expand to half
      else if (bottomSheetState === 'collapsed') {
        setForceBottomSheetState('half');
      }
      // If sheet is half or full, keep current state but update selected restaurant
    }
  };

  // Get category ID from the category type
  const categoryId = CATEGORY_IDS[categoryType];

  const getRestaurantsText = () => {
    switch (categoryType) {
      case 'FOOD_BEVERAGES':
        return t('foodBeverages');
      case 'ENTERTAINMENT':
        return t('entertainment');
      case 'TOURISM':
        return t('tourism');
      default:
        return t('foodBeverages');
    }
  };

  // If no valid category ID, show error
  if (!categoryId) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            {t('errors.invalidCategory')}
          </h1>
          <p className="text-gray-600">
            {t('errors.categoryNotExist')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full relative ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* Header Section - Title and Filter */}
      <div className="border-b border-gray-200 px-5 xl:px-25 py-4">
        <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          {/* Title on the right (or left in RTL) */}
          <h1 className="text-3xl font-bold text-gray-800">{getRestaurantsText()}</h1>
          
          {/* Filter on the left (or right in RTL) */}
          <div className="w-64">
            <RestaurantGovernateFilter 
              selectedGovernateId={selectedGovernateId}
              onGovernateChange={setSelectedGovernateId}
              locale={locale}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile/Tablet Layout - Full screen map with Airbnb-style bottom sheet */}
      <div className="xl:hidden w-full h-[84vh] relative">
        {/* Full screen map for mobile */}
        <div className="w-full h-full">
          <RestaurantsMap 
            categoryId={categoryId}
            selectedGovernateId={selectedGovernateId}
            searchQuery={searchQuery}
            onMarkerClick={handleMarkerClick}
            selectedRestaurantId={selectedRestaurantId}
          />
        </div>
        
        {/* Airbnb-style Bottom Sheet */}
        <RestaurantBottomSheet
          categoryId={categoryId}
          selectedGovernateId={selectedGovernateId}
          onGovernateChange={setSelectedGovernateId}
          selectedRestaurantId={selectedRestaurantId}
          onRestaurantClick={setSelectedRestaurantId}
          locale={locale}
          title={getRestaurantsText()}
          onStateChange={handleBottomSheetStateChange}
          forceState={forceBottomSheetState}
        />
      </div>

      {/* -------------------------------------- */}
      {/* Desktop Layout - Cards and Map side by side (1280px+) */}
      <div className="hidden xl:flex gap-4 px-5 xl:px-25">
        {/* Restaurants List Section - 80vh with scroll */}
        <div className="w-1/2 rounded-lg">
          <div className="h-[80vh] p-4">
            <RestaurantsCardsWrapper 
              isMobileMapView={false}
              categoryId={categoryId}
              selectedGovernateId={selectedGovernateId}
              onGovernateChange={setSelectedGovernateId}
              selectedRestaurantId={selectedRestaurantId}
              onRestaurantClick={setSelectedRestaurantId}
            />
          </div>
        </div>
        
        {/* Map Section - 80vh */}
        <div className="w-1/2 rounded-lg">
          <div className="h-[80vh] p-4">
            <RestaurantsMap 
              categoryId={categoryId}
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
              onMarkerClick={handleMarkerClick}
              selectedRestaurantId={selectedRestaurantId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}