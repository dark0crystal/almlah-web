"use client"

import React from 'react';
import { Heart, Star } from 'lucide-react';
import Image from 'next/image';

export default function DestinationCard({ destination }) {
  return (
    <div className="bg-white rounded-3xl shadow-md overflow-hidden mb-4 hover:shadow-lg transition-shadow duration-300 p-2">
      <div className="relative h-42 rounded-3xl overflow-hidden">
        <Image 
          src={destination.image} 
          alt={destination.name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Text overlay at bottom of image */}
      <div className=" p-4">
        <p className="text-black text-sm mb-1 text-right opacity-90">
          {destination.category}
        </p>
        <h3 className="text-black text-lg font-bold text-right leading-tight">
          {destination.name}
        </h3>
      </div>
    
    </div>
  );
}