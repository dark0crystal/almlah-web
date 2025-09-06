"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
// import { MapPin } from "lucide-react";
import PlacesCardsWrapper from "./PlacesCardsWrapper";
import PlacesMap from "./PlacesMap";
import BottomSheet, { SheetState } from "./BottomSheet";
import { CATEGORY_IDS, type CategoryType } from "@/services/placesApi";

/**
 * Main Places component that renders the tourism places discovery page
 * Features responsive layout with full-screen map on mobile and split view on desktop
 * Now includes governate filtering, proper localization, and category support
 */
export default function Places() {
  const categoryType: CategoryType = "TOURISM"; // Default category type
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('places');
  const categoryTranslations = useTranslations('categories');
  
  
  // State for sharing filters between components
  const [selectedGovernateId, setSelectedGovernateId] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery] = useState<string>("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [bottomSheetState, setBottomSheetState] = useState<SheetState>('collapsed');
  const [forceBottomSheetState, setForceBottomSheetState] = useState<SheetState | undefined>(undefined);
  

  // Reset force state after it's been applied
  const handleBottomSheetStateChange = (state: SheetState) => {
    setBottomSheetState(state);
    if (forceBottomSheetState) {
      setForceBottomSheetState(undefined);
    }
  };


  // Handle marker click - use bottom sheet for screens < md, and just highlight for md+
  const handleMarkerClick = (placeId: string) => {
    setSelectedPlaceId(placeId);
    
    const screenWidth = window.innerWidth;
    
    // Small and medium screens (< 768px) - use bottom sheet
    if (screenWidth < 768) {
      // If sheet is hidden, bring it to half state for better visibility
      if (bottomSheetState === 'hidden') {
        setForceBottomSheetState('half');
      }
      // If sheet is collapsed, expand to half
      else if (bottomSheetState === 'collapsed') {
        setForceBottomSheetState('half');
      }
      // If sheet is half or full, keep current state but update selected place
    }
    // Large screens (md+) - just update selected place, no sheet/modal needed
  };

  // Get category ID from the category type
  const categoryId = CATEGORY_IDS[categoryType];


  const getPlacesToVisitText = () => {
    switch (categoryType) {
      case 'TOURISM':
        return categoryTranslations('tourism'); // "Tourism Places"
      case 'FOOD_BEVERAGES':
        return categoryTranslations('foodBeverages'); // "Food & Beverages" 
      case 'ENTERTAINMENT':
        return categoryTranslations('entertainment'); // "Entertainment"
      default:
        return t('title'); // "Places to Visit"
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
      
      
      {/* Mobile/SM Layout - Full screen map with bottom sheet */}
      <div className="md:hidden w-full h-[92vh] relative">
        {/* Full screen map for mobile and sm screens */}
        <div className="w-full h-full">
          <PlacesMap 
            categoryId={categoryId}
            selectedGovernateId={selectedGovernateId}
            searchQuery={searchQuery}
            onMarkerClick={handleMarkerClick}
            selectedPlaceId={selectedPlaceId}
          />
        </div>
        
        {/* Airbnb-style Bottom Sheet for all mobile and sm screens */}
        <BottomSheet
          categoryId={categoryId}
          selectedGovernateId={selectedGovernateId}
          onGovernateChange={setSelectedGovernateId}
          selectedCategoryIds={selectedCategoryIds}
          onCategoryIdsChange={setSelectedCategoryIds}
          selectedPlaceId={selectedPlaceId}
          onPlaceClick={setSelectedPlaceId}
          locale={locale}
          title={getPlacesToVisitText()}
          onStateChange={handleBottomSheetStateChange}
          forceState={forceBottomSheetState}
        />
      </div>

      {/* -------------------------------------- */}
      {/* Desktop Layout - Cards and Map side by side (md+) */}
      <div className="hidden md:flex gap-4 px-5 xl:px-25">
        {/* Places List Section - 80vh with scroll */}
        <div className="w-1/2 rounded-lg">
          <div className="h-[92vh] p-4">
            <PlacesCardsWrapper 
              isMobileMapView={false}
              categoryId={categoryId}
              selectedGovernateId={selectedGovernateId}
              onGovernateChange={setSelectedGovernateId}
              selectedCategoryIds={selectedCategoryIds}
              onCategoryIdsChange={setSelectedCategoryIds}
              selectedPlaceId={selectedPlaceId}
              onPlaceClick={setSelectedPlaceId}
            />
          </div>
        </div>
        
        {/* Map Section - 80vh */}
        <div className="w-1/2 rounded-lg">
          <div className="h-[92vh] p-4">
            <PlacesMap 
              categoryId={categoryId}
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
              onMarkerClick={handleMarkerClick}
              selectedPlaceId={selectedPlaceId}
            />
          </div>
        </div>
      </div>
      
      {/* -------------------------------------- */}
      {/* Tablet Layout - Cards and Map both 80vh - REMOVED */}
      <div className="hidden w-full flex-col gap-4 px-5 xl:px-25">
        {/* Places list - 80vh with scroll */}
        <div className="w-full rounded-lg">
          <div className="h-[92vh] p-4">
            <PlacesCardsWrapper 
              isMobileMapView={false}
              categoryId={categoryId}
              selectedGovernateId={selectedGovernateId}
              onGovernateChange={setSelectedGovernateId}
              selectedCategoryIds={selectedCategoryIds}
              onCategoryIdsChange={setSelectedCategoryIds}
              selectedPlaceId={selectedPlaceId}
              onPlaceClick={setSelectedPlaceId}
            />
          </div>
        </div>
        
        {/* Map - 80vh */}
        <div className="w-full rounded-lg">
          <div className="h-[92vh] p-4">
            <PlacesMap 
              categoryId={categoryId}
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
              onMarkerClick={handleMarkerClick}
              selectedPlaceId={selectedPlaceId}
            />
          </div>
        </div>
      </div>

      
    </div>
  );
}