'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ListSummary } from '@/services/listsApi';

interface ListCardProps {
  list: ListSummary;
}

export default function ListCard({ list }: ListCardProps) {
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/${locale}/list/${list.slug}`);
  };
  
  return (
    <div 
      className="flex-shrink-0 w-80 h-56 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer p-2"
      onClick={handleClick}
    >
      <div className="h-full w-full rounded-3xl overflow-hidden flex flex-col">
        <div className="relative flex-1 overflow-hidden rounded-3xl">
          <Image
            src={list.featured_image || '/default-list-image.jpg'}
            alt={locale === 'ar' ? list.title_ar : list.title_en}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Text overlay at bottom */}
          <div className={`absolute bottom-0 ${locale === 'ar' ? 'right-0' : 'left-0'} p-3 max-w-[80%]`}>
            <h3 className="font-bold text-white text-xl mb-1 leading-tight drop-shadow-lg truncate">
              {locale === 'ar' ? list.title_ar : list.title_en}
            </h3>
            <p className="text-white text-lg drop-shadow-lg truncate">
              📝 {list.item_count} {locale === 'ar' ? 'عنصر' : 'items'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}