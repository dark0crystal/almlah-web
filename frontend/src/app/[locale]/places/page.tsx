"use client"
import { useState } from "react";
import { MapPin, Star, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import PlacesModal from "./PlacesModal";
import PlacesCardsWrapper from "./PlacesCarsWrapper";
import PlacesMap from "./PlacesMap";
/**
 * Main Places component that renders the places discovery page
 * Features a full-screen layout with an expandable modal for place cards
 */
export default function Places() {
 
  // State to control modal expansion (collapsed vs expanded height)
  const [isExpanded, setIsExpanded] = useState(false);

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
            
            
            
        </div>


        {/* Main modal component containing place cards */}
        {/* <PlacesModal  
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
        />  */}
    </div>
  );
}


