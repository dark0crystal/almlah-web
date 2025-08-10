import React from 'react';
import { X, Save, ImageIcon } from 'lucide-react';
import SimpleImageSelector from '@/components/SimpleImageSelector';
import { ExistingImage } from '@/types/image';

interface WilayahModalProps {
  showModal: boolean;
  editingWilayah: any;
  formData: {
    governate_id: string;
    name_ar: string;
    name_en: string;
    subtitle_ar: string;
    subtitle_en: string;
    slug: string;
    description_ar: string;
    description_en: string;
    latitude: string;
    longitude: string;
    sort_order: string;
  };
  errors: Record<string, string>;
  governates: any[];
  existingImages: ExistingImage[];
  submitLoading: boolean;
  imageUploadProgress: number;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (field: string, value: any) => void;
  onNameEnChange: (value: string) => void;
  onExistingImagesChange: (images: ExistingImage[]) => void;
  onNewImagesChange: (files: File[]) => void;
}

const WilayahModal: React.FC<WilayahModalProps> = ({
  showModal,
  editingWilayah,
  formData,
  errors,
  governates,
  existingImages,
  submitLoading,
  imageUploadProgress,
  onClose,
  onSubmit,
  onFormDataChange,
  onNameEnChange,
  onExistingImagesChange,
  onNewImagesChange,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingWilayah ? 'Edit Wilayah' : 'Add New Wilayah'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={submitLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              {/* Governate Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Governate *
                </label>
                <select
                  value={formData.governate_id}
                  onChange={(e) => onFormDataChange('governate_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.governate_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={submitLoading}
                >
                  <option value="">Select a governate</option>
                  {governates.map(gov => (
                    <option key={gov.id} value={gov.id}>{gov.name_en}</option>
                  ))}
                </select>
                {errors.governate_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.governate_id}</p>
                )}
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arabic Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => onFormDataChange('name_ar', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name_ar ? 'border-red-300' : 'border-gray-300'
                    }`}
                    dir="rtl"
                    disabled={submitLoading}
                    placeholder="الاسم بالعربية"
                  />
                  {errors.name_ar && (
                    <p className="text-red-500 text-sm mt-1">{errors.name_ar}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => onNameEnChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name_en ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={submitLoading}
                    placeholder="Wilayah name in English"
                  />
                  {errors.name_en && (
                    <p className="text-red-500 text-sm mt-1">{errors.name_en}</p>
                  )}
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
                    value={formData.subtitle_ar}
                    onChange={(e) => onFormDataChange('subtitle_ar', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    dir="rtl"
                    disabled={submitLoading}
                    placeholder="العنوان الفرعي بالعربية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_en}
                    onChange={(e) => onFormDataChange('subtitle_en', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={submitLoading}
                    placeholder="Subtitle in English"
                  />
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => onFormDataChange('slug', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.slug ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={submitLoading}
                  placeholder="wilayah-slug"
                />
                {errors.slug && (
                  <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                )}
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arabic Description
                  </label>
                  <textarea
                    value={formData.description_ar}
                    onChange={(e) => onFormDataChange('description_ar', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    dir="rtl"
                    disabled={submitLoading}
                    placeholder="الوصف بالعربية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Description
                  </label>
                  <textarea
                    value={formData.description_en}
                    onChange={(e) => onFormDataChange('description_en', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={submitLoading}
                    placeholder="Description in English"
                  />
                </div>
              </div>

              {/* Geographic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Geographic Information
                </h3>
                
                {/* Coordinates and Sort Order */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={(e) => onFormDataChange('latitude', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={submitLoading}
                      placeholder="0.000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={(e) => onFormDataChange('longitude', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={submitLoading}
                      placeholder="0.000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => onFormDataChange('sort_order', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={submitLoading}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Image Management */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Images
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <SimpleImageSelector
                  existingImages={existingImages}
                  onImagesChange={onExistingImagesChange}
                  onNewFiles={onNewImagesChange}
                  maxFiles={10}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                  disabled={submitLoading}
                />
                
                {submitLoading && imageUploadProgress > 0 && imageUploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading images to wilayahs/{editingWilayah?.id || 'new'}...</span>
                      <span>{Math.round(imageUploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${imageUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {(existingImages.length > 0 || submitLoading) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center text-blue-700 text-sm">
                    <ImageIcon className="mr-2" size={16} />
                    <span>
                      {existingImages.length} image{existingImages.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  {submitLoading && (
                    <div className="text-xs text-blue-600 mt-1">
                      Images will be uploaded to wilayahs/{editingWilayah?.id || 'new-wilayah'} folder
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {submitLoading && imageUploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading images...</span>
                <span>{Math.round(imageUploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${imageUploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              disabled={submitLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              {submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {imageUploadProgress > 0 ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingWilayah ? 'Update' : 'Create'} Wilayah
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WilayahModal;