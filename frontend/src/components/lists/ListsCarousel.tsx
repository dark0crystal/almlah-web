'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { ListSummary, listsApi } from '@/services/listsApi';
import ListCard from './ListCard';

export default function ListsCarousel() {
  const t = useTranslations('HomePage');
  const locale = useLocale() as 'ar' | 'en';
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLists = async () => {
      try {
        setLoading(true);
        const response = await listsApi.getLists(1, 10, 'published');
        setLists(response.data.data);
      } catch (err) {
        setError('Failed to load lists');
        console.error('Error fetching lists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, []);

  if (loading) {
    return (
      <section className="w-[88vw]">
        <div className={`mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {locale === 'ar' ? 'قوائـم الـمـلاح' : 'Almlah Lists'}
          </h2>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-80 h-56 bg-gray-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-[88vw]">
        <div className={`mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {locale === 'ar' ? 'قوائـم الـمـلاح' : 'Almlah Lists'}
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">
            {locale === 'ar' ? 'فشل في تحميل القوائم' : 'Failed to load lists'}
          </p>
        </div>
      </section>
    );
  }

  if (lists.length === 0) {
    return (
      <section className="w-[88vw]">
        <div className={`mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {locale === 'ar' ? 'قوائـم الـمـلاح' : 'Almlah Lists'}
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">
            {locale === 'ar' ? 'لا توجد قوائم متاحة حاليا' : 'No lists available at the moment'}
          </p>
        </div>
      </section>
    );
  }
  
  return (
    <section className="w-[88vw]">
      {/* Section Header */}
      <div className={`mb-8 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {locale === 'ar' ? 'قوائـم الـمـلاح' : 'Almlah Lists'}
        </h2>
      </div>

      {/* Horizontal Scrolling Cards */}
      <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
        <div className="flex gap-6 px-2">
          {lists.map((list) => (
            <ListCard 
              key={list.id} 
              list={list}
            />
          ))}
        </div>
      </div>

      {/* Scroll Hint */}
      {lists.length > 3 && (
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            {locale === 'ar' ? 'مرر للمزيد →' : '← Scroll for more →'}
          </p>
        </div>
      )}
    </section>
  );
}