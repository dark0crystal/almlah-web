"use client"
import { useState } from "react";
import { MapPin, Star, Clock, ChevronDown, ChevronUp, X } from "lucide-react";

/**
 * Individual place card component that displays place information
 * Features hover effects and conditional content based on modal expansion state
 */
export default function PlaceCard({ place, isExpanded }) {
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