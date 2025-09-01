"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import PlaceCard from "@/app/[locale]/places/PlaceCard";
import { fetchRecommendations } from "@/services/recommendationsApi";
import { Place } from "@/types";
import { RecommendationSection as RecommendationSectionType } from "../config/recommendationSections";

interface RecommendationSectionProps {
  section: RecommendationSectionType;
  locale: string;
  index: number;
  isLast: boolean;
}

export default function RecommendationSection({ 
  section, 
  locale, 
  index, 
  isLast 
}: RecommendationSectionProps) {
  const t = useTranslations('recommendations');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch places for this section
  useEffect(() => {
    const fetchSectionRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const recommendations = await fetchRecommendations(section.category, {
          type: section.type,
          limit: 5
        });
        
        setPlaces(recommendations);
      } catch (err) {
        console.error(`Error fetching ${section.category} recommendations:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        setPlaces([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchSectionRecommendations();
  }, [section.category, section.type]);

  return (
    <article className="mb-16">
      {/* Section header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{section.icon}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {locale === 'ar' ? section.titleAr : section.title}
          </h2>
        </div>
        <p className="text-lg text-gray-600 leading-relaxed">
          {locale === 'ar' ? section.descriptionAr : section.description}
        </p>
      </div>

      {/* Section image */}
      <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-6">
        <Image
          src={section.image}
          alt={locale === 'ar' ? section.titleAr : section.title}
          fill
          className="object-cover"
          onError={(e) => {
            // Fallback to gradient background
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentNode) {
              (target.parentNode as HTMLElement).style.background = 
                `linear-gradient(135deg, ${section.gradient.replace('from-', '').replace(' to-', ', ')})`;
            }
          }}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex h-36">
                  <div className="w-2/5 h-full bg-gray-200 rounded-2xl"></div>
                  <div className="flex-1 pl-4 flex flex-col justify-center">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-red-800 mb-2">
            {t('error.loadingRecommendations')}
          </h4>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Places list */}
      {!loading && !error && (
        <div className="space-y-6">
          {places.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {t('recommendedPlaces')}
                </h3>
                <a
                  href={`/${locale}/recommendations/${section.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
                >
                  {t('viewMore')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                  </svg>
                </a>
              </div>
              
              <div className="grid gap-6">
                {places.map((place, placeIndex) => (
                  <div 
                    key={place.id} 
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300"
                    style={{
                      animationDelay: `${placeIndex * 100}ms`
                    }}
                  >
                    <PlaceCard
                      place={place}
                      locale={locale}
                      isSelected={false}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="text-gray-400 mb-4 text-6xl">
                {section.icon}
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {t('comingSoon')}
              </h4>
              <p className="text-gray-600 mb-4">
                {t('noRecommendationsMessage', { 
                  category: locale === 'ar' ? section.titleAr.toLowerCase() : section.title.toLowerCase()
                })}
              </p>
              <a
                href={`/${locale}/recommendations/${section.id}`}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                {t('notifyWhenAdded')}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Separator (except for last item) */}
      {!isLast && (
        <div className="border-t border-gray-200 mt-12 pt-4">
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
        </div>
      )}
    </article>
  );
}