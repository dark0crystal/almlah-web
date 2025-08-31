"use client"
import { useState, useEffect } from "react";
import { X, MapPin, Grid3X3, Check } from "lucide-react";
import { useTranslations } from 'next-intl';
import { fetchGovernates, fetchCategories } from "@/services/placesApi";
import { Governate } from "@/types";

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  type: string;
}

interface RestaurantsFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGovernateId: string | null;
  selectedCategoryIds: string[];
  onApplyFilters: (governateId: string | null, categoryIds: string[]) => void;
  locale: string;
}

export default function RestaurantsFilterModal({
  isOpen,
  onClose,
  selectedGovernateId,
  selectedCategoryIds,
  onApplyFilters,
  locale
}: RestaurantsFilterModalProps) {
  const t = useTranslations('places');
  
  // State for filter options
  const [governates, setGovernates] = useState<Governate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local filter state (before applying)
  const [tempGovernateId, setTempGovernateId] = useState<string | null>(selectedGovernateId);
  const [tempCategoryIds, setTempCategoryIds] = useState<string[]>(selectedCategoryIds);

  // Load filter options
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        setLoading(true);
        const [governatesData, categoriesData] = await Promise.all([
          fetchGovernates(),
          fetchCategories()
        ]);
        setGovernates(governatesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadFilterData();
    }
  }, [isOpen]);

  // Reset temp state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempGovernateId(selectedGovernateId);
      setTempCategoryIds(selectedCategoryIds);
    }
  }, [isOpen, selectedGovernateId, selectedCategoryIds]);

  const handleGovernateSelect = (governateId: string | null) => {
    setTempGovernateId(governateId);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setTempCategoryIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleApply = () => {
    onApplyFilters(tempGovernateId, tempCategoryIds);
    onClose();
  };

  const handleClear = () => {
    setTempGovernateId(null);
    setTempCategoryIds([]);
  };

  const getGovernateName = (governate: Governate): string => {
    return locale === 'ar' ? governate.name_ar : governate.name_en;
  };

  const getCategoryName = (category: Category): string => {
    return locale === 'ar' ? category.name_ar : category.name_en;
  };

  const hasActiveFilters = tempGovernateId !== null || tempCategoryIds.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {locale === 'ar' ? 'تصفية المطاعم' : 'Filter Restaurants'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Location Filter */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {locale === 'ar' ? 'المحافظة' : 'Governate'}
                </h3>
                
                <div className="space-y-2">
                  {/* All Governates Option */}
                  <button
                    onClick={() => handleGovernateSelect(null)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                      tempGovernateId === null
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`font-medium ${
                      tempGovernateId === null ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {locale === 'ar' ? 'جميع المحافظات' : 'All Governates'}
                    </span>
                    {tempGovernateId === null && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </button>

                  {/* Governate Options */}
                  {governates.map((governate) => (
                    <button
                      key={governate.id}
                      onClick={() => handleGovernateSelect(governate.id)}
                      className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                        tempGovernateId === governate.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`font-medium ${
                        tempGovernateId === governate.id ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {getGovernateName(governate)}
                      </span>
                      {tempGovernateId === governate.id && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  {locale === 'ar' ? 'الفئات' : 'Categories'}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryToggle(category.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                        tempCategoryIds.includes(category.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {category.icon && (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                        <span className={`font-medium ${
                          tempCategoryIds.includes(category.id) ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {getCategoryName(category)}
                        </span>
                      </div>
                      {tempCategoryIds.includes(category.id) && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleClear}
            disabled={!hasActiveFilters}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'text-gray-700 hover:text-gray-900'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {locale === 'ar' ? 'مسح الكل' : 'Clear all'}
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleApply}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {locale === 'ar' ? 'تطبيق المرشحات' : 'Apply filters'}
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {(tempGovernateId ? 1 : 0) + tempCategoryIds.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}