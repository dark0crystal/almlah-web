"use client"
import CategoryCard from './CategoryCard';
import { categoriesData } from './staticCategoryData';

interface CategoryCardsWrapperProps {
  title?: string;
}

export default function CategoryCardsWrapper({ 
  title = "الفئات" 
}: CategoryCardsWrapperProps) {
  
  const handleCategoryClick = (categoryTitle: string, slug?: string) => {
    console.log(`Clicked category: ${categoryTitle}`);
    
    // Example navigation options:
    
    // Option 1: Using Next.js router
    // import { useRouter } from 'next/router';
    // const router = useRouter();
    // if (slug) router.push(`/category/${slug}`);
    
    // Option 2: Using React Router
    // import { useNavigate } from 'react-router-dom';
    // const navigate = useNavigate();
    // if (slug) navigate(`/category/${slug}`);
    
    // Option 3: Simple window location
    // if (slug) window.location.href = `/category/${slug}`;
    
    // Option 4: Custom event
    // window.dispatchEvent(new CustomEvent('categoryClicked', { detail: { title: categoryTitle, slug } }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>
        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
          عرض المزيد
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {categoriesData.map((category, index) => (
          <CategoryCard
            key={index}
            title={category.title}
            subtitle={category.subtitle}
            icon={category.icon}
            bgColor={category.bgColor}
            textColor={category.textColor}
            onClick={() => handleCategoryClick(category.title, category.slug)}
          />
        ))}
      </div>
    </div>
  );
}
