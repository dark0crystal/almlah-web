import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

// Type definitions
interface Category {
  id: string;
  name?: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  icon?: string;
  type: 'primary' | 'secondary';
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  place_count?: number;
  subcategories?: Category[];
  children?: Category[];
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onConfirm: () => void;
  loading: boolean;
  currentLang: 'en' | 'ar' | 'both';
}

// Helper function to ensure array format
const ensureArray = (data: unknown): Category[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.primary && Array.isArray(obj.primary)) return obj.primary as Category[];
    if (obj.categories && Array.isArray(obj.categories)) return obj.categories as Category[];
    if (obj.data) return ensureArray(obj.data);
    
    // Check if the object has required Category properties
    if (obj.id && obj.name_ar && obj.name_en && obj.slug) {
      return [obj as unknown as Category];
    }
    return [];
  }
  return [];
};

// Helper function to get display name based on current language
const getDisplayName = (category: Category, currentLang: 'en' | 'ar' | 'both'): string => {
  if (category.name) return category.name; // Localized response
  return currentLang === 'ar' ? category.name_ar : category.name_en;
};

// Delete Confirmation Modal
const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  category, 
  onConfirm, 
  loading, 
  currentLang 
}) => {
  if (!isOpen || !category) return null;

  const subcategories = ensureArray(category.subcategories || category.children);
  const subcategoryCount = subcategories.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" size={24} />
          <h2 className="text-lg font-semibold">Delete Category</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Are you sure you want to delete <strong>&quot;{getDisplayName(category, currentLang)}&quot;</strong>?
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
            <p className="text-yellow-800 text-sm font-medium">⚠️ This action cannot be undone.</p>
          </div>

          {subcategoryCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm font-medium">
                🗂️ This will also permanently delete all {subcategoryCount} subcategories:
              </p>
              <ul className="mt-2 text-red-600 text-sm list-disc list-inside max-h-24 overflow-y-auto">
                {subcategories.map(sub => (
                  <li key={sub.id}>{getDisplayName(sub, currentLang)}</li>
                ))}
              </ul>
            </div>
          )}

          {category.place_count && category.place_count > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-3">
              <p className="text-orange-700 text-sm">
                📍 This category is associated with {category.place_count} places. The places will remain but lose this category association.
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
                Delete {subcategoryCount > 0 ? `All (${subcategoryCount + 1})` : 'Category'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;