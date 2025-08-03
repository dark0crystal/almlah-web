"use client"

import React from 'react';
import DestinationCard from './DestinationCard';

export default function DestinationCardWrapper({ destinations }) {
  return (
    <div className="w-80 md:w-100 h-full overflow-x-auto md:overflow-y-auto p-4">
      {/* <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 text-right mb-2">
          تعرف على الوجهات
        </h2>
        <button className="text-purple-600 hover:text-purple-700 text-sm font-medium text-right">
          اكتشف أكثر
        </button>
      </div> */}
      
      {/* Responsive Layout Container */}
      <div className="flex md:flex-col gap-4 md:space-y-0">
        {destinations.map(destination => (
          <div key={destination.id} className="flex-shrink-0 w-72 md:w-full">
            <DestinationCard 
              destination={destination}
            />
          </div>
        ))}
      </div>
    </div>
  );
}