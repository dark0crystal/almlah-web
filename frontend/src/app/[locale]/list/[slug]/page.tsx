'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { ListDetail, ListItem, listsApi } from '@/services/listsApi';

export default function ListPage() {
  const params = useParams();
  const locale = useLocale() as 'ar' | 'en';
  const [list, setList] = useState<ListDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = params.slug as string;

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        const listData = await listsApi.getListBySlug(slug);
        setList(listData);
      } catch (err) {
        setError('Failed to load list');
        console.error('Error fetching list:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchList();
    }
  }, [slug]); // Removed locale from dependency array - only fetch once per slug

  // Helper function to render list items
  const renderListItem = (item: ListItem) => {
    // Handle different item types
    if (item.item_type === 'separator') {
      return (
        <div key={item.id} className="flex justify-center py-4">
          {item.images && item.images.length > 0 ? (
            // Custom separator image
            <div className="relative w-full max-w-md h-16">
              <Image
                src={item.images[0].image_url}
                alt={locale === 'ar' ? (item.images[0].alt_text_ar || '') : (item.images[0].alt_text_en || '')}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            // Default separator
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          )}
        </div>
      );
    }

    if (item.item_type === 'custom_content') {
      const content = locale === 'ar' ? item.content_ar : item.content_en;
      return (
        <div key={item.id} className="py-6 sm:py-8">
          <div className={`max-w-4xl mx-auto ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
              {typeof content === 'string' ? content.split('\n').map((paragraph, pIndex) => (
                <p key={pIndex} className="mb-4 sm:mb-6 text-base sm:text-lg">
                  {paragraph}
                </p>
              )) : null}
            </div>
          </div>
          
          {/* Custom content images */}
          {item.images && item.images.length > 0 && (
            <div className="mt-8 sm:mt-10 space-y-6">
              {item.images.map((image) => (
                <div key={image.id} className="relative w-full h-[180px] sm:h-[220px] lg:h-[280px] rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={image.image_url}
                    alt={locale === 'ar' ? (image.alt_text_ar || '') : (image.alt_text_en || '')}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Place item
    if (item.item_type === 'place' && item.place) {
      const place = item.place;
      const placeName = locale === 'ar' ? place.name_ar : place.name_en;
      const placeDescription = locale === 'ar' ? place.description_ar : place.description_en;
      const placeSubtitle = locale === 'ar' ? place.subtitle_ar : place.subtitle_en;
      const customContent = locale === 'ar' ? item.content_ar : item.content_en;

      return (
        <div key={item.id} className="py-8 sm:py-12 mb-8 sm:mb-12 border-b border-gray-100 last:border-b-0">
          
          {/* Place Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
              {placeName}
            </h3>
            {placeSubtitle && (
              <p className="text-lg sm:text-xl text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
                {placeSubtitle}
              </p>
            )}
          </div>

          {/* Place Images */}
          {place.images && place.images.length > 0 && (
            <div className="mb-6 sm:mb-8">
              {place.images.length === 1 ? (
                <div className="relative w-full h-[180px] sm:h-[220px] lg:h-[280px] rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={place.images[0]}
                    alt={placeName || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {place.images.slice(0, 4).map((image, imgIndex) => (
                    <div key={imgIndex} className="relative h-[150px] sm:h-[180px] rounded-xl overflow-hidden shadow-md">
                      <Image
                        src={image}
                        alt={`${placeName || ''} ${imgIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            {customContent && typeof customContent === 'string' ? (
              <div className={`mb-6 sm:mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {customContent.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-4 text-base sm:text-lg leading-relaxed text-gray-800">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
            
            {placeDescription && typeof placeDescription === 'string' ? (
              <div className={`${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {placeDescription.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-4 text-base sm:text-lg leading-relaxed text-gray-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          {/* Item Images */}
          {item.images && item.images.length > 0 && (
            <div className="mt-8 sm:mt-10 space-y-6">
              {item.images.map((image) => (
                <div key={image.id} className="relative w-full h-[180px] sm:h-[220px] lg:h-[280px] rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={image.image_url}
                    alt={locale === 'ar' ? (image.alt_text_ar || '') : (image.alt_text_en || '')}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'ar' ? 'القائمة غير موجودة' : 'List Not Found'}
          </h1>
          <p className="text-gray-600">
            {locale === 'ar' ? 'عذراً، القائمة المطلوبة غير متوفرة' : 'Sorry, the requested list is not available'}
          </p>
        </div>
      </div>
    );
  }

  const title = locale === 'ar' ? list.title_ar : list.title_en;
  const description = locale === 'ar' ? list.description_ar : list.description_en;

  return (
    <div className={`min-h-screen ${locale === 'ar' ? 'font-arabic' : ''}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header Section */}
        <div className="mb-16 text-center">
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
              {title}
            </h1>
          </div>
          
          {list.featured_image && (
            <div className="relative w-full h-[200px] sm:h-[250px] lg:h-[300px] mb-8 sm:mb-12 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={list.featured_image}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
            </div>
          )}
          
          {description && (
            <div className="mb-8 sm:mb-12">
              <p className={`text-lg sm:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-4xl mx-auto ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {description}
              </p>
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="space-y-16 sm:space-y-20">
          {/* Render Sections if they exist */}
          {list.list_sections && list.list_sections.length > 0 ? (
            list.list_sections
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => {
                const sectionTitle = locale === 'ar' ? section.title_ar : section.title_en;
                const sectionDescription = locale === 'ar' ? section.description_ar : section.description_en;
                
                return (
                  <section key={section.id} className="mb-16 sm:mb-20">
                    {/* Section Header */}
                    <div className="mb-8 sm:mb-12 text-center">
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
                        {sectionTitle}
                      </h2>
                      
                      {/* Section Images */}
                      {section.images && section.images.length > 0 && (
                        <div className="mb-8 sm:mb-12">
                          {section.images.length === 1 ? (
                            <div className="relative w-full h-[180px] sm:h-[220px] lg:h-[280px] rounded-2xl overflow-hidden shadow-lg">
                              <Image
                                src={section.images[0].image_url}
                                alt={locale === 'ar' ? (section.images[0].alt_text_ar || '') : (section.images[0].alt_text_en || '')}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                              {section.images.slice(0, 6).map((image) => (
                                <div key={image.id} className="relative h-[150px] sm:h-[180px] lg:h-[200px] rounded-xl overflow-hidden shadow-md">
                                  <Image
                                    src={image.image_url}
                                    alt={locale === 'ar' ? (image.alt_text_ar || '') : (image.alt_text_en || '')}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {sectionDescription && (
                        <p className={`text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                          {sectionDescription}
                        </p>
                      )}
                    </div>

                    {/* Section Items */}
                    <div className="space-y-8 sm:space-y-12">
                      {section.section_items && section.section_items.length > 0 ? (
                        section.section_items
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((item) => renderListItem(item))
                      ) : (
                        <div className="text-center py-12 sm:py-16">
                          <p className="text-gray-500 text-lg">
                            {locale === 'ar' ? 'هذا القسم فارغ حالياً' : 'This section is currently empty'}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                );
              })
          ) : (
            // Fallback to displaying list items directly (backward compatibility)
            (!list.list_items || list.list_items.length === 0) ? (
              <div className={`text-center py-16 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                <p className="text-gray-500 text-lg">
                  {locale === 'ar' ? 'هذه القائمة فارغة حالياً' : 'This list is currently empty'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {list.list_items
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item) => renderListItem(item))
                }
              </div>
            )
          )}
        </div>

        {/* Footer/Attribution */}
        <div className="mt-20 sm:mt-24 pt-8 sm:pt-12 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-500 text-sm sm:text-base">
              {locale === 'ar' 
                ? `تم إنشاء هذه القائمة في ${new Date(list.created_at).toLocaleDateString('ar-OM')}`
                : `This list was created on ${new Date(list.created_at).toLocaleDateString('en-US')}`
              }
            </p>
            {list.creator && (
              <p className="text-gray-500 text-sm sm:text-base mt-2">
                {locale === 'ar' 
                  ? `بواسطة ${list.creator.name}`
                  : `By ${list.creator.name}`
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}