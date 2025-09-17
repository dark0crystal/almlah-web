"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, Share2 } from 'lucide-react';
import ImagesContainer from "./ImagesContainer";
import PostCardsWrapper from "@/components/cards/postCards/PostCardWrapper";
import Footer from '@/components/Footer';
import { fetchWilayahById, fetchWilayahImages, WilayahWithImages } from '@/services/governateApi';
import { WilayahDetailsProps } from '../../../types';

export default function WilayahDetailsPage({ params }: WilayahDetailsProps) {
  const [wilayah, setWilayah] = useState<WilayahWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [governateId, setGovernateId] = useState<string>('');
  const [wilayahId, setWilayahId] = useState<string>('');
  
  // Get current locale and translations
  const locale = useLocale() as 'ar' | 'en';
  const t = useTranslations('wilayah');
  const tNav = useTranslations('navigation');
  
  // Get router
  const router = useRouter();
  
  // Extract IDs from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setGovernateId(resolvedParams['destination-id']);
      setWilayahId(resolvedParams['wilayah-id']);
    };
    getParams();
  }, [params]);
  
  console.log('WilayahDetails - governateId:', governateId, 'wilayahId:', wilayahId);

  // Load wilayah function - wrapped in useCallback to prevent unnecessary re-renders
  const loadWilayah = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading wilayah data for ID:', wilayahId);
      
      // Fetch wilayah details
      const wilayahData = await fetchWilayahById(wilayahId);
      
      if (!wilayahData) {
        setError(t('noWilayahsFound'));
        return;
      }
      
      // Fetch images for this wilayah
      try {
        const images = await fetchWilayahImages(wilayahId);
        const wilayahWithImages: WilayahWithImages = {
          ...wilayahData,
          images: images || [],
          image_url: images && images.length > 0 ? images.find(img => img.is_primary)?.image_url || images[0]?.image_url : undefined,
          place_count: Math.floor(Math.random() * 25) + 5 // Placeholder until backend provides this
        };
        
        setWilayah(wilayahWithImages);
        console.log('Wilayah loaded successfully:', wilayahWithImages);
      } catch (imageError) {
        console.warn('Could not load wilayah images:', imageError);
        // Set wilayah without images
        setWilayah({
          ...wilayahData,
          images: [],
          place_count: Math.floor(Math.random() * 25) + 5
        });
      }
      
    } catch (err) {
      console.error('Error loading wilayah:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wilayah data');
    } finally {
      setLoading(false);
    }
  }, [wilayahId, t]);

  // Load wilayah data when component mounts
  useEffect(() => {
    if (!wilayahId) {
      // Don't show error immediately, wait for params to resolve
      return;
    }

    loadWilayah();
  }, [wilayahId, loadWilayah]);

  // Update page title
  useEffect(() => {
    if (wilayah) {
      const wilayahName = locale === 'ar' ? wilayah.name_ar : wilayah.name_en;
      document.title = `${wilayahName} - ${t('title') || 'Wilayah'}`;
    }
  }, [wilayah, locale, t]);

  // Handle share functionality
  const handleShare = async () => {
    if (!wilayah) return;
    
    const wilayahName = locale === 'ar' ? wilayah.name_ar : wilayah.name_en;
    const currentUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wilayahName} - ${locale === 'ar' ? 'الملاح' : 'Almlah'}`,
          text: `${locale === 'ar' ? 'استكشف ولاية' : 'Explore'} ${wilayahName}`,
          url: currentUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(currentUrl);
        alert(locale === 'ar' ? 'تم نسخ رابط الصفحة!' : 'Page URL copied!');
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  // Handle retry
  const handleRetry = () => {
    loadWilayah();
  };

  // Handle go back
  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="text-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {locale === 'ar' ? 'جاري تحميل بيانات الولاية...' : 'Loading wilayah data...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <div className="text-red-600 mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                {locale === 'ar' ? 'خطأ' : 'Error'}
              </h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleRetry}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  {locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                </button>
                <button
                  onClick={handleGoBack}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  {locale === 'ar' ? 'العودة' : 'Go Back'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wilayah) {
    return (
      <div className="text-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-600">
                {locale === 'ar' ? 'الولاية غير موجودة' : 'Wilayah not found'}
              </p>
              <button
                onClick={handleGoBack}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {locale === 'ar' ? 'العودة' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get localized content
  const wilayahName = locale === 'ar' ? wilayah.name_ar : wilayah.name_en;
  const alternativeName = locale === 'ar' ? wilayah.name_en : wilayah.name_ar;

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
              <span className="text-gray-900 font-medium">{wilayahName}</span>
            </nav>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={locale === 'ar' ? 'مشاركة' : 'Share'}
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{wilayahName}</h1>
          
          {alternativeName && alternativeName !== wilayahName && (
            <p className="text-xl text-blue-600 font-medium mb-4">
              {alternativeName}
            </p>
          )}
          
        </div>

        {/* Main Content */}
        <div className="w-full">
          {/* Image Gallery */}
          <ImagesContainer 
            images={wilayah.images || []} 
            wilayahName={wilayahName}
          />
          
          {/* About Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {locale === 'ar' ? 'نبذة عن الولاية' : 'About the Wilayah'}
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {locale === 'ar' 
                  ? `ولاية ${wilayahName} هي إحدى الولايات الجميلة في سلطنة عُمان، تضم العديد من المعالم السياحية والأماكن التاريخية المميزة.`
                  : `${wilayahName} is one of the beautiful wilayahs in the Sultanate of Oman, featuring numerous tourist attractions and distinctive historical sites.`
                }
              </p>
            </div>
          </div>

          {/* Places to Visit Section */}
          <div className="mt-12">
            <PostCardsWrapper 
              wilayahId={wilayah.id}
              title={locale === 'ar' ? `الأماكن في ولاية ${wilayahName}` : `Places in ${wilayahName} Wilayah`}
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