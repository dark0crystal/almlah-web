'use client';

import { useTranslations, useLocale } from 'next-intl';
import { RECOMMENDATIONS_DATA } from '@/data/recommendationsData';
import RecommendationCard from './RecommendationCard';

export default function RecommendationsCarousel() {
  const t = useTranslations('HomePage');
  const locale = useLocale() as 'ar' | 'en';
  
  return (
    <section className="w-[88vw]">
      {/* Section Header */}
      <div className={`mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {locale === 'ar' ? 'قوائـم الـمـلاح' : 'Discover Amazing Places'}
        </h2>
      </div>

      {/* Horizontal Scrolling Cards */}
      <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
        <div className="flex gap-6 px-2">
          {RECOMMENDATIONS_DATA.map((recommendation) => (
            <RecommendationCard 
              key={recommendation.id} 
              recommendation={recommendation}
            />
          ))}
        </div>
      </div>

      {/* Scroll Hint */}
      <div className="text-center mt-6">
        <p className="text-gray-500 text-sm">
          ← Scroll for more →
        </p>
      </div>
    </section>
  );
}