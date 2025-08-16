// PostCardsWrapper.tsx - Updated with navigation to place details
"use client"
import { useEffect, useState } from 'react';
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
  const [showAll, setShowAll] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [newPlacesCount, setNewPlacesCount] = useState(0);
  const [hasFallback, setHasFallback] = useState(false);
  
  const router = useRouter();
  
  // Determine which posts to display
  const displayedPosts = showAll 
    ? posts 
    : posts.slice(0, initialLimit);
  
  // Check if there are more posts to show
  const hasMorePosts = posts.length > initialLimit;

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

  // Fetch data on component mount
  useEffect(() => {
    fetchPlaces();
  }, [categoryId, governateId, language]);

  const handlePostClick = (post: PostData) => {
    console.log(`🔗 Navigating to place: ${post.title} (ID: ${post.id})`);
    
    if (post.place?.id) {
      // Navigate to place details page
      router.push(`/places/${post.place.id}`);
    } else {
      console.warn('⚠️ No place ID found for navigation');
    }
  };

  const handleShowMore = () => {
    setIsAnimating(true);
    setShowAll(true);
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleShowLess = () => {
    setIsAnimating(true);
    setShowAll(false);
    
    setTimeout(() => {
      setIsAnimating(false);
      // Optional: Scroll to top of section
      // document.querySelector('[data-posts-wrapper]')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: initialLimit }).map((_, index) => (
            <div
              key={index}
              className="relative w-full aspect-square bg-gray-200 rounded-2xl animate-pulse"
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
        
        {/* Show More/Less Button */}
        {hasMorePosts && (
          <button 
            onClick={showAll ? handleShowLess : handleShowMore}
            disabled={isAnimating}
            className={`
              text-blue-600 hover:text-blue-800 font-medium text-sm 
              flex items-center gap-1 transition-all duration-200
              ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:gap-2'}
            `}
          >
            {showAll 
              ? (language === 'ar' ? 'عرض أقل' : 'Show Less')
              : (language === 'ar' ? 'عرض المزيد' : 'Show More')
            }
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
      
      {/* Posts Count Indicator */}
      {hasMorePosts && (
        <div className="mb-4 text-sm text-gray-600">
          {language === 'ar' 
            ? `عرض ${displayedPosts.length} من ${posts.length} مكان`
            : `Showing ${displayedPosts.length} of ${posts.length} places`
          }
        </div>
      )}
      
      {/* Posts Grid */}
      <div 
        className={`
          grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6
          transition-all duration-300 ease-in-out
          ${isAnimating ? 'opacity-75 scale-98' : 'opacity-100 scale-100'}
        `}
      >
        {displayedPosts.map((post, index) => (
          <div
            key={post.id}
            className={`
              transform transition-all duration-300 ease-out
              ${showAll && index >= initialLimit 
                ? 'animate-fadeInUp' 
                : ''
              }
            `}
            style={{
              animationDelay: showAll && index >= initialLimit 
                ? `${(index - initialLimit) * 100}ms` 
                : '0ms'
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
              onClick={() => handlePostClick(post)}
            />
          </div>
        ))}
      </div>

      {/* Loading indicator for animations */}
      {isAnimating && (
        <div className="flex justify-center items-center mt-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
          <strong>Debug Info:</strong><br />
          Total places: {posts.length} | 
          New places: {newPlacesCount} | 
          Displayed: {displayedPosts.length} | 
          Language: {language} |
          Type: {type} |
          Has Fallback: {hasFallback ? 'Yes' : 'No'}
          {categoryId && ` | Category: ${categoryId}`}
          {governateId && ` | Governate: ${governateId}`}
          {wilayahId && ` | Wilayah: ${wilayahId}`}
        </div>
      )}
    </div>
  );
}