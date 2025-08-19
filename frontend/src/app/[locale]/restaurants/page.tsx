"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { Utensils, List, X } from "lucide-react";
import RestaurantsCardsWrapper from "./RestaurantsCardsWrapper";
import RestaurantsMap from "./RestaurantsMap";
import RestaurantGovernateFilter from "./RestaurantsGovernatesFilter";
import { CATEGORY_IDS, getCategoryName } from "@/services/placesApi";

/**
 * Main Restaurants component that renders the restaurants discovery page
 * Features responsive layout with full-screen map on mobile and split view on desktop
 * Now uses the scalable category system with the restaurant category ID
 */
export default function Restaurants() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  // State to control mobile view toggle between map and restaurants list
  const [showRestaurantsList, setShowRestaurantsList] = useState(false);
  
  // State for sharing filters between components
  const [selectedGovernateId, setSelectedGovernateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get restaurant category ID from the scalable system
  const restaurantCategoryId = CATEGORY_IDS.RESTAURANTS;

  const getToggleButtonText = () => {
    return locale === 'ar' ? 'قائمة المطاعم' : 'Restaurants List';
  };

  const getRestaurantsText = () => {
    return getCategoryName("RESTAURANTS", locale as 'ar' | 'en');
  };

  // If no valid category ID, show error
  if (!restaurantCategoryId) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            {locale === 'ar' ? 'فئة غير صالحة' : 'Invalid Category'}
          </h1>
          <p className="text-gray-600">
            {locale === 'ar' ? 'فئة المطاعم غير موجودة' : 'The restaurants category does not exist'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white relative ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* Header Section - Title and Filter */}
      <div className="bg-white border-b border-gray-200 px-5 xl:px-25 py-4">
        <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          {/* Title on the right (or left in RTL) */}
          <h1 className="text-3xl font-bold text-gray-800">{getRestaurantsText()}</h1>
          
          {/* Filter on the left (or right in RTL) */}
          <div className="w-64">
            <RestaurantGovernateFilter 
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
          <RestaurantsMap 
            categoryId={restaurantCategoryId}
            selectedGovernateId={selectedGovernateId}
            searchQuery={searchQuery}
            locale={locale}
          />
        </div>
        
        {/* Mobile toggle button - floating */}
        <button
          onClick={() => setShowRestaurantsList(!showRestaurantsList)}
          className={`absolute top-4 z-50 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 ${
            locale === 'ar' ? 'left-4' : 'right-4'
          }`}
          aria-label={getToggleButtonText()}
        >
          <List className="w-6 h-6 text-gray-700" />
        </button>
        
        {/* Mobile restaurants cards overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-40 max-h-60">
          <RestaurantsCardsWrapper 
            isMobileMapView={true}
            categoryId={restaurantCategoryId}
            selectedGovernateId={selectedGovernateId}
            onGovernateChange={setSelectedGovernateId}
          />
        </div>

        {/* Mobile restaurants list full overlay */}
        {showRestaurantsList && (
          <div className="absolute inset-0 z-50 bg-white">
            {/* Header with close button */}
            <div className={`flex items-center justify-between p-4 border-b border-gray-200 bg-white ${
              locale === 'ar' ? 'flex-row-reverse' : ''
            }`}>
              <h2 className="text-xl font-bold text-gray-800">
                {getRestaurantsText()}
              </h2>
              <button
                onClick={() => setShowRestaurantsList(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            {/* Restaurants content with padding */}
            <div className="h-full overflow-y-auto pb-20">
              <div className="px-5 py-4">
                <RestaurantsCardsWrapper 
                  isMobileMapView={false}
                  categoryId={restaurantCategoryId}
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
        {/* Restaurants List Section - 80vh with scroll */}
        <div className="w-3/5 bg-white flex justify-center">
          <div className="w-full max-w-none px-5 xl:px-25 py-6">
            <div className="h-[80vh]">
              <RestaurantsCardsWrapper 
                isMobileMapView={false}
                categoryId={restaurantCategoryId}
                selectedGovernateId={selectedGovernateId}
                onGovernateChange={setSelectedGovernateId}
              />
            </div>
          </div>
        </div>
        
        {/* Map Section - 80vh */}
        <div className="w-2/5 bg-white border-l border-gray-200">
          <div className="h-[80vh] p-4">
            <RestaurantsMap 
              categoryId={restaurantCategoryId}
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
              locale={locale}
            />
          </div>
        </div>
      </div>
      
      {/* -------------------------------------- */}
      {/* Tablet Layout - Cards and Map both 80vh */}
      <div className="hidden md:flex large:hidden w-full flex-col">
        {/* Restaurants list - 80vh with scroll */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-none px-5 xl:px-25 py-6">
            <div className="h-[80vh]">
              <RestaurantsCardsWrapper 
                isMobileMapView={false}
                categoryId={restaurantCategoryId}
                selectedGovernateId={selectedGovernateId}
                onGovernateChange={setSelectedGovernateId}
              />
            </div>
          </div>
        </div>
        
        {/* Map - 80vh */}
        <div className="w-full bg-white border-t border-gray-200">
          <div className="h-[80vh] p-4">
            <RestaurantsMap 
              categoryId={restaurantCategoryId}
              selectedGovernateId={selectedGovernateId}
              searchQuery={searchQuery}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}