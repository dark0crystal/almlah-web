"use client"
import { useState } from "react";
import { MapPin, Star, Clock, ChevronDown, ChevronUp, X, List } from "lucide-react";
import PlacesModal from "./PlacesModal";
import PlacesCardsWrapper from "./PlacesCarsWrapper";
import PlacesMap from "./PlacesMap";

/**
 * Main Places component that renders the places discovery page
 * Features responsive layout with full-screen map on mobile and split view on desktop
 */
export default function Places() {
  // State to control modal expansion (collapsed vs expanded height)
  const [isExpanded, setIsExpanded] = useState(false);
  
  // State to control mobile view toggle between map and places list
  const [showPlacesList, setShowPlacesList] = useState(false);

  return (

    <div className="w-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      
      {/* Mobile Layout - Stack vertically, map takes priority */}
      <div className="lg:hidden w-full h-screen relative">
        {/* Full screen map for mobile */}
        <div className="w-full h-full">
          <PlacesMap />
        </div>
        
        {/* Mobile toggle button - floating */}
        <button
          onClick={() => setShowPlacesList(!showPlacesList)}
          className="absolute top-4 right-4 z-50 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
        >
          <List className="w-6 h-6 text-gray-700" />
        </button>
        
        {/* Mobile places list overlay */}
        {showPlacesList && (
          <div className="absolute inset-0 z-40 bg-white">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Places to Visit</h2>
              <button
                onClick={() => setShowPlacesList(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>

            </div>
            
            {/* Places content */}
            <div className="h-full overflow-y-auto pb-20">
              <PlacesCardsWrapper />
            </div>
          </div>
        )}
      </div>

      {/* Desktop Layout - Two column grid */}
      <div className="hidden lg:grid lg:grid-cols-2 w-screen h-screen">
        {/* Places cards section - left side */}
        <div className="w-full h-screen overflow-hidden">
          <div className="h-full overflow-y-auto">
            <PlacesCardsWrapper />
          </div>
        </div>
        {/* Map section - right side */}
        <div className="bg-white w-full h-[88vh] relative">
          <PlacesMap />
        </div>
      </div>

      {/* Tablet Layout - Adjustments for medium screens */}
      <div className="hidden md:block lg:hidden w-full h-screen">
        <div className="grid grid-cols-1 md:grid-cols-3 w-full h-screen">
          {/* Map takes 2/3 of the screen on tablets */}
          <div className="md:col-span-2 bg-white w-full h-screen">
            <PlacesMap />
          </div>
          
          {/* Places list takes 1/3 on tablets */}
          <div className="md:col-span-1 w-full h-screen overflow-hidden border-l border-gray-200">
            <div className="h-full overflow-y-auto">
              <PlacesCardsWrapper />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}