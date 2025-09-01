"use client"

import Image from "next/image";
import { useTranslations } from 'next-intl';

interface RecommendationsHeroProps {
  locale: string;
}

export default function RecommendationsHero({ locale }: RecommendationsHeroProps) {
  const t = useTranslations('recommendations');

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Main title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Hero image */}
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <Image
            src="/recommendations-hero.jpg"
            alt={t('title')}
            fill
            className="object-cover"
            priority
            onError={(e) => {
              // Fallback to a gradient background if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentNode) {
                (target.parentNode as HTMLElement).style.background = 
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              }
            }}
          />
          {/* Overlay text on hero image */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {t('heroTitle')}
              </h2>
              <p className="text-lg">
                {t('heroSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}