
// "use client"
// import { useState } from "react";
// import { MapPin, Star, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import PlaceCard from "./RestaurantCard";
import img1 from "../../../../public/img1.jpeg"
import SearchBar from "./SearchBar";
import img2 from "../../../../public/img2.jpeg"
import img3 from "../../../../public/img3.jpeg"



// Interface defining props for the PlacesModal component
interface PlacesModalProps {
  isExpanded: boolean;       // Controls modal height (collapsed vs expanded)
  onToggleExpand: () => void; // Callback to toggle expansion state
}

export const places = [
    {
      id: 1,
      name: "نوثــق",
      lat: 36.3932,
      lng: 25.4615,
      image: img1,
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 2,
      name: "مــكان",
      lat: 35.0116,
      lng: 135.7681,
      image: img2,
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
      image: img3,
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
      image: img1,
      rating: 4.9,
      duration: "7-10 days",
      type: "destination",
      description: "Wild and rugged landscape featuring glaciers, mountains, and pristine wilderness perfect for adventure seekers.",
      highlights: ["Torres del Paine", "Glacier Trekking", "Wildlife Watching", "Epic Landscapes"]
    },
    {
      id: 5,
      name: "الموالح رفيق",
      lat: 36.3932,
      lng: 25.4615,
      image: img1,
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 6,
      name: "الموالح رفيق",
      lat: 36.3932,
      lng: 25.4615,
      image: img2,
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 7,
      name: "الموالح رفيق",
      lat: 36.3932,
      lng: 25.4615,
      image: img3,
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 8,
      name: "الموالح رفيق",
      lat: 36.3932,
      lng: 25.4615,
      image: img1,
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 5,
      name: "الموالح رفيق",
      lat: 36.3932,
      lng: 25.4615,
      image: img1,
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 6,
      name: "الموالح رفيق",
      lat: 36.3932,
      lng: 25.4615,
      image: img1,
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 7,
      name: "الموالح رفيق",
      lat: 36.3932,
      lng: 25.4615,
      image: img1,
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 8,
      name: "الموالح رفيق",
      lat: 36.3932,
      lng: 25.4615,
      image: img1,
      rating: 4.9,
      duration: "3-5 days",
      type: "destination",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
  ];

export default function RestaurantsCardsWrapper(){
    return(
        <div>
            <div className="">
              <SearchBar/>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                    {places.map((place) => (
                        <PlaceCard key={place.id} place={place} isExpanded={true} />
                    ))}
                </div>
            </div>
        </div>
    )
}