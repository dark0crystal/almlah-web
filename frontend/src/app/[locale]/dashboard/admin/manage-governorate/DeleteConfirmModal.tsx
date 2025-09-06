// components/DeleteConfirmModal.tsx
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface Governate {
  id: string;
  name_ar: string;
  name_en: string;
  wilayah_count?: number;
  place_count?: number;
  gallery_images?: string | null;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  governate: Governate;
  onConfirm: () => void;
  loading: boolean;
  currentLang: string;
}

// Helper function to get display name based on current language
const getDisplayName = (item: Governate | null, currentLang: string): string => {
  if (!item) return '';
  return currentLang === 'ar' ? item.name_ar : item.name_en;
};

// Helper function to parse gallery images
const parseGalleryImages = (galleryImagesJson: string | null): unknown[] => {
  if (!galleryImagesJson) return [];
  
  try {
    const parsed = JSON.parse(galleryImagesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing gallery images:', error);
    return [];
  }
};

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  governate, 
  onConfirm, 
  loading, 
  currentLang 
}) => {
  if (!isOpen || !governate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" size={24} />
          <h2 className="text-lg font-semibold">Delete Governate</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Are you sure you want to delete <strong>&ldquo;{getDisplayName(governate, currentLang)}&rdquo;</strong>?
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
            <p className="text-yellow-800 text-sm font-medium">⚠️ This action cannot be undone.</p>
          </div>

          {governate.wilayah_count && governate.wilayah_count > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm font-medium">
                🏘️ This governate has {governate.wilayah_count} wilayahs that will also be deleted.
              </p>
            </div>
          )}

          {governate.place_count && governate.place_count > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-3">
              <p className="text-orange-700 text-sm">
                📍 This governate is associated with {governate.place_count} places.
              </p>
            </div>
          )}

          {governate.gallery_images && parseGalleryImages(governate.gallery_images).length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mt-3">
              <p className="text-purple-700 text-sm">
                🖼️ This will also delete {parseGalleryImages(governate.gallery_images).length} image{parseGalleryImages(governate.gallery_images).length !== 1 ? 's' : ''} from the gallery.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />
                Delete Governate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};