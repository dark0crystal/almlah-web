"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MapPin, Users, Building, ArrowLeft, Share2, ExternalLink } from 'lucide-react';
import GovernateImagesContainer from "./GovernateImagesContainer";
import GovernateInfoSidebar from "./GovernateInfoSidebar";
import GovernateLoadingSkeleton from "./GovernateLoadingSkeleton";
import GovernateErrorComponent from "./GovernateErrorComponent";
import DestinationPlacesWrapper from "./DestinationPlacesWrapper";
import WilayahCardsWrapper from "./WilayahCardsWrapper";
import { fetchGovernateById, fetchGovernateWilayahs, GovernateDetails, SimpleWilayah } from '@/services/governateApi';

interface GovernateDetailsProps {
  params?: {
    'destination-id': string;
  };
}

export default function GovernateDetailsPage({ params }: GovernateDetailsProps) {
  const [governate, setGovernate] = useState<GovernateDetails | null>(null);
  const [wilayahs, setWilayahs] = useState<SimpleWilayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get current locale and translations
  const locale = useLocale() as 'ar' | 'en';
  const t = useTranslations('governate');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  
  // Get governate ID from params or URL
  const urlParams = useParams();
  const router = useRouter();
  
  // Extract governate ID - handle both cases
  const governateId = params?.['destination-id'] || urlParams?.['destination-id'] as string;
  
  console.log('GovernateDetails - governateId:', governateId);
  console.log('GovernateDetails - locale:', locale);

  // Load governate function
  const loadGovernate = async () => {
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
  };

  // Load governate data when component mounts
  useEffect(() => {
    if (!governateId) {
      console.error('No governate ID found in params');
      setError(t('error.idNotFound'));
      setLoading(false);
      return;
    }

    loadGovernate();
  }, [governateId, t]);

  // Update page title
  useEffect(() => {
    if (governate) {
      const governateName = locale === 'ar' ? governate.name_ar : governate.name_en;
      document.title = `${governateName} - ${t('title')}`;
    }
  }, [governate, locale, t]);

  // Handle share functionality
  const handleShare = async () => {
    if (!governate) return;
    
    const governateName = locale === 'ar' ? governate.name_ar : governate.name_en;
    const subtitle = locale === 'ar' ? governate.subtitle_ar : governate.subtitle_en;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: governateName,
          text: subtitle || `${locale === 'ar' ? 'استكشف محافظة' : 'Explore'} ${governateName}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert(locale === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  // Handle directions to governate
  const handleGetDirections = () => {
    if (governate && governate.latitude && governate.longitude) {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${governate.latitude},${governate.longitude}`;
      window.open(directionsUrl, '_blank');
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
    <div className="bg-white text-black">
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
            
            {governate.latitude && governate.longitude && (
              <button 
                onClick={handleGetDirections}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={t('actions.directions')}
              >
                <ExternalLink className="w-5 h-5 text-gray-600" />
              </button>
            )}
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
          
          {governateDescription && (
            <p className="text-lg text-gray-700">
              {governateDescription}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content - Images and Details */}
          <div className="lg:col-span-3">
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
                </div>
              </div>
            )}

            {/* Wilayahs Section */}
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
              <DestinationPlacesWrapper 
                governateId={governate.id}
                locale={locale}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <GovernateInfoSidebar 
              governate={governate} 
              wilayahs={wilayahs}
              language={locale}
              onGetDirections={handleGetDirections}
            />
          </div>
        </div>
        
        {/* Extra spacing */}
        <div className="h-20" />
      </div>
    </div>
  );
}