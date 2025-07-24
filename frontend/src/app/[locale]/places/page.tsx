"use client"
import { useState } from "react";
import { MapPin, Star, Clock, ChevronDown, ChevronUp, X } from "lucide-react";

/**
 * Main Places component that renders the places discovery page
 * Features a full-screen layout with an expandable modal for place cards
 */
export default function Places() {
 
  // State to control modal expansion (collapsed vs expanded height)
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Decorative background elements with blur effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute -bottom-32 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl"></div>
      </div>

      {/* Page header with title and subtitle */}
      <div className="relative z-10 p-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Discover Places</h1>
        <p className="text-gray-600">Explore amazing destinations around the world</p>
      </div>

      {/* Main modal component containing place cards */}
      <PlacesModal  
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />

     
    </div>
  );
}

// Interface defining props for the PlacesModal component
interface PlacesModalProps {
  isExpanded: boolean;       // Controls modal height (collapsed vs expanded)
  onToggleExpand: () => void; // Callback to toggle expansion state
}

/**
 * Modal component that displays place cards in a vertically expandable container
 * Can be collapsed (2/3 height) or expanded (5/6 height) for better content viewing
 */
function PlacesModal({  isExpanded, onToggleExpand }: PlacesModalProps) {
  // Static data for place cards - in a real app this would come from an API
  const places = [
    {
      id: 1,
      name: "Santorini, Greece",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&crop=center",
      rating: 4.9,
      duration: "3-5 days",
      description: "A stunning Greek island known for its white-washed buildings, blue domes, and breathtaking sunsets over the Aegean Sea.",
      highlights: ["Oia Village", "Red Beach", "Wine Tasting", "Volcanic Views"]
    },
    {
      id: 2,
      name: "Kyoto, Japan",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=250&fit=crop&crop=center",
      rating: 4.8,
      duration: "4-6 days",
      description: "Ancient capital of Japan featuring thousands of temples, traditional wooden houses, and beautiful cherry blossoms.",
      highlights: ["Fushimi Inari Shrine", "Bamboo Grove", "Gion District", "Golden Pavilion"]
    },
    {
      id: 3,
      name: "Bali, Indonesia",
      image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=250&fit=crop&crop=center",
      rating: 4.7,
      duration: "5-7 days",
      description: "Tropical paradise with lush rice terraces, ancient temples, pristine beaches, and vibrant cultural experiences.",
      highlights: ["Ubud Rice Terraces", "Temple Hopping", "Beach Clubs", "Volcano Hiking"]
    },
    {
      id: 4,
      name: "Patagonia, Chile",
      image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=250&fit=crop&crop=center",
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

/**
 * Individual place card component that displays place information
 * Features hover effects and conditional content based on modal expansion state
 */
function PlaceCard({ place, isExpanded }) {
  // State to track hover status for interactive effects
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Place image with zoom effect on hover */}
      <div className="relative overflow-hidden">
        <img 
          src={place.image} 
          alt={place.name}
          className={`w-full h-48 object-cover transition-transform duration-300 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
        />
        {/* Rating badge positioned over the image */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm font-semibold">{place.rating}</span>
        </div>
      </div>

      {/* Card content section */}
      <div className="p-5">
        {/* Place name and duration info */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-800">{place.name}</h3>
          <div className="flex items-center text-gray-500 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            {place.duration}
          </div>
        </div>

        {/* Place description */}
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {place.description}
        </p>

        {/* Highlights section - only visible when modal is expanded */}
        {isExpanded && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Highlights:</h4>
            <div className="flex flex-wrap gap-2">
              {place.highlights.map((highlight, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action button to explore the place */}
        <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:shadow-lg">
          Explore {place.name}
        </button>
      </div>
    </div>
  );
}