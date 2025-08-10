"use client"

import React from 'react';
import DestinationCard from './DestinationCard';

export default function DestinationCardWrapper({ destinations, language = 'ar' }) {
  if (!destinations || destinations.length === 0) {
    return (
      <div className="w-80 md:w-100 h-full p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">
              {language === 'ar' ? 'لا توجد محافظات متاحة' : 'No governorates available'}
            </p>
            <p className="text-sm">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 md:w-100 h-full overflow-x-auto md:overflow-y-auto p-4">
      {/* Header section - optional */}
      <div className="mb-6 hidden md:block">
        <h2 className={`text-2xl font-bold text-gray-900 mb-2 ${
          language === 'ar' ? 'text-right' : 'text-left'
        }`}>
          {language === 'ar' ? 'محافظات سلطنة عمان' : 'Sultanate of Oman Governorates'}
        </h2>
        <p className={`text-gray-600 text-sm ${
          language === 'ar' ? 'text-right' : 'text-left'
        }`}>
          {language === 'ar' 
            ? `اكتشف ${destinations.length} محافظة عمانية` 
            : `Discover ${destinations.length} Omani governorates`
          }
        </p>
      </div>
             
      {/* Responsive Layout Container */}
      <div className="flex md:flex-col gap-4 md:space-y-0">
        {destinations.map(destination => (
          <div key={destination.id} className="flex-shrink-0 w-72 md:w-full">
            <DestinationCard
              destination={destination}
              language={language}
            />
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="mt-6 text-center text-xs text-gray-500 hidden md:block">
        <p>
          {language === 'ar' 
            ? 'البيانات محدثة من الخادم' 
            : 'Data updated from server'
          }
        </p>
      </div>
    </div>
  );
}