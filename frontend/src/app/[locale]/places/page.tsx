"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, List, X } from "lucide-react";
import PlacesCardsWrapper from "./PlacesCardsWrapper";
import PlacesMap from "./PlacesMap";

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

  const getFooterText = () => {
    return locale === 'ar' ? 'تذييل الصفحة' : 'Footer';
  };

  return (
    <div className={`w-screen bg-white relative ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* Mobile Layout - Stack vertically, map takes priority */}
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
        
        {/* Mobile places list overlay */}
        {showPlacesList && (
          <div className="absolute inset-0 z-40 bg-white">
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
            
            {/* Places content */}
            <div className="h-full overflow-y-auto pb-20">
              <div className="p-4">
                <PlacesCardsWrapper />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------- */}
      {/* Desktop Layout - Airbnb style: Places cards take 3/5, Map takes 2/5 */}
      <div className="hidden large:flex min-h-screen">
        {/* Places List Section */}
        <div className="w-3/5 bg-white">
          <div className="p-6">
            <PlacesCardsWrapper />
          </div>
        </div>
        
        {/* Map Section - Sticky */}
        <div className="w-2/5 bg-white border-l border-gray-200">
          <div className="sticky top-20 h-[88vh]">
            <PlacesMap 
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>
      
      {/* -------------------------------------- */}
      {/* Tablet Layout - Adjustments for medium screens */}
      <div className="hidden md:flex large:hidden w-full min-h-screen flex-col">
        {/* Places list takes full width on tablets */}
        <div className="w-full">
          <div className="p-6">
            <PlacesCardsWrapper />
          </div>
        </div>
        
        {/* Map takes full width below on tablets */}
        <div className="w-full bg-white border-t border-gray-200">
          <div className="h-[60vh] p-4">
            <PlacesMap 
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-amber-100 h-[50vh] w-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-700">
          {getFooterText()}
        </div>
      </div>
    </div>
  );
}