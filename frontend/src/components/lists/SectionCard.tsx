'use client';

import { useLocale } from 'next-intl';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListSection } from '@/services/listsApi';
import Image from 'next/image';

interface SectionCardProps {
  section: ListSection;
  onEdit: (section: ListSection) => void;
  onDelete: (section: ListSection) => void;
  onClick: (section: ListSection) => void;
}

export default function SectionCard({ 
  section, 
  onEdit, 
  onDelete, 
  onClick 
}: SectionCardProps) {
  const locale = useLocale() as 'ar' | 'en';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = locale === 'ar' ? section.title_ar : section.title_en;
  const description = locale === 'ar' ? section.description_ar : section.description_en;
  const featuredImage = section.images && section.images.length > 0 ? section.images[0].image_url : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer
        ${isDragging 
          ? 'opacity-50 z-10' 
          : 'hover:-translate-y-1'
        }
        ${locale === 'ar' ? 'text-right' : 'text-left'}
      `}
      onClick={(e) => {
        e.preventDefault();
        onClick(section);
      }}
    >
      <div className="relative h-48 rounded-t-xl overflow-hidden">
        {featuredImage ? (
          <Image
            src={featuredImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="absolute top-2 left-2 bg-white/80 hover:bg-white/90 rounded-lg p-2 cursor-grab active:cursor-grabbing transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>

        {/* Action Buttons */}
        <div className={`absolute top-2 ${locale === 'ar' ? 'left-2' : 'right-2'} flex gap-1`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(section);
            }}
            className="bg-white/80 hover:bg-white/90 text-gray-700 hover:text-blue-600 rounded-lg p-2 transition-colors"
            title={locale === 'ar' ? 'تحرير' : 'Edit'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(section);
            }}
            className="bg-white/80 hover:bg-white/90 text-gray-700 hover:text-red-600 rounded-lg p-2 transition-colors"
            title={locale === 'ar' ? 'حذف' : 'Delete'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {description}
          </p>
        )}
        
        <div className={`flex items-center gap-4 text-xs text-gray-500 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <span className="flex items-center gap-1">
            📝 {section.section_items?.length || 0} {locale === 'ar' ? 'عنصر' : 'items'}
          </span>
          
          {section.images && section.images.length > 0 && (
            <span className="flex items-center gap-1">
              🖼️ {section.images.length} {locale === 'ar' ? 'صورة' : 'images'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}