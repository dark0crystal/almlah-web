// PostCardsWrapper.tsx
"use client"
import { useState } from 'react';
import PostCard from './PostCard';

// Sample post data interface
interface PostData {
  id: number;
  title: string;
  description?: string;
  image?: string;
  author?: string;
  date?: string;
  category?: string;
  isNew?: boolean;
  slug?: string;
}

// Sample posts data
const samplePostsData: PostData[] = [
  {
    id: 1,
    title: "أفضل الوجهات السياحية في الرياض لعام 2025",
    description: "اكتشف أجمل الأماكن والمعالم السياحية الجديدة في العاصمة السعودية",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
    author: "أحمد محمد",
    date: "منذ يومين",
    category: "سياحة",
    isNew: true,
    slug: "riyadh-tourism-2025"
  },
  {
    id: 2,
    title: "دليل شامل للمطاعم الجديدة في جدة",
    description: "تعرف على أحدث المطاعم والكافيهات التي افتتحت مؤخراً في مدينة جدة",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop",
    author: "سارة أحمد",
    date: "منذ 3 أيام",
    category: "طعام",
    isNew: true,
    slug: "jeddah-restaurants-guide"
  },
  {
    id: 3,
    title: "نصائح للتسوق في مولات الرياض الجديدة",
    description: "كل ما تحتاج معرفته عن مراكز التسوق الحديثة في الرياض",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop",
    author: "محمد علي",
    date: "منذ أسبوع",
    category: "تسوق",
    isNew: false,
    slug: "riyadh-shopping-malls"
  },
  {
    id: 4,
    title: "فعاليات ترفيهية جديدة في الدمام",
    description: "اكتشف أحدث الأنشطة والفعاليات الترفيهية المتاحة في مدينة الدمام",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=400&fit=crop",
    author: "فاطمة خالد",
    date: "منذ أسبوع",
    category: "ترفيه",
    isNew: true,
    slug: "dammam-entertainment"
  },
  {
    id: 5,
    title: "أفضل النشاطات الخارجية في أبها",
    description: "دليل كامل للأنشطة الخارجية والطبيعية في مدينة أبها",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
    author: "خالد عبدالله",
    date: "منذ أسبوعين",
    category: "طبيعة",
    isNew: false,
    slug: "abha-outdoor-activities"
  },
  {
    id: 6,
    title: "مراجعة شاملة لكافيهات الرياض الجديدة",
    description: "استكشف أجمل الكافيهات التي افتتحت حديثاً في الرياض",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop",
    author: "نورا سعد",
    date: "منذ 3 أسابيع",
    category: "كافيهات",
    isNew: true,
    slug: "riyadh-new-cafes"
  },
  {
    id: 7,
    title: "أجمل الشواطئ في المملكة العربية السعودية",
    description: "اكتشف أروع الشواطئ على البحر الأحمر والخليج العربي",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop",
    author: "عبدالرحمن سالم",
    date: "منذ شهر",
    category: "سياحة",
    isNew: false,
    slug: "saudi-beaches"
  },
  {
    id: 8,
    title: "تكنولوجيا الذكاء الاصطناعي في السعودية",
    description: "كيف تستخدم المملكة التكنولوجيا الحديثة في رؤية 2030",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop",
    author: "د. مشعل الحربي",
    date: "منذ شهر",
    category: "تكنولوجيا",
    isNew: true,
    slug: "ai-saudi-arabia"
  }
];

interface PostCardsWrapperProps {
  title?: string;
  initialLimit?: number;
}

export default function PostCardsWrapper({
  title = "أحدث المقالات",
  initialLimit = 4
}: PostCardsWrapperProps) {
  
  const [showAll, setShowAll] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Determine which posts to display
  const displayedPosts = showAll 
    ? samplePostsData 
    : samplePostsData.slice(0, initialLimit);
  
  // Check if there are more posts to show
  const hasMorePosts = samplePostsData.length > initialLimit;
  
  const handlePostClick = (post: PostData) => {
    console.log(`Clicked post: ${post.title}`);
    
    // Example navigation options:
    
    // Option 1: Using Next.js router
    // import { useRouter } from 'next/router';
    // const router = useRouter();
    // if (post.slug) router.push(`/post/${post.slug}`);
    
    // Option 2: Using React Router
    // import { useNavigate } from 'react-router-dom';
    // const navigate = useNavigate();
    // if (post.slug) navigate(`/post/${post.slug}`);
    
    // Option 3: Simple window location
    // if (post.slug) window.location.href = `/post/${post.slug}`;
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8" data-posts-wrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>
        
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
      
      {/* Posts Count Indicator */}
      {hasMorePosts && (
        <div className="mb-4 text-sm text-gray-600">
          عرض {displayedPosts.length} من {samplePostsData.length} مقال
        </div>
      )}
      
      {/* Posts Grid - Square layout */}
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

      {/* Loading indicator */}
      {isAnimating && (
        <div className="flex justify-center items-center mt-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}