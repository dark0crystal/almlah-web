"use client"

import React from 'react';
import { Heart, Star } from 'lucide-react';
import Image from 'next/image';

export default function DestinationCard({ destination }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-64">
        <Image 
          src={destination.image} 
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        
        {/* Heart button */}
        <button 
          onClick={() => onToggleFavorite(destination.id)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
        >
          <Heart 
            className={`w-4 h-4 ${destination.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
          />
        </button>

        {/* Text overlay at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
          <p className="text-white text-sm mb-1 text-right opacity-90">
            {destination.category}
          </p>
          <h3 className="text-white text-lg font-bold text-right leading-tight">
            {destination.name}
          </h3>
        </div>

        {/* Rating badge */}
        <div className="absolute top-3 left-3 flex items-center bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
          <span className="text-xs font-medium text-gray-800">{destination.rating}</span>
        </div>
      </div>
    </div>
  );
}