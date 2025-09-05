'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { ListSection, listsApi } from '@/services/listsApi';
import ImageUpload from '@/components/ImageUpload/ImageUpload';
import { 
  PendingUpload, 
  UploadResult, 
  processPendingUploads,
  createPendingUpload,
  cleanupPendingUpload 
} from '@/app/[locale]/dashboard/admin/manage-lists/uploadUtils';

interface SectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  listId: string;
  mode: 'create' | 'edit';
  section?: ListSection | null;
}

export default function EnhancedSectionFormModal({ 
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
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

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
    setPendingUploads([]);
    setUploadProgress({});
  }, [mode, section, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalFormData = { ...formData };

      // Upload pending images if any
      if (pendingUploads.length > 0) {
        console.log(`🚀 Starting upload of ${pendingUploads.length} pending images`);
        
        const uploadResult = await processPendingUploads(
          pendingUploads,
          (uploadId, progress) => {
            setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
          },
          (uploadId, result) => {
            console.log(`✅ Upload completed for ${uploadId}:`, result.success ? 'Success' : 'Failed');
          }
        );

        if (uploadResult.failedCount > 0) {
          const errors = uploadResult.failed.map(f => f.error).filter(Boolean);
          throw new Error(`Some uploads failed: ${errors.join(', ')}`);
        }

        // Add uploaded images to existing ones
        const newImages = uploadResult.successful.map((result, index) => ({
          image_url: result.url!,
          alt_text_ar: '',
          alt_text_en: '',
          sort_order: finalFormData.images.length + index
        }));
        
        finalFormData.images = [...finalFormData.images, ...newImages];
        
        console.log(`✅ Successfully uploaded ${uploadResult.successfulCount} images`);
      }

      // Save section data
      if (mode === 'create') {
        await listsApi.createListSection(listId, finalFormData);
      } else if (section) {
        await listsApi.updateListSection(listId, section.id, finalFormData);
      }
      
      // Clean up pending uploads
      pendingUploads.forEach(cleanupPendingUpload);
      setPendingUploads([]);
      setUploadProgress({});
      
      onSuccess();
    } catch (err) {
      console.error('Error saving section:', err);
      setError(err instanceof Error ? err.message : 'Failed to save section');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = useCallback((pendingUpload: PendingUpload | null) => {
    if (pendingUpload) {
      setPendingUploads(prev => [...prev, pendingUpload]);
    }
  }, []);

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
      const uploadToRemove = pendingUploads[pendingIndex];
      if (uploadToRemove) {
        cleanupPendingUpload(uploadToRemove);
      }
      setPendingUploads(prev => prev.filter((_, i) => i !== pendingIndex));
      
      // Remove from upload progress
      if (uploadToRemove) {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[uploadToRemove.id];
          return newProgress;
        });
      }
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

  const getTotalImages = () => formData.images.length + pendingUploads.length;
  const getUploadProgress = () => {
    const progressValues = Object.values(uploadProgress);
    if (progressValues.length === 0) return 0;
    return progressValues.reduce((sum, progress) => sum + progress, 0) / progressValues.length;
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
                {getTotalImages() > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({getTotalImages()} {locale === 'ar' ? 'صورة' : 'images'})
                  </span>
                )}
              </label>
              
              <ImageUpload 
                onFileSelect={handleFileSelect}
                bucket="lists/sections"
                locale={locale}
                multiple={true}
                maxFiles={10}
                showProgress={true}
              />
              
              {/* Upload Progress */}
              {pendingUploads.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {locale === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                    </span>
                    <span>{Math.round(getUploadProgress())}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getUploadProgress()}%` }}
                    />
                  </div>
                </div>
              )}
              
              {getTotalImages() > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* Existing images */}
                  {formData.images.map((image, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="relative mb-3">
                        <img 
                          src={image.image_url} 
                          alt={locale === 'ar' ? image.alt_text_ar : image.alt_text_en}
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
                  {pendingUploads.map((upload, index) => {
                    const actualIndex = formData.images.length + index;
                    const progress = uploadProgress[upload.id] || 0;
                    
                    return (
                      <div key={`pending-${upload.id}`} className="border rounded-lg p-4 bg-blue-50">
                        <div className="relative mb-3">
                          <img 
                            src={upload.previewUrl} 
                            alt="Preview"
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
                        
                        <div className="space-y-2">
                          <div className="text-xs text-blue-600 text-center">
                            {locale === 'ar' ? 'سيتم رفعها عند الحفظ' : 'Will upload on save'}
                          </div>
                          
                          {progress > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
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
                disabled={loading || pendingUploads.some(u => u.status === 'uploading')}
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
