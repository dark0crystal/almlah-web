// src/components/SearchBar.tsx
"use client"
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function SearchBar({ onSearch, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch(""); // Trigger search with empty query to reset results
  };

  return (
    <div className={`w-full h-14 rounded-3xl border bg-white mb-4 px-4 flex items-center transition-all ${
      isFocused ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-200"
    }`}>
      <Search className="w-5 h-5 text-gray-400 mr-2" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search for places..."
        className="flex-1 h-full outline-none text-gray-700 placeholder-gray-400"
      />
      {query && (
        <button
          onClick={handleClear}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      )}
    </div>
  );
}