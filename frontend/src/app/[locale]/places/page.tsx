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
    <div className="w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">

        {/* Devide the section into two , For big screens */}
        <div className="grid grid-cols-2  w-screen h-screen">

            <div className="bg-white w-fill h-screen">
                <PlacesMap/>
            </div>

            <div className="bg-amber-200 w-full h-screen">
                <PlacesCardsWrapper/>
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
        {/* Map section - left side */}
        <div className="bg-white w-full h-screen relative">
          <PlacesMap />
        </div>

        {/* Places cards section - right side */}
        <div className="w-full h-screen overflow-hidden">
          <div className="h-full overflow-y-auto">
            <PlacesCardsWrapper />
          </div>
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