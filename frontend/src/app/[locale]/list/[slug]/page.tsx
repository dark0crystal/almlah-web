'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { ListDetail, listsApi } from '@/services/listsApi';

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
  }, [slug]);

  // Helper function to render list items
  const renderListItem = (item: any) => {
    // Handle different item types
    if (item.item_type === 'separator') {
      return (
        <div key={item.id} className="flex justify-center py-4">
          {item.images && item.images.length > 0 ? (
            // Custom separator image
            <div className="relative w-full max-w-md h-16">
              <Image
                src={item.images[0].image_url}
                alt={locale === 'ar' ? item.images[0].alt_text_ar : item.images[0].alt_text_en}
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
        <div key={item.id} className={`py-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
            {content.split('\n').map((paragraph, pIndex) => (
              <p key={pIndex} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* Custom content images */}
          {item.images && item.images.length > 0 && (
            <div className="mt-6 space-y-4">
              {item.images.map((image) => (
                <div key={image.id} className="relative w-full h-64 rounded-xl overflow-hidden">
                  <Image
                    src={image.image_url}
                    alt={locale === 'ar' ? image.alt_text_ar : image.alt_text_en}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
      const placeName = locale === 'ar' ? item.place.name_ar : item.place.name_en;
      const placeDescription = locale === 'ar' ? item.place.description_ar : item.place.description_en;
      const placeSubtitle = locale === 'ar' ? item.place.subtitle_ar : item.place.subtitle_en;
      const customContent = locale === 'ar' ? item.content_ar : item.content_en;

      return (
        <div key={item.id} className={`py-6 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          
          {/* Place Header */}
          <div className="mb-4">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
              {placeName}
            </h3>
            {placeSubtitle && (
              <p className="text-gray-600 mb-3">
                {placeSubtitle}
              </p>
            )}
          </div>

          {/* Place Images */}
          {item.place.images && item.place.images.length > 0 && (
            <div className="mb-4">
              {item.place.images.length === 1 ? (
                <div className="relative w-full h-64 rounded-xl overflow-hidden">
                  <Image
                    src={item.place.images[0]}
                    alt={placeName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {item.place.images.slice(0, 4).map((image, imgIndex) => (
                    <div key={imgIndex} className="relative h-40 rounded-xl overflow-hidden">
                      <Image
                        src={image}
                        alt={`${placeName} ${imgIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose max-w-none text-gray-800 leading-relaxed">
            {customContent && (
              <div className="mb-3">
                {customContent.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-3 text-sm">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
            
            {placeDescription && (
              <div>
                {placeDescription.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-3 text-sm">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Item Images */}
          {item.images && item.images.length > 0 && (
            <div className="mt-4 space-y-3">
              {item.images.map((image) => (
                <div key={image.id} className="relative w-full h-48 rounded-xl overflow-hidden">
                  <Image
                    src={image.image_url}
                    alt={locale === 'ar' ? image.alt_text_ar : image.alt_text_en}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
    <div className={`min-h-screen bg-white ${locale === 'ar' ? 'font-arabic' : ''}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className={`mb-12 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          {list.featured_image && (
            <div className="relative w-full h-80 mb-8 rounded-2xl overflow-hidden">
              <Image
                src={list.featured_image}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20" />
              <div className={`absolute bottom-6 ${locale === 'ar' ? 'right-6' : 'left-6'} text-white`}>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">
                  {title}
                </h1>
                {description && (
                  <p className="text-xl drop-shadow-lg opacity-90">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {!list.featured_image && (
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {title}
              </h1>
              {description && (
                <p className="text-xl text-gray-600 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="space-y-12">
          {/* Render Sections if they exist */}
          {list.list_sections && list.list_sections.length > 0 ? (
            list.list_sections
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => {
                const sectionTitle = locale === 'ar' ? section.title_ar : section.title_en;
                const sectionDescription = locale === 'ar' ? section.description_ar : section.description_en;
                
                return (
                  <div key={section.id} className={`${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {/* Section Header */}
                    <div className="mb-8">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                        {sectionTitle}
                      </h2>
                      {sectionDescription && (
                        <p className="text-lg text-gray-600 leading-relaxed mb-4">
                          {sectionDescription}
                        </p>
                      )}
                      
                      {/* Section Images */}
                      {section.images && section.images.length > 0 && (
                        <div className="mb-6">
                          {section.images.length === 1 ? (
                            <div className="relative w-full h-64 rounded-xl overflow-hidden">
                              <Image
                                src={section.images[0].image_url}
                                alt={locale === 'ar' ? section.images[0].alt_text_ar : section.images[0].alt_text_en}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {section.images.slice(0, 6).map((image, imgIndex) => (
                                <div key={image.id} className="relative h-32 md:h-40 rounded-xl overflow-hidden">
                                  <Image
                                    src={image.image_url}
                                    alt={locale === 'ar' ? image.alt_text_ar : image.alt_text_en}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Section Items */}
                    <div className="space-y-8 ml-4 border-l-2 border-gray-200 pl-6">
                      {section.section_items && section.section_items.length > 0 ? (
                        section.section_items
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((item) => renderListItem(item))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            {locale === 'ar' ? 'هذا القسم فارغ حالياً' : 'This section is currently empty'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
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
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className={`text-center ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            <p className="text-gray-500 text-sm">
              {locale === 'ar' 
                ? `تم إنشاء هذه القائمة في ${new Date(list.created_at).toLocaleDateString('ar-OM')}`
                : `This list was created on ${new Date(list.created_at).toLocaleDateString('en-US')}`
              }
            </p>
            {list.creator && (
              <p className="text-gray-500 text-sm mt-1">
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