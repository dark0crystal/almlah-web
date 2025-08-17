// PostCardsWrapper.tsx - Updated with horizontal scrolling
"use client"
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from './PostCard';
import { fetchRecentPlaces, transformRecentPlacesToPlaces, formatRelativeTime } from '../../../services/placesApi';
import { Place } from '@/types';

// Enhanced interface for our post data with API integration
interface PostData {
  id: string;
  title: string;
  description?: string;
  image?: string;
  author?: string;
  date?: string;
  category?: string;
  isNew?: boolean;
  slug?: string;
  place?: Place; // Store the original place data
}

interface PostCardsWrapperProps {
  title?: string;
  initialLimit?: number;
  language?: 'ar' | 'en';
  categoryId?: string;
  governateId?: string;
  wilayahId?: string;
  type?: 'recent' | 'category' | 'location';
}

export default function PostCardsWrapper({
  title = "أحدث المقالات",
  initialLimit = 6,
  language = 'ar',
  categoryId,
  governateId,
  wilayahId,
  type = 'recent'
}: PostCardsWrapperProps) {
  
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPlacesCount, setNewPlacesCount] = useState(0);
  const [hasFallback, setHasFallback] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [lastScrollLeft, setLastScrollLeft] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /**
   * Convert Place data to PostData format
   */
  const convertPlaceToPost = (place: Place & { isNew?: boolean }): PostData => {
    const isNew = place.isNew ?? false;
    const relativeDate = place.created_at ? formatRelativeTime(place.created_at, language) : '';
    
    // Get the first category name
    const categoryName = place.categories && place.categories.length > 0 
      ? (language === 'ar' ? place.categories[0].name_ar : place.categories[0].name_en)
      : '';

    // Create author name from governate or wilayah
    const authorName = language === 'ar' 
      ? (place.governate?.name_ar || place.wilayah?.name_ar || 'مجهول')
      : (place.governate?.name_en || place.wilayah?.name_en || 'Unknown');

    return {
      id: place.id,
      title: language === 'ar' ? place.name_ar : place.name_en,
      description: language === 'ar' ? place.subtitle_ar : place.subtitle_en,
      image: place.primary_image || (place.images && place.images.length > 0 ? place.images[0].image_url : ''),
      author: authorName,
      date: relativeDate,
      category: categoryName,
      isNew,
      slug: `place-${place.id}`,
      place: place
    };
  };

  /**
   * Fetch places from API using the new recent places endpoint
   */
  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching recent places...');
      
      // Use the optimized recent places endpoint
      const response = await fetchRecentPlaces(
        20, // limit
        6,  // minCount
        true, // fallback
        true  // includeStats
      );

      console.log('Recent places response:', response);

      // Transform to our format
      const transformedPlaces = transformRecentPlacesToPlaces(response.places);
      const convertedPosts = transformedPlaces.map(convertPlaceToPost);
      
      setPosts(convertedPosts);
      setNewPlacesCount(response.new_count);
      setHasFallback(response.has_fallback);

      console.log(`✅ Successfully fetched ${convertedPosts.length} places`);
      console.log(`📍 ${response.new_count} places are marked as "new"`);
      if (response.has_fallback) {
        console.log('🔄 Fallback was used to reach minimum count');
      }

    } catch (err) {
      console.error('❌ Error fetching places:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check scroll position and update button states
   */
  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;
    
    setCanScrollLeft(scrollLeft > 5); // 5px threshold
    setCanScrollRight(scrollLeft < maxScrollLeft - 5); // 5px threshold
  };

  /**
   * Scroll left
   */
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 300; // Approximate card width + gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    
    container.scrollTo({
      left: Math.max(0, container.scrollLeft - scrollAmount),
      behavior: 'smooth'
    });
  };

  /**
   * Scroll right
   */
  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 300; // Approximate card width + gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    
    container.scrollTo({
      left: Math.min(maxScrollLeft, container.scrollLeft + scrollAmount),
      behavior: 'smooth'
    });
  };

  /**
   * Mouse drag functionality
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsDragging(true);
    setDragStart({
      x: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft
    });
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      const container = scrollContainerRef.current;
      if (container) {
        container.style.cursor = 'grab';
        container.style.userSelect = 'auto';
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const container = scrollContainerRef.current;
    if (container) {
      container.style.cursor = 'grab';
      container.style.userSelect = 'auto';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const container = scrollContainerRef.current;
    if (!container) return;

    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragStart.x) * 2; // Scroll speed multiplier
    container.scrollLeft = dragStart.scrollLeft - walk;
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPlaces();
  }, [categoryId, governateId, language]);

  // Set up scroll event listener and mouse events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    const timeoutId = setTimeout(checkScrollButtons, 100);
    
    // Event listeners
    container.addEventListener('scroll', checkScrollButtons);
    window.addEventListener('resize', checkScrollButtons);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [posts, isDragging]);

  const handlePostClick = (post: PostData) => {
    console.log(`🔗 Navigating to place: ${post.title} (ID: ${post.id})`);
    
    if (post.place?.id) {
      // Navigate to place details page
      router.push(`/places/${post.place.id}`);
    } else {
      console.warn('⚠️ No place ID found for navigation');
    }
  };

  const handleRetry = () => {
    fetchPlaces();
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8" data-posts-wrapper>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        
        {/* Loading skeleton */}
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex-none w-64 aspect-square bg-gray-200 rounded-2xl animate-pulse"
            >
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8" data-posts-wrapper>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8" data-posts-wrapper>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد أماكن متاحة' : 'No places available'}
          </h3>
          <p className="text-gray-600">
            {language === 'ar' 
              ? 'لم يتم العثور على أي أماكن تطابق المعايير المحددة' 
              : 'No places found matching the specified criteria'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8" data-posts-wrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {newPlacesCount > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              {language === 'ar' 
                ? `${newPlacesCount} أماكن جديدة مضافة هذا الأسبوع`
                : `${newPlacesCount} new places added this week`
              }
            </p>
          )}
          {hasFallback && (
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ar' 
                ? 'تم عرض أماكن إضافية لإكمال القائمة'
                : 'Additional places shown to complete the list'
              }
            </p>
          )}
        </div>
        
        {/* Navigation Buttons */}
        {posts.length > 3 && (
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`
                p-2 rounded-full border border-gray-300 transition-all duration-200
                ${canScrollLeft 
                  ? 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm hover:shadow-md' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label={language === 'ar' ? 'التمرير يساراً' : 'Scroll left'}
            >
              <svg 
                className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </button>
            
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`
                p-2 rounded-full border border-gray-300 transition-all duration-200
                ${canScrollRight 
                  ? 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm hover:shadow-md' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label={language === 'ar' ? 'التمرير يميناً' : 'Scroll right'}
            >
              <svg 
                className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Posts Count Indicator */}
      <div className="mb-4 text-sm text-gray-600">
        {language === 'ar' 
          ? `${posts.length} مكان متاح`
          : `${posts.length} places available`
        }
      </div>
      
      {/* Scrollable Posts Container */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide py-4 px-4 cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
            margin: '0 -1rem', // Negative margin to compensate for horizontal padding
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex-none w-64 sm:w-72 md:w-80"
              style={{ 
                pointerEvents: isDragging ? 'none' : 'auto' 
              }}
            >
              <PostCard
                title={post.title}
                description={post.description}
                image={post.image}
                author={post.author}
                date={post.date}
                category={post.category}
                isNew={post.isNew}
                onClick={() => !isDragging && handlePostClick(post)}
              />
            </div>
          ))}
        </div>

        {/* Scroll Indicators (optional - subtle gradient overlays) */}
        {posts.length > 3 && (
          <>
            {canScrollLeft && (
              <div 
                className={`
                  absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent 
                  pointer-events-none z-10
                  ${language === 'ar' ? 'hidden' : ''}
                `} 
              />
            )}
            
            {canScrollRight && (
              <div 
                className={`
                  absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent 
                  pointer-events-none z-10
                  ${language === 'ar' ? 'hidden' : ''}
                `} 
              />
            )}
          </>
        )}
      </div>

      {/* Scroll Hint for Mobile */}
      {posts.length > 1 && (
        <div className="flex justify-center mt-4 sm:hidden">
          <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            {language === 'ar' ? 'اسحب للتصفح' : 'Swipe to browse'}
          </div>
        </div>
      )}

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
          <strong>Debug Info:</strong><br />
          Total places: {posts.length} | 
          New places: {newPlacesCount} | 
          Language: {language} |
          Type: {type} |
          Has Fallback: {hasFallback ? 'Yes' : 'No'} |
          Can Scroll Left: {canScrollLeft ? 'Yes' : 'No'} |
          Can Scroll Right: {canScrollRight ? 'Yes' : 'No'}
          {categoryId && ` | Category: ${categoryId}`}
          {governateId && ` | Governate: ${governateId}`}
          {wilayahId && ` | Wilayah: ${wilayahId}`}
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}