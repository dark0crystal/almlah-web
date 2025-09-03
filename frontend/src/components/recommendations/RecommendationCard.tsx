'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import { RecommendationItem } from '@/data/recommendationsData';

interface RecommendationCardProps {
  recommendation: RecommendationItem;
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const locale = useLocale() as 'ar' | 'en';
  
  return (
    <div className="flex-shrink-0 w-80 h-56 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer p-2">
      <div className="h-full w-full rounded-3xl overflow-hidden flex flex-col">
        <div className="relative flex-1 overflow-hidden rounded-3xl">
          <Image
            src={recommendation.image}
            alt={locale === 'ar' ? recommendation.name_ar : recommendation.name_en}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Text overlay at bottom */}
          <div className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} p-3 max-w-[80%]`}>
            <h3 className="font-bold text-white text-xl mb-1 leading-tight drop-shadow-lg truncate">
              {locale === 'ar' ? recommendation.name_ar : recommendation.name_en}
            </h3>
            <p className="text-white text-lg drop-shadow-lg truncate">
              📍 {locale === 'ar' ? recommendation.location_ar : recommendation.location_en}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}