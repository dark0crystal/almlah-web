"use client"
import { useState, useEffect } from "react";
import { ChevronDown, Utensils } from "lucide-react";
import { useParams } from "next/navigation";
import { fetchGovernates } from "@/services/placesApi"; // Using placesApi
import { Governate } from "@/types";

interface RestaurantGovernateFilterProps {
  selectedGovernateId: string | null;
  onGovernateChange: (governateId: string | null) => void;
}

export default function RestaurantGovernateFilter({ 
  selectedGovernateId, 
  onGovernateChange 
}: RestaurantGovernateFilterProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [governates, setGovernates] = useState<Governate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadGovernates = async () => {
      try {
        setLoading(true);
        const data = await fetchGovernates();
        setGovernates(data);
      } catch (error) {
        console.error('Error loading governates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGovernates();
  }, []);

  const getGovernateName = (governate: Governate): string => {
    return locale === 'ar' ? governate.name_ar : governate.name_en;
  };

  const selectedGovernate = governates.find(g => g.id === selectedGovernateId);
  const selectedName = selectedGovernate ? getGovernateName(selectedGovernate) : 
    (locale === 'ar' ? 'جميع المحافظات' : 'All Governates');

  if (loading) {
    return (
      <div className="w-full h-12 rounded-full border border-gray-200 bg-white px-4 flex items-center">
        <div className="text-gray-500">
          {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 rounded-full border border-gray-200 bg-white px-4 flex items-center justify-between hover:border-gray-300 transition-colors ${
          isOpen ? 'ring-2 ring-orange-500 border-orange-500' : ''
        }`}
      >
        <div className="flex items-center">
          <Utensils className="w-5 h-5 text-gray-400 mr-2" />
          <span className="text-gray-700 truncate">{selectedName}</span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg z-20 max-h-64 overflow-y-auto">
            {/* All Governates Option */}
            <button
              onClick={() => {
                onGovernateChange(null);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                !selectedGovernateId ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
              }`}
            >
              {locale === 'ar' ? 'جميع المحافظات' : 'All Governates'}
            </button>
            
            <div className="border-t border-gray-100" />
            
            {/* Governate Options */}
            {governates.map((governate) => (
              <button
                key={governate.id}
                onClick={() => {
                  onGovernateChange(governate.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedGovernateId === governate.id 
                    ? 'bg-orange-50 text-orange-700' 
                    : 'text-gray-700'
                }`}
              >
                {getGovernateName(governate)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}