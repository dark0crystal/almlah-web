"use client"

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import DestinationCard from './DestinationCard';

export default function DestinationCardWrapper({ destinations }) {
  const locale = useLocale();

  if (!destinations || destinations.length === 0) {
    return null; // Don't show anything if no destinations
  }

  return (
    <div className="w-full h-full">
      {/* Mobile: Horizontal Scrollable Container */}
      <div className="md:hidden p-3">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
            {destinations.map(destination => (
              <div key={destination.id} className="flex-shrink-0 w-48">
                <DestinationCard destination={destination} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop/Tablet: Vertical Scrollable Container */}
      <div className="hidden md:block h-full overflow-y-auto ">
        <div className="space-y-3">
          {destinations.map(destination => (
            <div key={destination.id} className="w-full">
              <DestinationCard destination={destination} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}