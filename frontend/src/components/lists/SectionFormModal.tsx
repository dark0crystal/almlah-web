'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { ListSection, listsApi } from '@/services/listsApi';
import ImageUpload, { PendingImageUpload } from '@/app/[locale]/dashboard/admin/manage-lists/ImageUpload';
import { uploadPendingImage } from '@/app/[locale]/dashboard/admin/manage-lists/uploadUtils';

interface SectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  listId: string;
  mode: 'create' | 'edit';
  section?: ListSection | null;
}

export default function SectionFormModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  listId,
  mode, 
  section 
}: SectionFormModalProps) {
  const locale = useLocale() as 'ar' | 'en';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingImageUploads, setPendingImageUploads] = useState<PendingImageUpload[]>([]);

  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    images: [] as { image_url: string; alt_text_ar: string; alt_text_en: string; sort_order: number }[]
  });

  useEffect(() => {
    if (mode === 'edit' && section) {
      setFormData({
        title_ar: section.title_ar,
        title_en: section.title_en,
        description_ar: section.description_ar,
        description_en: section.description_en,
        images: section.images?.map(img => ({
          image_url: img.image_url,
          alt_text_ar: img.alt_text_ar,
          alt_text_en: img.alt_text_en,
          sort_order: img.sort_order
        })) || []
      });
    } else {
      setFormData({
        title_ar: '',
        title_en: '',
        description_ar: '',
        description_en: '',
        images: []
      });
    }
    setError(null);
    setPendingImageUploads([]); // Clear pending uploads when modal opens/closes
  }, [mode, section, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalFormData = { ...formData };

      // Upload pending images
      if (pendingImageUploads.length > 0) {
        const uploadedImageUrls = await Promise.all(
          pendingImageUploads.map(upload => uploadPendingImage(upload))
        );
        
        // Add uploaded images to existing ones
        const newImages = uploadedImageUrls.map((url, index) => ({
          image_url: url,
          alt_text_ar: '',
          alt_text_en: '',
          sort_order: finalFormData.images.length + index
        }));
        
        finalFormData.images = [...finalFormData.images, ...newImages];
      }

      if (mode === 'create') {
        await listsApi.createListSection(listId, finalFormData);
      } else if (section) {
        await listsApi.updateListSection(listId, section.id, {
          title_ar: finalFormData.title_ar,
          title_en: finalFormData.title_en,
          description_ar: finalFormData.description_ar,
          description_en: finalFormData.description_en,
        });
      }
      
      // Clean up pending uploads
      setPendingImageUploads([]);
      onSuccess();
    } catch (err) {
      setError('Failed to save section');
      console.error('Error saving section:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (pendingUpload: PendingImageUpload | null) => {
    if (pendingUpload) {
      setPendingImageUploads(prev => [...prev, pendingUpload]);
    }
  };

  const removeImage = (index: number) => {
    const totalExistingImages = formData.images.length;
    
    if (index < totalExistingImages) {
      // Removing an existing image
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      // Removing a pending upload
      const pendingIndex = index - totalExistingImages;
      setPendingImageUploads(prev => prev.filter((_, i) => i !== pendingIndex));
    }
  };

  const updateImageAltText = (index: number, field: 'alt_text_ar' | 'alt_text_en', value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`p-6 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className={`flex justify-between items-center mb-6 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' 
                ? (locale === 'ar' ? 'إضافة قسم جديد' : 'Add New Section')
                : (locale === 'ar' ? 'تحرير القسم' : 'Edit Section')
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

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'ar' ? 'العنوان (عربي) *' : 'Title (Arabic) *'}
                </label>
                <input
                  type="text"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({...formData, title_ar: e.target.value})}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${locale === 'ar' ? 'text-right' : 'text-left'}`}
                  placeholder={locale === 'ar' ? 'أدخل العنوان بالعربية' : 'Enter Arabic title'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'ar' ? 'العنوان (إنجليزي) *' : 'Title (English) *'}
                </label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setFormData({...formData, title_en: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={locale === 'ar' ? 'أدخل العنوان بالإنجليزية' : 'Enter English title'}
                  required
                />
              </div>
            </div>

            {/* Description Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                  rows={4}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${locale === 'ar' ? 'text-right' : 'text-left'}`}
                  placeholder={locale === 'ar' ? 'أدخل الوصف بالعربية' : 'Enter Arabic description'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
                </label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  placeholder={locale === 'ar' ? 'أدخل الوصف بالإنجليزية' : 'Enter English description'}
                />
              </div>
            </div>

            {/* Section Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                {locale === 'ar' ? 'صور القسم' : 'Section Images'}
              </label>
              
              <ImageUpload 
                onFileSelect={handleFileSelect}
                bucket="lists/sections"
                locale={locale}
              />
              
              {(formData.images.length > 0 || pendingImageUploads.length > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* Existing images */}
                  {formData.images.map((image, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="relative mb-3">
                        <Image 
                          src={image.image_url} 
                          alt={locale === 'ar' ? image.alt_text_ar : image.alt_text_en}
                          width={200}
                          height={96}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={image.alt_text_ar}
                          onChange={(e) => updateImageAltText(index, 'alt_text_ar', e.target.value)}
                          placeholder={locale === 'ar' ? 'النص البديل (عربي)' : 'Alt text (Arabic)'}
                          className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 ${locale === 'ar' ? 'text-right' : 'text-left'}`}
                        />
                        <input
                          type="text"
                          value={image.alt_text_en}
                          onChange={(e) => updateImageAltText(index, 'alt_text_en', e.target.value)}
                          placeholder={locale === 'ar' ? 'النص البديل (إنجليزي)' : 'Alt text (English)'}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Pending uploads */}
                  {pendingImageUploads.map((upload, index) => {
                    const actualIndex = formData.images.length + index;
                    return (
                      <div key={`pending-${index}`} className="border rounded-lg p-4 bg-blue-50">
                        <div className="relative mb-3">
                          <Image 
                            src={upload.previewUrl} 
                            alt="Preview"
                            width={200}
                            height={96}
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(actualIndex)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-xs text-blue-600 text-center">
                          {locale === 'ar' ? 'سيتم رفعها عند الحفظ' : 'Will upload on save'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className={`flex gap-3 pt-6 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : mode === 'create' 
                    ? (locale === 'ar' ? 'إضافة القسم' : 'Add Section')
                    : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}