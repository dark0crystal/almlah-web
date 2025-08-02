"use client"

import React from 'react';

export default function MapMarker({ destination, isActive, onClick }) {
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      style={{ 
        left: `${destination.coordinates.x}%`, 
        top: `${destination.coordinates.y}%` 
      }}
      onClick={() => onClick(destination.id)}
    >
      <div className={`relative ${isActive ? 'z-20' : 'z-10'}`}>
        <div className={`w-12 h-12 rounded-full border-4 border-white shadow-lg transition-all duration-300 ${
          isActive ? 'bg-purple-600 scale-125' : 'bg-blue-500 hover:scale-110'
        }`}>
          <img 
            src={destination.image} 
            alt={destination.name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        {isActive && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg whitespace-nowrap">
            <span className="text-xs font-medium text-gray-900">{destination.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}