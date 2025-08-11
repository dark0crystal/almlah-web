import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Save } from 'lucide-react';

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

interface CategoryFormData {
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  icon: string;
  type: 'primary' | 'secondary';
  parent_id: string | null;
  sort_order: number;
}

interface FormErrors {
  [key: string]: string;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  primaryCategories: Category[];
  onSave: (id: string | null, categoryData: CategoryFormData) => Promise<void>;
  currentLang: 'en' | 'ar' | 'both';
}

// Utility functions
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to ensure array format
const ensureArray = (data: any): Category[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    if (data.primary) return data.primary;
    if (data.categories) return data.categories;
    if (data.data) return ensureArray(data.data);
    return [data];
  }
  return [];
};

// Helper function to get display name based on current language
const getDisplayName = (category: Category, currentLang: 'en' | 'ar' | 'both'): string => {
  if (category.name) return category.name; // Localized response
  return currentLang === 'ar' ? category.name_ar : category.name_en;
};

// Category Form Modal Component
const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ 
  isOpen, 
  onClose, 
  category, 
  primaryCategories, 
  onSave, 
  currentLang 
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name_ar: '',
    name_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    icon: '',
    type: 'primary',
    parent_id: null,
    sort_order: 0
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name_ar: category.name_ar || '',
        name_en: category.name_en || '',
        slug: category.slug || '',
        description_ar: category.description_ar || '',
        description_en: category.description_en || '',
        icon: category.icon || '',
        type: category.type || 'primary',
        parent_id: category.parent_id || null,
        sort_order: category.sort_order || 0
      });
    } else {
      setFormData({
        name_ar: '',
        name_en: '',
        slug: '',
        description_ar: '',
        description_en: '',
        icon: '',
        type: 'primary',
        parent_id: null,
        sort_order: 0
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : value
    }));

    // Auto-generate slug from English name
    if (name === 'name_en' && !category) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      const type = value as 'primary' | 'secondary';
      setFormData(prev => ({
        ...prev,
        type,
        parent_id: type === 'primary' ? null : prev.parent_id
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name_ar.trim()) newErrors.name_ar = 'Arabic name is required';
    if (!formData.name_en.trim()) newErrors.name_en = 'English name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (formData.type === 'secondary' && !formData.parent_id) {
      newErrors.parent_id = 'Parent category is required for secondary categories';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = { ...formData };
      
      // Ensure primary categories have null parent_id
      if (submitData.type === 'primary') {
        submitData.parent_id = null;
      }
      
      // Convert numeric fields
      if (submitData.sort_order !== null && submitData.sort_order !== 0) {
        submitData.sort_order = parseInt(submitData.sort_order.toString(), 10) || 0;
      } else {
        submitData.sort_order = 0;
      }
      
      // Keep parent_id as string (UUID) or null
      if (submitData.parent_id !== null && submitData.parent_id !== '') {
        submitData.parent_id = submitData.parent_id.toString();
      } else {
        submitData.parent_id = null;
      }
      
      // Trim string values and handle empty strings
      Object.keys(submitData).forEach(key => {
        const value = submitData[key as keyof CategoryFormData];
        if (typeof value === 'string') {
          (submitData as any)[key] = value.trim();
        }
      });

      console.log('Submitting form data:', submitData);

      if (category) {
        await onSave(category.id, submitData);
      } else {
        await onSave(null, submitData);
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ general: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={16} />
              <span className="text-red-700 text-sm">{errors.general}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bilingual Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arabic Name *
              </label>
              <input
                type="text"
                name="name_ar"
                value={formData.name_ar}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name_ar ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="الاسم بالعربية"
                dir="rtl"
              />
              {errors.name_ar && <p className="text-red-500 text-sm mt-1">{errors.name_ar}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Name *
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name_en ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Category name in English"
              />
              {errors.name_en && <p className="text-red-500 text-sm mt-1">{errors.name_en}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.slug ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="category-slug"
            />
            {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
          </div>

          {/* Bilingual Description Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arabic Description
              </label>
              <textarea
                name="description_ar"
                value={formData.description_ar}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="الوصف بالعربية"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Description
              </label>
              <textarea
                name="description_en"
                value={formData.description_en}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Category description in English"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <input
              type="text"
              name="icon"
              value={formData.icon}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Icon name or emoji"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleSelectChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>

          {formData.type === 'secondary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category *
              </label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleSelectChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.parent_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select parent category</option>
                {ensureArray(primaryCategories).map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {getDisplayName(cat, currentLang)}
                  </option>
                ))}
              </select>
              {errors.parent_id && <p className="text-red-500 text-sm mt-1">{errors.parent_id}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
              disabled={loading}
            >
              <Save className="mr-2" size={16} />
              {loading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;