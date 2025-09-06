"use client";
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MapPin, Building, ArrowLeft, Share2 } from 'lucide-react';
import Image from 'next/image';
import GovernateImagesContainer from "./GovernateImagesContainer";
import GovernateLoadingSkeleton from "./GovernateLoadingSkeleton";
import GovernateErrorComponent from "./GovernateErrorComponent";
import PostCardsWrapper from "@/components/cards/postCards/PostCardWrapper";
import WilayahCardsWrapper from "./WilayahCardsWrapper";
import Footer from '@/components/Footer';
import { fetchGovernateById, fetchGovernateWilayahs, GovernateDetails, SimpleWilayah } from '@/services/governateApi';
import sepnakhlah from "../../../../../public/seperators/sepnakhlah.png";
import { GovernateDetailsProps } from '../types';

export default function GovernateDetailsPage({ params }: GovernateDetailsProps) {
  const [governate, setGovernate] = useState<GovernateDetails | null>(null);
  const [wilayahs, setWilayahs] = useState<SimpleWilayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [governateId, setGovernateId] = useState<string>('');
  
  // Get current locale and translations
  const locale = useLocale() as 'ar' | 'en';
  const t = useTranslations('governate');
  const tNav = useTranslations('navigation');
  
  // Get router
  const router = useRouter();
  
  // Extract governate ID from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setGovernateId(resolvedParams['destination-id']);
    };
    getParams();
  }, [params]);
  
  console.log('GovernateDetails - governateId:', governateId);
  console.log('GovernateDetails - locale:', locale);

  // Load governate function - wrapped in useCallback to prevent unnecessary re-renders
  const loadGovernate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading governate data for ID:', governateId);
      
      // Fetch governate details
      const governateData = await fetchGovernateById(governateId);
      
      if (!governateData) {
        setError(t('error.notFound'));
        return;
      }
      
      setGovernate(governateData);
      console.log('Governate loaded successfully:', governateData);
      
      // Fetch wilayahs for this governate
      try {
        const wilayahsData = await fetchGovernateWilayahs(governateId);
        setWilayahs(wilayahsData);
        console.log('Wilayahs loaded:', wilayahsData);
      } catch (wilayahError) {
        console.warn('Could not load wilayahs:', wilayahError);
        // Don't fail the whole page if wilayahs can't be loaded
      }
      
    } catch (err) {
      console.error('Error loading governate:', err);
      setError(err instanceof Error ? err.message : t('error.generalDescription'));
    } finally {
      setLoading(false);
    }
  }, [governateId, t]);

  // Load governate data when component mounts
  useEffect(() => {
    if (!governateId) {
      // Don't show error immediately, wait for params to resolve
      return;
    }

    loadGovernate();
  }, [governateId, t, loadGovernate]);

  // Update page title
  useEffect(() => {
    if (governate) {
      const governateName = locale === 'ar' ? governate.name_ar : governate.name_en;
      document.title = `${governateName} - ${t('title')}`;
    }
  }, [governate, locale, t]);

  // Handle share functionality - Copy URL to clipboard
  const handleShare = async () => {
    const currentUrl = window.location.href;
    
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert(locale === 'ar' ? 'تم نسخ الرابط!' : 'URL copied!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert(locale === 'ar' ? 'تم نسخ الرابط!' : 'URL copied!');
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };


  // Handle retry
  const handleRetry = () => {
    loadGovernate();
  };

  // Handle go back
  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <GovernateLoadingSkeleton 
        language={locale} 
        showProgress={true}
        loadingText={t('loading.governateData')}
      />
    );
  }

  if (error) {
    return (
      <GovernateErrorComponent
        error={error}
        language={locale}
        onRetry={handleRetry}
        onGoBack={handleGoBack}
        showRetry={true}
        showGoBack={true}
      />
    );
  }

  if (!governate) {
    return (
      <GovernateErrorComponent
        error={t('error.notFound')}
        language={locale}
        onGoBack={handleGoBack}
        showRetry={false}
        showGoBack={true}
      />
    );
  }

  // Get localized content
  const governateName = locale === 'ar' ? governate.name_ar : governate.name_en;
  const governateSubtitle = locale === 'ar' ? governate.subtitle_ar : governate.subtitle_en;
  const governateDescription = locale === 'ar' ? governate.description_ar : governate.description_en;

  console.log('Rendering governate with complete data:', {
    id: governate.id,
    names: { ar: governate.name_ar, en: governate.name_en },
    imagesCount: governate.images?.length || 0,
    wilayahsCount: wilayahs.length
  });

  return (
    <div className="text-black">
      {/* Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={tNav('goBack')}
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <nav className="text-sm text-gray-600">
              <span className="hover:text-gray-900 transition-colors">
                {tNav('destinations')}
              </span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{governateName}</span>
            </nav>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={t('actions.share')}
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Title & Description */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{governateName}</h1>
          
          {governateSubtitle && (
            <p className="text-xl text-blue-600 font-medium mb-4">
              {governateSubtitle}
            </p>
          )}
          
          {/* Statistics */}
          <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-gray-600">
            {governate.wilayah_count > 0 && (
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                <span>
                  {governate.wilayah_count} {governate.wilayah_count === 1 ? t('counters.wilayah') : t('counters.wilayahs')}
                </span>
              </div>
            )}
            
            {governate.place_count > 0 && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>
                  {governate.place_count} {governate.place_count === 1 ? t('counters.place') : t('counters.places')}
                </span>
              </div>
            )}
            
            {governate.latitude && governate.longitude && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>
                  {governate.latitude.toFixed(4)}, {governate.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Full Width */}
        <div className="w-full">
          {/* Image Gallery */}
          <GovernateImagesContainer 
            images={governate.images || []} 
            governateName={governateName}
            language={locale}
          />
          
          {/* About Section */}
          {governateDescription && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('about')}
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {governateDescription}
                </p>
                
                {/* Separator */}
                <div className="h-[55px] rounded-lg mt-6 relative overflow-hidden flex items-center justify-between not-prose" style={{ backgroundColor: '#fce7a1b3' }}>
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundSize: '4px 4px'
                    }}
                  />
                  <span className="text-amber-800 font-medium text-sm md:text-base mx-4 relative z-10">
                    {t('separatorText')}
                  </span>
                  <Image 
                    src={sepnakhlah} 
                    alt="Camel decoration" 
                    width={48}
                    height={48}
                    className="h-8 md:h-12 w-auto ml-2 relative z-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wilayahs Section - Full Width */}
          {wilayahs && wilayahs.length > 0 && (
            <div className="mt-12">
              <WilayahCardsWrapper 
                wilayahs={wilayahs}
                governateName={governateName}
              />
            </div>
          )}

          {/* Places to Visit Section */}
          <div className="mt-12">
            <PostCardsWrapper 
              governateId={governate.id}
              title={locale === 'ar' ? 'الأماكن المراد زيارتها' : 'Places to Visit'}
              language={locale}
            />
          </div>
        </div>
        
        {/* Extra spacing */}
        <div className="h-20" />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}