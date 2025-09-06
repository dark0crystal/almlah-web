// components/GovernateCard.tsx
import React from 'react';
import Image from 'next/image';
import { Edit, Trash2, MapPin, Eye, Image as ImageIcon } from 'lucide-react';

interface Governate {
  id: string;
  name_ar: string;
  name_en: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  description_ar?: string;
  description_en?: string;
  slug: string;
  latitude?: number;
  longitude?: number;
  sort_order: number;
  is_active?: boolean;
  wilayah_count?: number;
  place_count?: number;
  images?: unknown[];
  gallery_images?: string;
}

interface GovernateCardProps {
  governate: Governate;
  onEdit: (governate: Governate) => void;
  onDelete: (governate: Governate) => void;
  onViewWilayahs: (governate: Governate) => void;
  currentLang: string;
}

// Helper function to get display name based on current language
const getDisplayName = (item: Governate | null, currentLang: string): string => {
  if (!item) return '';
  return currentLang === 'ar' ? item.name_ar : item.name_en;
};

// Helper function to get display subtitle based on current language
const getDisplaySubtitle = (item: Governate | null, currentLang: string): string => {
  if (!item) return '';
  return currentLang === 'ar' ? (item.subtitle_ar || '') : (item.subtitle_en || '');
};

// Helper function to get display description based on current language
const getDisplayDescription = (item: Governate | null, currentLang: string): string => {
  if (!item) return '';
  return currentLang === 'ar' ? (item.description_ar || '') : (item.description_en || '');
};

// Helper function to parse gallery images
interface GalleryImage {
  id: string;
  path: string;
  alt_text: string;
  caption: string;
  is_primary: boolean;
  display_order: number;
  url: string;
}

const parseGalleryImages = (galleryImagesJson: string | null): GalleryImage[] => {
  if (!galleryImagesJson) return [];
  
  try {
    const parsed = JSON.parse(galleryImagesJson);
    return Array.isArray(parsed) ? parsed.map((img: { id?: string; path: string; alt_text?: string; caption?: string; is_primary?: boolean; display_order?: number; url: string }, index: number) => ({
      id: img.id || `existing-${index}`,
      path: img.path,
      alt_text: img.alt_text || '',
      caption: img.caption || '',
      is_primary: img.is_primary || false,
      display_order: img.display_order || index,
      url: img.url // This should be constructed from path + base URL
    })) : [];
  } catch (error) {
    console.error('Error parsing gallery images:', error);
    return [];
  }
};

export const GovernateCard: React.FC<GovernateCardProps> = ({ 
  governate, 
  onEdit, 
  onDelete, 
  onViewWilayahs, 
  currentLang 
}) => {
  const galleryImages = parseGalleryImages(governate.gallery_images ?? null);
  const primaryImage = galleryImages.find(img => img.is_primary) || galleryImages[0];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
      {/* Image Header */}
      {primaryImage && (
        <div className="relative h-48 bg-gray-100">
          <Image
            src={primaryImage.url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_STORAGE_BUCKET}/${primaryImage.path}`}
            alt={primaryImage.alt_text || getDisplayName(governate, currentLang)}
            fill
            className="object-cover"
          />
          {galleryImages.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              +{galleryImages.length - 1} more
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center">
            <ImageIcon size={12} className="mr-1" />
            {galleryImages.length}
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {getDisplayName(governate, currentLang)}
            </h3>
            
            {/* Subtitle */}
            {getDisplaySubtitle(governate, currentLang) && (
              <p className="text-sm text-gray-600 mb-2 italic">
                {getDisplaySubtitle(governate, currentLang)}
              </p>
            )}
            
            <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
              {governate.slug}
            </p>
            
            {governate.latitude && governate.longitude && (
              <p className="text-sm text-gray-600 mt-2">
                <MapPin className="inline mr-1" size={14} />
                {governate.latitude.toFixed(4)}, {governate.longitude.toFixed(4)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-1 text-xs rounded-full ${
              governate.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {governate.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          {getDisplayDescription(governate, currentLang) && (
            <p className="italic line-clamp-2">{getDisplayDescription(governate, currentLang)}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Wilayahs:</span>
            <span className="ml-1 font-medium">{governate.wilayah_count || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Places:</span>
            <span className="ml-1 font-medium">{governate.place_count || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Images:</span>
            <span className="ml-1 font-medium">{galleryImages.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Sort Order:</span>
            <span className="ml-1 font-medium">{governate.sort_order || 0}</span>
          </div>
        </div>

        {currentLang === 'both' && (
          <div className="text-xs text-gray-500 mb-4 space-y-1 p-2 bg-gray-50 rounded">
            <div><strong>AR:</strong> {governate.name_ar}</div>
            <div><strong>EN:</strong> {governate.name_en}</div>
            {(governate.subtitle_ar || governate.subtitle_en) && (
              <>
                <div><strong>Subtitle AR:</strong> {governate.subtitle_ar || 'N/A'}</div>
                <div><strong>Subtitle EN:</strong> {governate.subtitle_en || 'N/A'}</div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => onViewWilayahs(governate)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <Eye size={14} className="mr-1" />
            View Wilayahs ({governate.wilayah_count || 0})
          </button>
          
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(governate)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
              title="Edit governate"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(governate)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
              title="Delete governate"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};