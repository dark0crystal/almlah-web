"use client"

import { useTranslations } from 'next-intl';

interface RecommendationsFooterProps {
  locale: string;
}

export default function RecommendationsFooter({ locale }: RecommendationsFooterProps) {
  const t = useTranslations('recommendations');

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h3 className="text-2xl md:text-3xl font-bold mb-4">
          {t('discoverMore')}
        </h3>
        <p className="text-lg mb-6 opacity-90">
          {t('discoverSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`/${locale}/places`}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {t('allPlaces')}
          </a>
          <a
            href={`/${locale}/restaurants`}
            className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
          >
            {t('restaurants')}
          </a>
        </div>
      </div>
    </div>
  );
}