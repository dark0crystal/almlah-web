"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, List, X } from "lucide-react";
import PlacesCardsWrapper from "./PlacesCardsWrapper";
import PlacesMap from "./PlacesMap";
import GovernateFilter from "./GovernateFilterComponent";

/**
 * Main Places component that renders the tourism places discovery page
 * Features responsive layout with full-screen map on mobile and split view on desktop
 * Now includes governate filtering and proper localization
 */
export default function Places() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  // State to control mobile view toggle between map and places list
  const [showPlacesList, setShowPlacesList] = useState(false);
  
  // State for sharing filters between components
  const [selectedGovernateId, setSelectedGovernateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getToggleButtonText = () => {
    return locale === 'ar' ? 'قائمة الأماكن' : 'Places List';
  };

  const getPlacesToVisitText = () => {
    return locale === 'ar' ? 'الأماكن السياحية' : 'Places to Visit';
  };

  return (
    <div className={`w-full bg-white relative ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* Header Section - Title and Filter */}
      <div className="bg-white border-b border-gray-200 px-5 xl:px-25 py-4">
        <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          {/* Title on the right (or left in RTL) */}
          <h1 className="text-3xl font-bold text-gray-800">{getPlacesToVisitText()}</h1>
          
          {/* Filter on the left (or right in RTL) */}
          <div className="w-64">
            <GovernateFilter 
              selectedGovernateId={selectedGovernateId}
              onGovernateChange={setSelectedGovernateId}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Layout - Map with overlay cards at bottom */}
      <div className="md:hidden w-full h-screen relative">
        {/* Full screen map for mobile */}
        <div className="w-full h-full">
          <PlacesMap 
            selectedGovernateId={selectedGovernateId}
            searchQuery={searchQuery}
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
            selectedGovernateId={selectedGovernateId}
            onGovernateChange={setSelectedGovernateId}
          />
        </div>

        {/* Mobile places list full overlay */}
        {showPlacesList && (
          <div className="absolute inset-0 z-50 bg-white">
            {/* Header with close button */}
            <div className={`flex items-center justify-between p-4 border-b border-gray-200 bg-white ${
              locale === 'ar' ? 'flex-row-reverse' : ''
            }`}>
              <h2 className="text-xl font-bold text-gray-800">
                {getPlacesToVisitText()}
              </h2>
              <button
                onClick={() => setShowPlacesList(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            {/* Places content with padding */}
            <div className="h-full overflow-y-auto pb-20">
              <div className="px-5 py-4">
                <PlacesCardsWrapper 
                  isMobileMapView={false}
                  selectedGovernateId={selectedGovernateId}
                  onGovernateChange={setSelectedGovernateId}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------- */}
      {/* Desktop Layout - Cards and Map both 80vh */}
      <div className="hidden large:flex">
        {/* Places List Section - 80vh with scroll */}
        <div className="w-3/5 bg-white flex justify-center">
          <div className="w-full max-w-none px-5 xl:px-25 py-6">
            <div className="h-[80vh]">
              <PlacesCardsWrapper 
                isMobileMapView={false}
                selectedGovernateId={selectedGovernateId}
                onGovernateChange={setSelectedGovernateId}
              />
            </div>
          </div>
        </div>
        
        {/* Map Section - 80vh */}
        <div className="w-2/5 bg-white border-l border-gray-200">
          <div className="h-[80vh] p-4">
            <PlacesMap 
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>
      
      {/* -------------------------------------- */}
      {/* Tablet Layout - Cards and Map both 80vh */}
      <div className="hidden md:flex large:hidden w-full flex-col">
        {/* Places list - 80vh with scroll */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-none px-5 xl:px-25 py-6">
            <div className="h-[80vh]">
              <PlacesCardsWrapper 
                isMobileMapView={false}
                selectedGovernateId={selectedGovernateId}
                onGovernateChange={setSelectedGovernateId}
              />
            </div>
          </div>
        </div>
        
        {/* Map - 80vh */}
        <div className="w-full bg-white border-t border-gray-200">
          <div className="h-[80vh] p-4">
            <PlacesMap 
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>

      {/* Footer - Centered with padding */}
      {/* <div className="bg-amber-100 h-[50vh] w-full flex items-center justify-center">
        <div className="px-5 xl:px-25">
          <div className="text-2xl font-bold text-gray-700 text-center">
            {getFooterText()}
          </div>
        </div>
      </div> */}
    </div>
  );
}