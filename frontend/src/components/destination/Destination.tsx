"use client"
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import DestinationCardWrapper from './DestinationCardsWrapper';
import MapMarker from './MapMarker';
import DestinationsMap from './DestinationsMap';
import img1 from "../../../public/img1.jpeg"

// Sample destination data
const destinations = [
  {
    id: 1,
    name: 'مدينة الملك عبدالله الاقتصادية',
    category: 'الرياضة، مواقع طبيعية، خيارات ترفيهية',
    image: img1,
    coordinates: { x: 85, y: 45 },
    rating: 4.5,
    isFavorite: false
  },
  {
    id: 2,
    name: 'الطائف',
    category: 'أماكن تراثية وتاريخية، مواقع طبيعية، مغامرة',
    image: img1,
    coordinates: { x: 75, y: 55 },
    rating: 4.8,
    isFavorite: true
  },
  {
    id: 3,
    name: 'الرياض',
    category: 'العاصمة، تراث، تسوق',
    image: img1,
    coordinates: { x: 70, y: 40 },
    rating: 4.6,
    isFavorite: false
  },
  {
    id: 4,
    name: 'جدة',
    category: 'ساحلية، تراث، فنون',
    image: img1,
    coordinates: { x: 55, y: 50 },
    rating: 4.7,
    isFavorite: true
  }
];

export default function Destination() {
  const [destinationList, setDestinationList] = useState(destinations);
     
  return (
    <div className="w-[88vw]">
      <div className="flex h-[80vh] border p-8">
        {/* Destinations Sidebar */}
        <div className="flex-shrink-0">
          <DestinationCardWrapper 
            destinations={destinationList}
          />
        </div>

        {/* Map Section */}
        <div className="flex-1 ml-4">
          <DestinationsMap/>
        </div>
      </div>
    </div>
  );
}