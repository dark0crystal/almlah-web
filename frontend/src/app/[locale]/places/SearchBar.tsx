"use client"
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
}

export default function SearchBar({ 
  onSearch, 
  initialQuery = "", 
  placeholder 
}: SearchBarProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch(""); // Trigger search with empty query to reset results
  };

  const defaultPlaceholder = locale === 'ar' 
    ? 'ابحث عن الأماكن...' 
    : 'Search for places...';

  return (
    <div className={`w-full h-14 rounded-3xl border bg-white mb-4 px-4 flex items-center transition-all ${
      isFocused ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-200"
    } ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
      <Search className={`w-5 h-5 text-gray-400 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || defaultPlaceholder}
        className={`flex-1 h-full outline-none text-gray-700 placeholder-gray-400 ${
          locale === 'ar' ? 'text-right' : 'text-left'
        }`}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      />
      {query && (
        <button
          onClick={handleClear}
          className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${locale === 'ar' ? 'mr-2' : 'ml-2'}`}
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      )}
    </div>
  );
}