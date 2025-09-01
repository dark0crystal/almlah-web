"use client"

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RecommendationSection } from "../config/recommendationSections";

interface CategoryCardProps {
  category: RecommendationSection;
  locale: string;
}

export default function CategoryCard({ category, locale }: CategoryCardProps) {
  const router = useRouter();
  const t = useTranslations('recommendations');

  const handleCardClick = () => {
    router.push(`/${locale}/recommendations/${category.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
    >
      {/* Card Image */}
      <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden">
        <Image
          src={category.image}
          alt={locale === 'ar' ? category.titleAr : category.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            // Fallback to gradient background
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentNode) {
              (target.parentNode as HTMLElement).style.background = 
                `linear-gradient(135deg, ${category.gradient.replace('from-', '').replace(' to-', ', ')})`;
            }
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Icon overlay */}
        <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl">
          {category.icon}
        </div>
        
        {/* Featured badge */}
        <div className="absolute top-4 left-4">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
              {category.type === 'featured' && t('tabs.featured')}
              {category.type === 'top_rated' && t('tabs.topRated')}
              {category.type === 'recent' && t('tabs.recent')}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className={`p-6 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
          {t(`categories.${category.id}.title`)}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-3 mb-4">
          {t(`categories.${category.id}.description`)}
        </p>
        
        {/* Action Button */}
        <div className={`flex items-center ${locale === 'ar' ? 'justify-start' : 'justify-end'} group-hover:translate-x-1 transition-transform duration-200`}>
          <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
            <span>{t('categories.explore')}</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${locale === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}