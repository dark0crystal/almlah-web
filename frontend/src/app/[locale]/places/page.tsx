"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { MapPin } from "lucide-react";
import PlacesCardsWrapper from "./PlacesCardsWrapper";
import PlacesMap from "./PlacesMap";
import GovernateFilter from "./GovernateFilterComponent";
import BottomSheet, { SheetState } from "./BottomSheet";
import { CATEGORY_IDS, type CategoryType, getCategoryName } from "@/services/placesApi";

interface PlacesProps {
  categoryType?: CategoryType; // NEW: Optional category type prop
}

/**
 * Main Places component that renders the tourism places discovery page
 * Features responsive layout with full-screen map on mobile and split view on desktop
 * Now includes governate filtering, proper localization, and category support
 */
export default function Places({ categoryType = "TOURISM" }: PlacesProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('places');
  
  
  // State for sharing filters between components
  const [selectedGovernateId, setSelectedGovernateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  // Handle marker click - show and expand bottom sheet (for screens < 1280px only)
  const handleMarkerClick = (placeId: string) => {
    setSelectedPlaceId(placeId);
    
    // Only handle bottom sheet expansion for screens < 1280px
    // For xl screens (desktop), just update selected place
    if (window.innerWidth < 1280) {
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
  };

  // Get category ID from the category type
  const categoryId = CATEGORY_IDS[categoryType];


  const getPlacesToVisitText = () => {
    switch (categoryType) {
      case 'TOURISM':
        return t('tourism');
      case 'FOOD_BEVERAGES':
        return t('foodBeverages');
      case 'ENTERTAINMENT':
        return t('entertainment');
      default:
        return t('placesToVisit');
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
          <h1 className="text-3xl font-bold text-gray-800">{getPlacesToVisitText()}</h1>
          
          {/* Filter on the left (or right in RTL) */}
          <div className="w-64">
            <GovernateFilter 
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
          <PlacesMap 
            categoryId={categoryId}
            selectedGovernateId={selectedGovernateId}
            searchQuery={searchQuery}
            onMarkerClick={handleMarkerClick}
            selectedPlaceId={selectedPlaceId}
          />
        </div>
        

        {/* Airbnb-style Bottom Sheet */}
        <BottomSheet
          categoryId={categoryId}
          selectedGovernateId={selectedGovernateId}
          onGovernateChange={setSelectedGovernateId}
          selectedPlaceId={selectedPlaceId}
          onPlaceClick={setSelectedPlaceId}
          locale={locale}
          title={getPlacesToVisitText()}
          onStateChange={handleBottomSheetStateChange}
          forceState={forceBottomSheetState}
        />
      </div>

      {/* -------------------------------------- */}
      {/* Desktop Layout - Cards and Map side by side (1280px+) */}
      <div className="hidden xl:flex gap-4 px-5 xl:px-25">
        {/* Places List Section - 80vh with scroll */}
        <div className="w-1/2 rounded-lg shadow-sm">
          <div className="h-[80vh] p-4">
            <PlacesCardsWrapper 
              isMobileMapView={false}
              categoryId={categoryId}
              selectedGovernateId={selectedGovernateId}
              onGovernateChange={setSelectedGovernateId}
              selectedPlaceId={selectedPlaceId}
              onPlaceClick={setSelectedPlaceId}
            />
          </div>
        </div>
        
        {/* Map Section - 80vh */}
        <div className="w-1/2 rounded-lg shadow-sm">
          <div className="h-[80vh] p-4">
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
        <div className="w-full rounded-lg shadow-sm">
          <div className="h-[80vh] p-4">
            <PlacesCardsWrapper 
              isMobileMapView={false}
              categoryId={categoryId}
              selectedGovernateId={selectedGovernateId}
              onGovernateChange={setSelectedGovernateId}
              selectedPlaceId={selectedPlaceId}
              onPlaceClick={setSelectedPlaceId}
            />
          </div>
        </div>
        
        {/* Map - 80vh */}
        <div className="w-full rounded-lg shadow-sm">
          <div className="h-[80vh] p-4">
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