"use client"
import { useState, useEffect, useRef } from "react";
import { Search, X, MapPin } from "lucide-react";
import { useTranslations } from 'next-intl';
import { searchPlaces } from "@/services/placesApi";
import { Place } from "@/types";

interface PlaceSearchBarProps {
  selectedGovernateId?: string | null;
  categoryId: string;
  onPlaceSelect?: (place: Place) => void;
  locale: string;
  placeholder?: string;
}

export default function PlaceSearchBar({
  selectedGovernateId,
  categoryId,
  onPlaceSelect,
  locale,
  placeholder
}: PlaceSearchBarProps) {
  const t = useTranslations('places');
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search function with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, categoryId, selectedGovernateId]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const searchResults = await searchPlaces(query, categoryId, selectedGovernateId);
      setResults(searchResults.slice(0, 8)); // Limit to 8 results
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length >= 2) {
      setIsOpen(true);
      setShowResults(true);
    } else {
      setShowResults(false);
      setIsOpen(false);
    }
  };

  const handlePlaceClick = (place: Place) => {
    setQuery(''); // Clear search
    setShowResults(false);
    setIsOpen(false);
    onPlaceSelect?.(place);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (query.length >= 2 && results.length > 0) {
      setShowResults(true);
    }
  };

  const getPlaceName = (place: Place): string => {
    return locale === 'ar' ? place.name_ar : place.name_en;
  };

  const getLocationString = (place: Place): string => {
    const governateName = place.governate 
      ? (locale === 'ar' ? place.governate.name_ar : place.governate.name_en)
      : '';
    const wilayahName = place.wilayah 
      ? (locale === 'ar' ? place.wilayah.name_ar : place.wilayah.name_en)
      : '';

    return [governateName, wilayahName]
      .filter(Boolean)
      .join(' | ') || t('sultanateOman');
  };

  const getCategoryText = (place: Place): string => {
    if (place.categories && place.categories.length > 0) {
      return locale === 'ar' ? place.categories[0].name_ar : place.categories[0].name_en;
    }
    if (place.category) {
      return locale === 'ar' ? place.category.name_ar : place.category.name_en;
    }
    return '';
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder || (locale === 'ar' ? 'البحث عن الأماكن...' : 'Search places...')}
          className={`w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            isOpen ? 'rounded-b-none border-b-0' : ''
          }`}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-10 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 rounded-b-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">{locale === 'ar' ? 'جاري البحث...' : 'Searching...'}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">
                {locale === 'ar' ? 'لم يتم العثور على نتائج' : 'No places found'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handlePlaceClick(place)}
                  className={`w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    locale === 'ar' ? 'text-right' : 'text-left'
                  }`}
                >
                  {/* Place Image or Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {place.primary_image || (place.images && place.images.length > 0) ? (
                      <img
                        src={place.primary_image || place.images?.[0]?.image_url}
                        alt={getPlaceName(place)}
                        className="w-10 h-10 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Place Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getPlaceName(place)}
                      </h3>
                      <span className="text-xs text-orange-600 font-medium">
                        {getCategoryText(place)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-500 truncate">
                        {getLocationString(place)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}