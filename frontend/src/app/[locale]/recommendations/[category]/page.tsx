"use client"

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star, Clock } from "lucide-react";
import PlaceCard from "@/app/[locale]/places/PlaceCard";
import { fetchRecommendations, RecommendationType } from "@/services/recommendationsApi";
import { Place } from "@/types";

import { getRecommendationSection } from "../config/recommendationSections";

export default function RecommendationCategoryPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const category = params?.category as string;
  const t = useTranslations('recommendations');
  
  const [activeTab, setActiveTab] = useState<RecommendationType>('featured');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);

  // Validate category using centralized configuration
  const config = getRecommendationSection(category);
  
  if (!config) {
    notFound();
  }

  // Fetch recommendations based on active tab
  useEffect(() => {
    const fetchCategoryRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const recommendations = await fetchRecommendations(category, {
          type: activeTab,
          limit: 10
        });
        
        setPlaces(recommendations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryRecommendations();
  }, [category, activeTab]);

  const tabs: { key: RecommendationType; label: string; icon: React.ReactNode }[] = [
    {
      key: 'featured',
      label: t('tabs.featured'),
      icon: <Star className="w-4 h-4" />
    },
    {
      key: 'top_rated',
      label: t('tabs.topRated'),
      icon: <Star className="w-4 h-4 fill-current" />
    },
    {
      key: 'recent',
      label: t('tabs.recent'),
      icon: <Clock className="w-4 h-4" />
    }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={config.image}
            alt={locale === 'ar' ? config.titleAr : config.title}
            fill
            className="object-cover"
            priority
            onError={(e) => {
              // Fallback to gradient background
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentNode) {
                (target.parentNode as HTMLElement).style.background = 
                  `linear-gradient(135deg, ${config.gradient.replace('from-', '').replace('to-', ', ')})`;
              }
            }}
          />
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Content */}
        <div className="relative h-full flex items-center">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <div className="text-6xl mb-4">{config.icon}</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {locale === 'ar' ? config.titleAr : config.title}
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed opacity-90">
              {locale === 'ar' ? config.descriptionAr : config.description}
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="absolute bottom-4 left-4">
          <nav className="flex items-center space-x-2 text-white text-sm">
            <a href={`/${locale}`} className="hover:underline opacity-75">
              {t('breadcrumb.home')}
            </a>
            {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <a href={`/${locale}/recommendations`} className="hover:underline opacity-75">
              {t('breadcrumb.recommendations')}
            </a>
            {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-medium">
              {locale === 'ar' ? config.titleAr : config.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200
                  ${activeTab === tab.key
                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('error.title')}
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {t('error.tryAgain')}
            </button>
          </div>
        )}

        {/* Places Grid */}
        {!loading && !error && (
          <>
            {places.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {places.map((place, index) => (
                  <div 
                    key={place.id} 
                    className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    style={{
                      animationDelay: `${index * 100}ms`
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
            ) : (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-6">
                  <svg className="mx-auto h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {t('noRecommendations')}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {t('noRecommendationsMessage', {
                    category: locale === 'ar' ? config.titleAr : config.title.toLowerCase()
                  })}
                </p>
                <div className="flex gap-4 justify-center">
                  <a
                    href={`/${locale}/recommendations`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {t('viewAllRecommendations')}
                  </a>
                  <a
                    href={`/${locale}/places`}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {t('browsePlaces')}
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}