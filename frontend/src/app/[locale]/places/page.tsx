"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { MapPin } from "lucide-react";
import PlacesCardsWrapper from "./PlacesCardsWrapper";
import PlacesMap from "./PlacesMap";
import PlacesModal from "./PlacesModal";
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
  const categoryTranslations = useTranslations('categories');
  
  
  // State for sharing filters between components
  const [selectedGovernateId, setSelectedGovernateId] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [bottomSheetState, setBottomSheetState] = useState<SheetState>('collapsed');
  const [forceBottomSheetState, setForceBottomSheetState] = useState<SheetState | undefined>(undefined);
  
  // Modal state for small screens
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalExpanded, setIsModalExpanded] = useState(false);

  // Reset force state after it's been applied
  const handleBottomSheetStateChange = (state: SheetState) => {
    setBottomSheetState(state);
    if (forceBottomSheetState) {
      setForceBottomSheetState(undefined);
    }
  };

  // Handle modal toggle for small screens
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setIsModalExpanded(false); // Start collapsed when opening
    }
  };

  // Handle modal expand/collapse
  const handleModalToggleExpand = () => {
    setIsModalExpanded(!isModalExpanded);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsModalExpanded(false);
  };

  // Handle marker click - show modal for screens < md, bottom sheet for md < screens < xl, and just highlight for xl+
  const handleMarkerClick = (placeId: string) => {
    setSelectedPlaceId(placeId);
    
    const screenWidth = window.innerWidth;
    
    // Small screens (< 768px) - show modal
    if (screenWidth < 768) {
      setIsModalOpen(true);
    }
    // Medium screens (768px - 1279px) - use bottom sheet
    else if (screenWidth >= 768 && screenWidth < 1280) {
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
    // Large screens (xl+) - just update selected place, no sheet/modal needed
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
      
      
      {/* Mobile/Tablet Layout - Full screen map with modal for small screens and bottom sheet for medium screens */}
      <div className="md:hidden w-full h-[92vh] relative">
        {/* Full screen map for mobile and tablet */}
        <div className="w-full h-full">
          <PlacesMap 
            categoryId={categoryId}
            selectedGovernateId={selectedGovernateId}
            searchQuery={searchQuery}
            onMarkerClick={handleMarkerClick}
            selectedPlaceId={selectedPlaceId}
          />
        </div>
        
        {/* Floating Places Button - Only show on small screens (< sm) */}
        <div className="sm:hidden absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={handleModalToggle}
            className="bg-white hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 border border-gray-200"
          >
            <MapPin className="w-5 h-5" />
            <span className="font-medium">{t('viewPlaces')}</span>
          </button>
        </div>

        {/* Airbnb-style Bottom Sheet - Only show on medium screens (md and up but below xl) */}
        <div className="hidden md:block xl:hidden">
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
      </div>

      {/* -------------------------------------- */}
      {/* Desktop Layout - Cards and Map side by side (1280px+) */}
      <div className="hidden xl:flex gap-4 px-5 xl:px-25">
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

      {/* Places Modal - Only show on small screens (< md) */}
      {isModalOpen && (
        <div className="md:hidden">
          <PlacesModal
            isExpanded={isModalExpanded}
            onToggleExpand={handleModalToggleExpand}
            categoryType={categoryType}
            selectedGovernateId={selectedGovernateId}
            onClose={handleModalClose}
          />
        </div>
      )}
      
    </div>
  );
}