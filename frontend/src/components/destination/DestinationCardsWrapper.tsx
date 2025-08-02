"use client"

import React from 'react';
import DestinationCard from './DestinationCard';

export default function DestinationCardWrapper({ destinations }) {
  return (
    <div className="w-80 h-full overflow-y-auto bg-gray-50 p-4">
      {/* <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 text-right mb-2">
          تعرف على الوجهات
        </h2>
        <button className="text-purple-600 hover:text-purple-700 text-sm font-medium text-right">
          اكتشف أكثر
        </button>
      </div> */}
      
      <div className="space-y-4">
        {destinations.map(destination => (
          <DestinationCard 
            key={destination.id}
            destination={destination}
          />
        ))}
      </div>
    </div>
  );
}