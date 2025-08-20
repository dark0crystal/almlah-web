"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { MapPin, List, X } from "lucide-react";
import PlacesCardsWrapper from "./PlacesCardsWrapper";
import PlacesMap from "./PlacesMap";
import GovernateFilter from "./GovernateFilterComponent";
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
  
  // State to control mobile view toggle between map and places list
  const [showPlacesList, setShowPlacesList] = useState(false);
  
  // State for sharing filters between components
  const [selectedGovernateId, setSelectedGovernateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Get category ID from the category type
  const categoryId = CATEGORY_IDS[categoryType];

  const getToggleButtonText = () => {
    return t('placesList');
  };

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
      
      {/* Mobile Layout - Map with overlay cards at bottom */}
      <div className="md:hidden w-full h-screen relative">
        {/* Full screen map for mobile */}
        <div className="w-full h-full">
          <PlacesMap 
            categoryId={categoryId}
            selectedGovernateId={selectedGovernateId}
            searchQuery={searchQuery}
            onMarkerClick={setSelectedPlaceId}
            selectedPlaceId={selectedPlaceId}
          />
        </div>
        
        {/* Mobile toggle button - floating */}
        <button
          onClick={() => setShowPlacesList(!showPlacesList)}
          className={`absolute top-4 z-50 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 ${
            locale === 'ar' ? 'left-4' : 'right-4'
          }`}
          aria-label={getToggleButtonText()}
        >
          <List className="w-6 h-6 text-gray-700" />
        </button>
        
        {/* Mobile places cards overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-40 max-h-60">
          <PlacesCardsWrapper 
            isMobileMapView={true}
            categoryId={categoryId}
            selectedGovernateId={selectedGovernateId}
            onGovernateChange={setSelectedGovernateId}
            selectedPlaceId={selectedPlaceId}
            onPlaceClick={setSelectedPlaceId}
          />
        </div>

        {/* Mobile places list full overlay */}
        {showPlacesList && (
          <div className="absolute inset-0 z-50">
            {/* Header with close button */}
            <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${
              locale === 'ar' ? 'flex-row-reverse' : ''
            }`}>
              <h2 className="text-xl font-bold text-gray-800">
                {getPlacesToVisitText()}
              </h2>
              <button
                onClick={() => setShowPlacesList(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={t('close')}
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            {/* Places content with padding */}
            <div className="h-full overflow-y-auto pb-20">
              <div className="px-5 py-4">
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
          </div>
        )}
      </div>

      {/* -------------------------------------- */}
      {/* Desktop Layout - Cards and Map both 80vh */}
      <div className="hidden large:flex gap-4 px-5 xl:px-25">
        {/* Places List Section - 80vh with scroll */}
        <div className="w-3/5 rounded-lg shadow-sm">
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
        <div className="w-2/5 rounded-lg shadow-sm">
          <div className="h-[80vh] p-4">
            <PlacesMap 
              categoryId={categoryId}
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
              onMarkerClick={setSelectedPlaceId}
              selectedPlaceId={selectedPlaceId}
            />
          </div>
        </div>
      </div>
      
      {/* -------------------------------------- */}
      {/* Tablet Layout - Cards and Map both 80vh */}
      <div className="hidden md:flex large:hidden w-full flex-col gap-4 px-5 xl:px-25">
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
              onMarkerClick={setSelectedPlaceId}
              selectedPlaceId={selectedPlaceId}
            />
          </div>
        </div>
      </div>

      
    </div>
  );
}