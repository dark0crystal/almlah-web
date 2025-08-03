"use client"

import React from 'react';
import { Heart, Star } from 'lucide-react';
import Image from 'next/image';

export default function DestinationCard({ destination }) {
  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-md overflow-hidden mb-4 hover:shadow-lg transition-all duration-300 p-2 w-full max-w-sm mx-auto sm:max-w-none">
      <div className="relative aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] lg:aspect-[16/8] rounded-xl md:rounded-3xl overflow-hidden">
        <Image 
          src={destination.image}
          alt={destination.name}
          fill
          className="object-cover hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        
        {/* Optional overlay for better text readability on mobile */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Text content */}
      <div className="p-3 md:p-4">
        <p className="text-gray-600 text-xs sm:text-sm mb-1 text-right opacity-90 truncate">
          {destination.category}
        </p>
        <h3 className="text-gray-900 text-sm sm:text-base md:text-lg font-bold text-right leading-tight line-clamp-2">
          {destination.name}
        </h3>
      </div>
    </div>
  );
}