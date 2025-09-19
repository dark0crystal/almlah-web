// CategoryCardsWrapper.tsx
"use client"
import { useRouter } from 'next/navigation';
import CategoryCard from './CategoryCard';
import { categoriesData } from './staticCategoryData';

interface CategoryCardsWrapperProps {
  title?: string;
}

export default function CategoryCardsWrapper({ 
  title = "الفئات"
}: CategoryCardsWrapperProps) {
  
  const router = useRouter();
  
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

  return (
    <div className="py-8" style={{ width: '88vw' }} data-categories-wrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {categoriesData.map((category, index) => (
          <div key={`${category.slug || category.title}-${index}`}>
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
    </div>
  );
}