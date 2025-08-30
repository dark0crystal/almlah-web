"use client"
import { SlidersHorizontal } from "lucide-react";

interface FilterButtonProps {
  onClick: () => void;
  hasActiveFilters?: boolean;
  filterCount?: number;
  locale: string;
  className?: string;
}

export default function FilterButton({
  onClick,
  hasActiveFilters = false,
  filterCount = 0,
  locale,
  className = ""
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:scale-105 ${
        hasActiveFilters 
          ? 'border-blue-500 shadow-md' 
          : ''
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <SlidersHorizontal className={`w-5 h-5 ${
          hasActiveFilters ? 'text-blue-600' : 'text-gray-700'
        }`} />
        
        {/* Show filter count badge */}
        {hasActiveFilters && filterCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {filterCount}
          </div>
        )}
      </div>
    </button>
  );
}