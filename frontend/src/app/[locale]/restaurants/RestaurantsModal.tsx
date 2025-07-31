"use client"
import { useState } from "react";
import { MapPin, Star, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import PlaceCard from "./RestaurantCard";
import img1 from "../../../../public/img1.jpeg"

// Interface defining props for the PlacesModal component
interface PlacesModalProps {
  isExpanded: boolean;       // Controls modal height (collapsed vs expanded)
  onToggleExpand: () => void; // Callback to toggle expansion state
}

/**
 * Modal component that displays place cards in a vertically expandable container
 * Can be collapsed (2/3 height) or expanded (5/6 height) for better content viewing
 */
export default function RestaurantsModal({  isExpanded, onToggleExpand }: PlacesModalProps) {
  // Static data for place cards - in a real app this would come from an API
  const places = [
    {
      id: 1,
      name: "Santorini, Greece",
      image: img1,
      rating: 4.9,
      duration: "3-5 days",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 2,
      name: "Kyoto, Japan",
      image: img1,
      rating: 4.8,
      duration: "4-6 days",
      description: "Ancient capital of Japan featuring thousands of temples, traditional wooden houses, and beautiful cherry blossoms.",
      highlights: ["Fushimi Inari Shrine", "Bamboo Grove", "Gion District", "Golden Pavilion"]
    },
    {
      id: 3,
      name: "Bali, Indonesia",
      image: img1,
      rating: 4.7,
      duration: "5-7 days",
      description: "Tropical paradise with lush rice terraces, ancient temples, pristine beaches, and vibrant cultural experiences.",
      highlights: ["Ubud Rice Terraces", "Temple Hopping", "Beach Clubs", "Volcano Hiking"]
    },
    {
      id: 4,
      name: "Patagonia, Chile",
      image: img1,
      rating: 4.9,
      duration: "7-10 days",
      description: "Wild and rugged landscape featuring glaciers, mountains, and pristine wilderness perfect for adventure seekers.",
      highlights: ["Torres del Paine", "Glacier Trekking", "Wildlife Watching", "Epic Landscapes"]
    }
  ];

 
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      {/* Semi-transparent backdrop with blur effect */}
     

      {/* Main modal container with dynamic height based on expansion state */}
      <div className={`relative bg-white rounded-t-3xl shadow-2xl w-full max-w-4xl transition-all duration-500 ease-out transform ${
        isExpanded ? 'h-5/6' : 'h-2/3'
      }`}>
        {/* Modal header with title and control buttons */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <MapPin className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">Featured Places</h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* Expand/collapse toggle button */}
            <button
              onClick={onToggleExpand}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
    
           
          </div>
        </div>

        {/* Scrollable content area containing place cards */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} isExpanded={isExpanded} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}