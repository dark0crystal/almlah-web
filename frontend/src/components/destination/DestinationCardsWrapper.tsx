"use client"

import React, { useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import DestinationCard from './DestinationCard';
import { DestinationCardWrapperProps } from './types';

export default function DestinationCardWrapper({ destinations, highlightedDestination, onDestinationHighlight }: DestinationCardWrapperProps) {
  const locale = useLocale();
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted destination
  useEffect(() => {
    if (highlightedDestination && destinations.length > 0) {
      const destinationIndex = destinations.findIndex(d => d.id === highlightedDestination);
      
      if (destinationIndex !== -1) {
        // Desktop/tablet scroll (vertical)
        if (desktopScrollRef.current) {
          const container = desktopScrollRef.current.parentElement; // The scrollable container
          const cardElement = desktopScrollRef.current.children[destinationIndex] as HTMLElement;
          if (cardElement && container) {
            const cardTop = cardElement.offsetTop;
            container.scrollTo({
              top: cardTop,
              behavior: 'smooth'
            });
          }
        }
        
        // Mobile scroll (horizontal)
        if (mobileScrollRef.current) {
          const container = mobileScrollRef.current.parentElement; // The scrollable container
          const cardElement = mobileScrollRef.current.children[destinationIndex] as HTMLElement;
          if (cardElement && container) {
            const cardLeft = cardElement.offsetLeft;
            container.scrollTo({
              left: cardLeft,
              behavior: 'smooth'
            });
          }
        }

        // Clear highlight after animation
        setTimeout(() => {
          if (onDestinationHighlight) {
            onDestinationHighlight(null);
          }
        }, 2000);
      }
    }
  }, [highlightedDestination, destinations, onDestinationHighlight]);

  if (!destinations || destinations.length === 0) {
    return null; // Don't show anything if no destinations
  }

  return (
    <div className="w-full h-full">
      {/* Mobile: Horizontal Scrollable Container */}
      <div className="md:hidden p-3">
        <div className="overflow-x-auto scrollbar-hide">
          <div 
            ref={mobileScrollRef}
            className="flex gap-3 pb-2" 
            style={{ width: 'max-content' }}
          >
            {destinations.map(destination => (
              <div key={destination.id} className="flex-shrink-0 w-48">
                <DestinationCard 
                  destination={destination} 
                  isHighlighted={destination.id === highlightedDestination}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop/Tablet: Vertical Scrollable Container */}
      <div className="hidden md:block h-full overflow-y-auto">
        <div ref={desktopScrollRef} className="space-y-3">
          {destinations.map(destination => (
            <div key={destination.id} className="w-full">
              <DestinationCard 
                destination={destination} 
                isHighlighted={destination.id === highlightedDestination}
              />
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