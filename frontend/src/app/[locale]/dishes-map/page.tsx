"use client"
import React, { useState } from 'react';
import { OmanMap } from '@/components/map/OmanMap';
import { DishModal } from '@/components/modals/DishModal';
import { Dish } from '@/types';

const dishesData: { [key: string]: Dish[] } = {
  muscat: [
    {
      id: '1',
      name: 'Shuwa',
      description: 'Traditional Omani slow-cooked meat dish prepared in underground ovens for special occasions.',
      images: ['/dishes/shuwa1.jpg', '/dishes/shuwa2.jpg'],
      governorate: 'muscat'
    },
    {
      id: '2',
      name: 'Mashuai',
      description: 'Grilled kingfish served with lemon rice, a signature dish from the coastal regions.',
      images: ['/dishes/mashuai1.jpg', '/dishes/mashuai2.jpg'],
      governorate: 'muscat'
    }
  ],
  dhofar: [
    {
      id: '3',
      name: 'Majboos',
      description: 'Spiced rice dish with meat, popular in the southern region of Dhofar.',
      images: ['/dishes/majboos1.jpg', '/dishes/majboos2.jpg'],
      governorate: 'dhofar'
    }
  ],
  'ad-dakhiliyah': [
    {
      id: '4',
      name: 'Harees',
      description: 'Wheat porridge with meat, traditionally served during Ramadan.',
      images: ['/dishes/harees1.jpg', '/dishes/harees2.jpg'],
      governorate: 'ad-dakhiliyah'
    }
  ],
  'al-batinah-north': [
    {
      id: '5',
      name: 'Makbous',
      description: 'Fragrant rice dish with fish, popular in the northern coastal regions.',
      images: ['/dishes/makbous1.jpg', '/dishes/makbous2.jpg'],
      governorate: 'al-batinah-north'
    }
  ],
  'al-batinah-south': [
    {
      id: '6',
      name: 'Qurs',
      description: 'Traditional flatbread served with honey and dates.',
      images: ['/dishes/qurs1.jpg', '/dishes/qurs2.jpg'],
      governorate: 'al-batinah-south'
    }
  ],
  'ash-sharqiyah-north': [
    {
      id: '7',
      name: 'Khubz Rakhal',
      description: 'Thin crispy bread cooked on a dome-shaped griddle.',
      images: ['/dishes/khubz1.jpg', '/dishes/khubz2.jpg'],
      governorate: 'ash-sharqiyah-north'
    }
  ],
  'ash-sharqiyah-south': [
    {
      id: '8',
      name: 'Halwa Omani',
      description: 'Traditional Omani sweet made with rose water and saffron.',
      images: ['/dishes/halwa1.jpg', '/dishes/halwa2.jpg'],
      governorate: 'ash-sharqiyah-south'
    }
  ],
  'ad-dhahirah': [
    {
      id: '9',
      name: 'Mishkak',
      description: 'Grilled meat skewers marinated in traditional spices.',
      images: ['/dishes/mishkak1.jpg', '/dishes/mishkak2.jpg'],
      governorate: 'ad-dhahirah'
    }
  ],
  'al-wusta': [
    {
      id: '10',
      name: 'Camel Meat Stew',
      description: 'Traditional stew made with camel meat, popular in the desert regions.',
      images: ['/dishes/camel1.jpg', '/dishes/camel2.jpg'],
      governorate: 'al-wusta'
    }
  ],
  'al-buraimi': [
    {
      id: '11',
      name: 'Dates and Qahwa',
      description: 'Traditional combination of fresh dates served with Omani coffee.',
      images: ['/dishes/dates1.jpg', '/dishes/dates2.jpg'],
      governorate: 'al-buraimi'
    }
  ],
  musandam: [
    {
      id: '12',
      name: 'Samak Mashwi',
      description: 'Grilled fish with traditional spices, popular in the northern fjords.',
      images: ['/dishes/samak1.jpg', '/dishes/samak2.jpg'],
      governorate: 'musandam'
    }
  ]
};

export default function DishesMap() {
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGovernorateClick = (governorateId: string) => {
    setSelectedGovernorate(governorateId);
  };

  const handleDishClick = (dish: Dish) => {
    setSelectedDish(dish);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDish(null);
  };

  const selectedDishes = selectedGovernorate ? dishesData[selectedGovernorate] || [] : [];

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="flex h-full">
        {/* Map Section */}
        <div className={`transition-all duration-500 ease-in-out ${
          selectedGovernorate ? 'w-2/3' : 'w-full'
        }`}>
          <OmanMap 
            onGovernorateClick={handleGovernorateClick}
            selectedGovernorate={selectedGovernorate}
          />
        </div>

        {/* Dishes Panel */}
        {selectedGovernorate && (
          <div className="w-1/3 bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 capitalize">
                  {selectedGovernorate.replace('-', ' ')} Dishes
                </h2>
                <button
                  onClick={() => setSelectedGovernorate(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-semibold"
                >
                  ×
                </button>
              </div>
              
              {selectedDishes.length > 0 ? (
                <div className="grid gap-4">
                  {selectedDishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => handleDishClick(dish)}
                      className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-amber-200 hover:border-amber-300"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-amber-200 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {dish.name}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {dish.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="text-gray-500">No dishes available for this region yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dish Modal */}
      <DishModal
        dish={selectedDish}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}