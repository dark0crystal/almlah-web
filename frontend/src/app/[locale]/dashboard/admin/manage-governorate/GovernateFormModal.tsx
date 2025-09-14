// components/GovernateFormModal.tsx - Updated with proper image upload integration
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Save, Image as ImageIcon } from 'lucide-react';
import SimpleImageSelector from '@/components/SimpleImageSelector';
import { SupabaseStorageService } from '@/services/supabaseStorage';
import { ExistingImage } from '@/types/image';

interface ApiImage {
  id?: string;
  image_url?: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

interface Governate {
  id?: string;
  name_ar?: string;
  name_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  description_ar?: string;
  description_en?: string;
  slug?: string;
  latitude?: number | string;
  longitude?: number | string;
  sort_order?: number | string;
  images?: ApiImage[];
  gallery_images?: string;
}

interface GovernateFormData {
  name_ar: string;
  name_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  latitude: number | string;
  longitude: number | string;
  sort_order: number | string;
  gallery_images?: string;
}

interface GovernateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  governate: Governate | null;
  onSave: (id: string | null, data: GovernateFormData) => Promise<unknown>;
  currentLang: string;
}

// Utility function to generate slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to parse gallery images from the API response
const parseApiImages = (apiImages: ApiImage[]): ExistingImage[] => {
  if (!Array.isArray(apiImages)) return [];
  
  return apiImages.map((img: ApiImage, index: number) => ({
    id: img.id || `existing-${index}`,
    path: img.image_url ? img.image_url.replace(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_STORAGE_BUCKET}/`, '') : '',
    alt_text: img.alt_text || '',
    caption: '', // API doesn't have caption for governate images
    is_primary: img.is_primary || false,
    display_order: img.display_order || index,
    url: img.image_url
  }));
};

// Helper function to parse legacy gallery_images JSON field
const parseGalleryImages = (galleryImagesJson: string | null): ExistingImage[] => {
  if (!galleryImagesJson) return [];
  
  try {
    const parsed = JSON.parse(galleryImagesJson);
    return Array.isArray(parsed) ? parsed.map((img: Record<string, unknown>, index: number) => ({
      id: String(img.id || `existing-${index}`),
      path: String(img.path || ''),
      alt_text: String(img.alt_text || ''),
      caption: String(img.caption || ''),
      is_primary: Boolean(img.is_primary || false),
      display_order: Number(img.display_order || index),
      url: String(img.url || '')
    })) : [];
  } catch (error) {
    console.error('Error parsing gallery images:', error);
    return [];
  }
};

export const GovernateFormModal: React.FC<GovernateFormModalProps> = ({ 
  isOpen, 
  onClose, 
  governate, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    subtitle_ar: '',
    subtitle_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    latitude: '',
    longitude: '',
    sort_order: '0'
  });
  const [galleryImages, setGalleryImages] = useState<ExistingImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (governate) {
      setFormData({
        name_ar: governate.name_ar || '',
        name_en: governate.name_en || '',
        subtitle_ar: governate.subtitle_ar || '',
        subtitle_en: governate.subtitle_en || '',
        slug: governate.slug || '',
        description_ar: governate.description_ar || '',
        description_en: governate.description_en || '',
        latitude: governate.latitude?.toString() || '',
        longitude: governate.longitude?.toString() || '',
        sort_order: governate.sort_order?.toString() || '0'
      });
      
      // Parse images from API response (preferred) or legacy JSON field
      let parsedImages: ExistingImage[] = [];
      if (governate.images && Array.isArray(governate.images)) {
        parsedImages = parseApiImages(governate.images);
      } else if (governate.gallery_images) {
        parsedImages = parseGalleryImages(governate.gallery_images);
      }
      setGalleryImages(parsedImages);
    } else {
      setFormData({
        name_ar: '',
        name_en: '',
        subtitle_ar: '',
        subtitle_en: '',
        slug: '',
        description_ar: '',
        description_en: '',
        latitude: '',
        longitude: '',
        sort_order: '0'
      });
      setGalleryImages([]);
    }
    setPendingFiles([]);
    setErrors({});
    setUploadProgress(0);
  }, [governate, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from English name
    if (name === 'name_en' && !governate) {
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

  const handleImagesChange = (images: ExistingImage[]) => {
    setGalleryImages(images);
  };

  const handleNewFiles = (files: File[]) => {
    setPendingFiles(files);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name_ar.trim()) newErrors.name_ar = 'Arabic name is required';
    if (!formData.name_en.trim()) newErrors.name_en = 'English name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';

    // Validate numeric fields
    if (formData.latitude && (isNaN(Number(formData.latitude)) || Math.abs(parseFloat(formData.latitude)) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude && (isNaN(Number(formData.longitude)) || Math.abs(parseFloat(formData.longitude)) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImagesToSupabase = async (governateId: string): Promise<ExistingImage[]> => {
    if (pendingFiles.length === 0) return [];

    const imagesToUpload = pendingFiles.map((file, index) => {
      const matchingImage = galleryImages.find(img => img.id.startsWith('pending-'));
      return {
        file,
        isPrimary: matchingImage?.is_primary || index === 0,
        altText: matchingImage?.alt_text || '',
        displayOrder: matchingImage?.display_order || index + 1
      };
    });

    try {
      setUploadProgress(25);
      console.log(`📤 Starting Supabase upload for governate ${governateId}:`, imagesToUpload.length, 'images');
      console.log(`📦 Storage bucket: ${process.env.NEXT_PUBLIC_STORAGE_BUCKET}`);
      
      const uploadedImages = await SupabaseStorageService.uploadGovernateImages(governateId, imagesToUpload);
      console.log(`✅ Supabase upload completed:`, uploadedImages);
      setUploadProgress(75);

      // Convert to API format for governate image upload
      const imageRequests = uploadedImages.map(img => ({
        image_url: img.url,
        alt_text: img.altText,
        is_primary: img.isPrimary,
        display_order: img.displayOrder
      }));

      setUploadProgress(90);

      // Call API to save image records to database
      console.log('📨 Saving image records to database:', imageRequests);
      console.log('🌐 API endpoint:', `${process.env.NEXT_PUBLIC_API_HOST}/api/v1/governates/${governateId}/images`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/v1/governates/${governateId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ images: imageRequests })
      });

      console.log('📊 Database save response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Database save failed:', errorText);
        throw new Error(`Failed to save image records to database: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Database save result:', result);
      setUploadProgress(100);
      
      return result.data?.governate_images || [];
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData: GovernateFormData = { 
        ...formData,
        // Convert numeric fields
        latitude: formData.latitude ? parseFloat(String(formData.latitude)) : '',
        longitude: formData.longitude ? parseFloat(String(formData.longitude)) : '',
        sort_order: formData.sort_order ? parseInt(String(formData.sort_order)) || 0 : 0
      };

      // Save the governate first
      const savedGovernate = await onSave(governate?.id || null, submitData) as { id: string } | undefined;
      const governateId = governate?.id || savedGovernate?.id;

      // Upload new images if any
      if (pendingFiles.length > 0 && governateId) {
        console.log(`🚀 Uploading ${pendingFiles.length} images to governates/${governateId}/`);
        await uploadImagesToSupabase(governateId);
      }

      // Update existing images metadata if changed
      if (galleryImages.length > 0 && !pendingFiles.length) {
        // Handle existing image updates via API if needed
        for (const img of galleryImages) {
          if (img.id && !img.id.startsWith('pending-')) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/v1/governates/${governateId}/images/${img.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                  alt_text: img.alt_text,
                  is_primary: img.is_primary,
                  display_order: img.display_order
                })
              });
            } catch (error) {
              console.warn('Failed to update image metadata:', error);
            }
          }
        }
      }

      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ general: (error as Error).message });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {governate ? 'Edit Governate' : 'Add New Governate'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
              
              {/* Names */}
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
                    placeholder="Governate name in English"
                  />
                  {errors.name_en && <p className="text-red-500 text-sm mt-1">{errors.name_en}</p>}
                </div>
              </div>

              {/* Subtitles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arabic Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle_ar"
                    value={formData.subtitle_ar}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="العنوان الفرعي بالعربية"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle_en"
                    value={formData.subtitle_en}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Subtitle in English"
                  />
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
                  placeholder="governate-slug"
                />
                {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arabic Description
                  </label>
                  <textarea
                    name="description_ar"
                    value={formData.description_ar}
                    onChange={handleInputChange}
                    rows={4}
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
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description in English"
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.latitude ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.000000"
                  />
                  {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="0.000001"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.longitude ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.000000"
                  />
                  {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
                </div>
              </div>

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
                <p className="text-sm text-gray-500 mt-1">
                  Lower numbers appear first. Use this to control the display order.
                </p>
              </div>
            </div>

            {/* Right Column - Image Gallery */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                  <ImageIcon className="mr-2" size={20} />
                  Image Gallery
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <SimpleImageSelector
                  existingImages={galleryImages}
                  onImagesChange={handleImagesChange}
                  onNewFiles={handleNewFiles}
                  maxFiles={15}
                  disabled={loading}
                />
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading images to governates/{governate?.id || 'new'}...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {(galleryImages.length > 0 || pendingFiles.length > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center text-blue-700 text-sm">
                    <ImageIcon className="mr-2" size={16} />
                    <span>
                      {galleryImages.length} existing image{galleryImages.length !== 1 ? 's' : ''}
                      {pendingFiles.length > 0 && (
                        <>, {pendingFiles.length} new image{pendingFiles.length !== 1 ? 's' : ''} ready</>
                      )}
                    </span>
                  </div>
                  {pendingFiles.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      New images will be uploaded to governates/{governate?.id || 'new-governate'} folder
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 transition-colors"
              disabled={loading}
            >
              <Save className="mr-2" size={16} />
              {loading ? (
                uploadProgress > 0 ? `Uploading... ${Math.round(uploadProgress)}%` : 'Saving...'
              ) : 'Save Governate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};