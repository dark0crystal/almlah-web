"use client"
import { useState } from "react";
import { MapPin, Star, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import PlacesModal from "./PlacesModal";
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


