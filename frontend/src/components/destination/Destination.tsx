"use client"
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import DestinationCardWrapper from './DestinationCardsWrapper';
import MapMarker from './MapMarker';
import DestinationsMap from './DestinationsMap';
import img5 from "../../../public/img5.jpeg"

// Omani Governorates Data
const destinations = [
  {
    id: 1,
    name: 'مسقط',
    category: 'العاصمة، التجارة، المراكز الحكومية',
    image: img5,
    coordinates: { x: 85, y: 45 },
    rating: 4.8,
    isFavorite: false
  },
  {
    id: 2,
    name: 'ظفار',
    category: 'اللبان، المناظر الطبيعية، الخريف',
    image: img5,
    coordinates: { x: 75, y: 85 },
    rating: 4.9,
    isFavorite: true
  },
  {
    id: 3,
    name: 'مسندم',
    category: 'الفجائر، مضيق هرمز، السياحة البحرية',
    image: img5,
    coordinates: { x: 90, y: 15 },
    rating: 4.7,
    isFavorite: false
  },
  {
    id: 4,
    name: 'البريمي',
    category: 'الحدود، الواحات، التجارة',
    image: img5,
    coordinates: { x: 70, y: 25 },
    rating: 4.3,
    isFavorite: false
  },
  {
    id: 5,
    name: 'الداخلية',
    category: 'القلاع التاريخية، الجبال، التراث',
    image: img5,
    coordinates: { x: 75, y: 40 },
    rating: 4.6,
    isFavorite: true
  },
  {
    id: 6,
    name: 'الظاهرة',
    category: 'الآثار، الصحراء، التراث الثقافي',
    image: img5,
    coordinates: { x: 65, y: 35 },
    rating: 4.4,
    isFavorite: false
  },
  {
    id: 7,
    name: 'شمال الباطنة',
    category: 'الساحل، الزراعة، الموانئ',
    image: img5,
    coordinates: { x: 80, y: 30 },
    rating: 4.5,
    isFavorite: false
  },
  {
    id: 8,
    name: 'جنوب الباطنة',
    category: 'الصناعة، الساحل، المدن الحديثة',
    image: img5,
    coordinates: { x: 85, y: 35 },
    rating: 4.4,
    isFavorite: true
  },
  {
    id: 9,
    name: 'شمال الشرقية',
    category: 'الرمال، البدو، السياحة الصحراوية',
    image: img5,
    coordinates: { x: 85, y: 50 },
    rating: 4.5,
    isFavorite: false
  },
  {
    id: 10,
    name: 'جنوب الشرقية',
    category: 'الساحل، السلاحف، الطبيعة البحرية',
    image: img5,
    coordinates: { x: 90, y: 60 },
    rating: 4.6,
    isFavorite: true
  },
  {
    id: 11,
    name: 'الوسطى',
    category: 'الصحراء، البترول، البراري الواسعة',
    image: img5,
    coordinates: { x: 70, y: 65 },
    rating: 4.2,
    isFavorite: false
  }
];

export default function Destination() {
  const [destinationList, setDestinationList] = useState(destinations);
     
  return (
    <div className="w-[88vw]">
      <div className="flex h-[80vh] border">
        {/* Destinations Cards Wrapper */}
        <div className="flex-shrink-0">
          <DestinationCardWrapper 
            destinations={destinationList}
          />
        </div>

        {/* Map Section */}
        <div className="flex-1 mx-4">
          <DestinationsMap/>
        </div>
      </div>
    </div>
  );
}