// CategoryCardsWrapper.tsx
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CategoryCard from './CategoryCard';
import { categoriesData } from './staticCategoryData';

interface CategoryCardsWrapperProps {
  title?: string;
  initialLimit?: number; // Number of cards to show initially
}

export default function CategoryCardsWrapper({ 
  title = "الفئات",
  initialLimit = 6 // Show 6 cards initially (adjustable)
}: CategoryCardsWrapperProps) {
  
  const [showAll, setShowAll] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [responsiveLimit, setResponsiveLimit] = useState(initialLimit);
  const router = useRouter();
  
  // Calculate items per row based on screen size
  // const getItemsPerRow = () => {
  //   // On large screens (lg): 5 items per row
  //   // On medium screens (md): 3 items per row  
  //   // On small screens: 2 items per row
  //   return {
  //     lg: 5,
  //     md: 3,
  //     sm: 2
  //   };
  // };
  
  // For large screens, show only one row (5 items) initially
  const getInitialLimit = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 5; // lg breakpoint
      if (window.innerWidth >= 768) return 3;  // md breakpoint
      return 2; // sm and below
    }
    return initialLimit;
  }, [initialLimit]);
  
  // Update responsive limit on mount and resize
  useEffect(() => {
    const updateLimit = () => {
      setResponsiveLimit(getInitialLimit());
    };
    
    updateLimit(); // Set initial limit
    window.addEventListener('resize', updateLimit);
    
    return () => window.removeEventListener('resize', updateLimit);
  }, [getInitialLimit]);
  
  // Determine which categories to display
  const displayedCategories = showAll 
    ? categoriesData 
    : categoriesData.slice(0, responsiveLimit);
  
  // Check if there are more categories to show
  const hasMoreCategories = categoriesData.length > responsiveLimit;
  
  const handleCategoryClick = (categoryTitle: string, slug?: string) => {
    console.log(`Clicked category: ${categoryTitle}`);
    
    // Navigate to places page with category filter
    if (slug) {
      // Option 1: Navigate to places page with category as query parameter
      router.push(`/places?category=${slug}`);
      
      // Option 2: Navigate to dedicated category page that shows places
      // router.push(`/places/category/${slug}`);
      
      // Option 3: Navigate to places page with category in the path
      // router.push(`/places/${slug}`);
    } else {
      // Fallback: navigate to general places page
      router.push('/places');
    }
  };

  const handleShowMore = () => {
    setIsAnimating(true);
    setShowAll(true);
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleShowLess = () => {
    setIsAnimating(true);
    setShowAll(false);
    
    // Reset animation state and scroll to top of section
    setTimeout(() => {
      setIsAnimating(false);
      // Optional: Scroll to top of the section
      // document.querySelector('[data-categories-wrapper]')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  return (
    <div className="py-8" style={{ width: '88vw' }} data-categories-wrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>
        
        {/* Show More/Less Button - Only show if there are more categories */}
        {hasMoreCategories && (
          <button 
            onClick={showAll ? handleShowLess : handleShowMore}
            disabled={isAnimating}
            className={`
              text-blue-600 hover:text-blue-800 font-medium text-sm 
              flex items-center gap-1 transition-all duration-200
              ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:gap-2'}
            `}
          >
            {showAll ? 'عرض أقل' : 'عرض المزيد'}
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${
                showAll ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </button>
        )}
      </div>
      
      {/* Categories Count Indicator */}
      {hasMoreCategories && (
        <div className="mb-4 text-sm text-gray-600">
          عرض {displayedCategories.length} من {categoriesData.length} فئة
        </div>
      )}
      
      {/* Cards Grid */}
      <div 
        className={`
          grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6
          transition-all duration-300 ease-in-out
          ${isAnimating ? 'opacity-75 scale-98' : 'opacity-100 scale-100'}
        `}
      >
        {displayedCategories.map((category, index) => (
          <div
            key={`${category.slug || category.title}-${index}`}
            className={`
              transform transition-all duration-300 ease-out
              ${showAll && index >= responsiveLimit 
                ? 'animate-fadeInUp' 
                : ''
              }
            `}
            style={{
              animationDelay: showAll && index >= responsiveLimit 
                ? `${(index - responsiveLimit) * 50}ms` 
                : '0ms'
            }}
          >
            <CategoryCard
              title={category.title}
              subtitle={category.subtitle}
              icon={category.icon}
              bgColor={category.bgColor}
              bgImage={category.bgImage}
              textColor={category.textColor}
              slug={category.slug}
              href={category.href}
              onClick={() => handleCategoryClick(category.title, category.slug)}
            />
          </div>
        ))}
      </div>

      {/* Loading indicator for smooth UX */}
      {isAnimating && (
        <div className="flex justify-center items-center mt-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}