
// "use client"
// import { useState } from "react";
// import { MapPin, Star, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import PlaceCard from "./PlacesCard";



// Interface defining props for the PlacesModal component
interface PlacesModalProps {
  isExpanded: boolean;       // Controls modal height (collapsed vs expanded)
  onToggleExpand: () => void; // Callback to toggle expansion state
}

export const places = [
    {
      id: 1,
      name: "Santorini, Greece",
      lat: 36.3932,
      lng: 25.4615,
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&crop=center",
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 2,
      name: "Kyoto, Japan",
      lat: 35.0116,
      lng: 135.7681,
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=250&fit=crop&crop=center",
      rating: 4.8,
      duration: "4-6 days",
      type: "destination",
      description: "Ancient capital of Japan featuring thousands of temples, traditional wooden houses, and beautiful cherry blossoms.",
      highlights: ["Fushimi Inari Shrine", "Bamboo Grove", "Gion District", "Golden Pavilion"]
    },
    {
      id: 3,
      name: "Bali, Indonesia",
      lat: -8.4095,
      lng: 115.1889,
      image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=250&fit=crop&crop=center",
      rating: 4.7,
      duration: "5-7 days",
      type: "destination",
      description: "Tropical paradise with lush rice terraces, ancient temples, pristine beaches, and vibrant cultural experiences.",
      highlights: ["Ubud Rice Terraces", "Temple Hopping", "Beach Clubs", "Volcano Hiking"]
    },
    {
      id: 4,
      name: "Patagonia, Chile",
      lat: -50.9423,
      lng: -73.4068,
      image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=250&fit=crop&crop=center",
      rating: 4.9,
      duration: "7-10 days",
      type: "destination",
      description: "Wild and rugged landscape featuring glaciers, mountains, and pristine wilderness perfect for adventure seekers.",
      highlights: ["Torres del Paine", "Glacier Trekking", "Wildlife Watching", "Epic Landscapes"]
    }
  ];

export default function PlacesCardsWrapper(){

    
    return(
        <div>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {places.map((place) => (
                        <PlaceCard key={place.id} place={place} isExpanded={true} />
                    ))}
                </div>
            </div>
        </div>
    )
}