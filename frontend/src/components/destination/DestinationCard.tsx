"use client"
import React from 'react';
import { Heart, Star } from 'lucide-react';
import Image from 'next/image';

export default function DestinationCard({ destination }) {
  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-md overflow-hidden mb-4 hover:shadow-lg transition-all duration-300 p-2 w-full max-w-sm mx-auto sm:max-w-none min-h-[120px] md:min-h-[280px] lg:min-h-[320px]">
      {/* Mobile: Horizontal Layout / Desktop: Vertical Layout */}
      <div className="flex md:flex-col h-full">
        {/* Image Section */}
        <div className="relative  md:w-full md:aspect-[4/3] lg:aspect-[16/10] flex-shrink-0 rounded-xl md:rounded-3xl overflow-hidden">
          <Image 
            src={destination.image}
            alt={destination.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
                    
          {/* Optional overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* Text content */}
        <div className="flex-1 p-4 md:p-6 flex flex-col justify-center md:justify-start">
          <p className="text-gray-600 text-xs sm:text-sm mb-2 md:mb-3 text-right opacity-90 truncate">
            {destination.category}
          </p>
          <h3 className="text-gray-900 text-base sm:text-lg md:text-xl font-bold text-right leading-tight line-clamp-2">
            {destination.name}
          </h3>
        </div>
      </div>
    </div>
  );
}