'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ListSummary, listsApi } from '@/services/listsApi';
import ImageUpload, { PendingImageUpload } from './ImageUpload';
import { uploadPendingImage } from './uploadUtils';

interface ListFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  list?: ListSummary | null;
}

export default function ListFormModal({ isOpen, onClose, onSuccess, mode, list }: ListFormModalProps) {
  const locale = useLocale() as 'ar' | 'en';
  
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    featured_image: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingImageUpload, setPendingImageUpload] = useState<PendingImageUpload | null>(null);

  // Populate form data when editing
  useEffect(() => {
    if (mode === 'edit' && list) {
      setFormData({
        title_ar: list.title_ar,
        title_en: list.title_en,
        slug: list.slug,
        description_ar: list.description_ar,
        description_en: list.description_en,
        featured_image: list.featured_image,
        status: list.status as 'draft' | 'published' | 'archived',
      });
    } else {
      setFormData({
        title_ar: '',
        title_en: '',
        slug: '',
        description_ar: '',
        description_en: '',
        featured_image: '',
        status: 'draft',
      });
    }
    setError(null);
    setPendingImageUpload(null); // Clear pending upload when modal opens/closes
  }, [mode, list, isOpen]);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .trim() // Remove leading/trailing spaces first
      .toLowerCase()
      .replace(/[أ-ي]/g, '') // Remove Arabic characters
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
  };

  const handleTitleChange = (field: 'title_ar' | 'title_en', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate slug from English title if it's empty
      ...(field === 'title_en' && !prev.slug ? { slug: generateSlug(value) } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalFormData = { ...formData };

      // Upload pending image if exists
      if (pendingImageUpload) {
        const uploadedImageUrl = await uploadPendingImage(pendingImageUpload);
        finalFormData.featured_image = uploadedImageUrl;
      }

      if (mode === 'create') {
        await listsApi.createList(finalFormData);
      } else if (list) {
        await listsApi.updateList(list.id, finalFormData);
      }
      
      // Clean up pending uploads
      setPendingImageUpload(null);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save list');
    } finally {
      setLoading(false);
    }
  };

  // const handleImageUpload = (imageUrl: string) => {
  //   setFormData(prev => ({ ...prev, featured_image: imageUrl }));
  // };

  const handleFileSelect = (pendingUpload: PendingImageUpload | null) => {
    setPendingImageUpload(pendingUpload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' 
              ? (locale === 'ar' ? 'إضافة قائمة جديدة' : 'Add New List')
              : (locale === 'ar' ? 'تحرير القائمة' : 'Edit List')
            }
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Arabic Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              العنوان بالعربية *
            </label>
            <input
              type="text"
              required
              value={formData.title_ar}
              onChange={(e) => handleTitleChange('title_ar', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              placeholder="أدخل عنوان القائمة بالعربية"
              dir="rtl"
            />
          </div>

          {/* English Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Title *
            </label>
            <input
              type="text"
              required
              value={formData.title_en}
              onChange={(e) => handleTitleChange('title_en', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter list title in English"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="best-restaurants-muscat"
              pattern="[a-z0-9\-]+"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only lowercase letters, numbers, and hyphens
            </p>
          </div>

          {/* Arabic Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              الوصف بالعربية
            </label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              placeholder="أدخل وصف القائمة بالعربية"
              dir="rtl"
            />
          </div>

          {/* English Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Description
            </label>
            <textarea
              value={formData.description_en}
              onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter list description in English"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {locale === 'ar' ? 'الصورة المميزة' : 'Featured Image'}
            </label>
            <ImageUpload
              currentImage={formData.featured_image}
              onFileSelect={handleFileSelect}
              bucket="lists"
              locale={locale}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {locale === 'ar' ? 'الحالة' : 'Status'}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">{locale === 'ar' ? 'مسودة' : 'Draft'}</option>
              <option value="published">{locale === 'ar' ? 'منشور' : 'Published'}</option>
              <option value="archived">{locale === 'ar' ? 'مؤرشف' : 'Archived'}</option>
            </select>
          </div>

          {/* Actions */}
          <div className={`flex gap-4 pt-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                : mode === 'create' 
                  ? (locale === 'ar' ? 'إنشاء القائمة' : 'Create List')
                  : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}