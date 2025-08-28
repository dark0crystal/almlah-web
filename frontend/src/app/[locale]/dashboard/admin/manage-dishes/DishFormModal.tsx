"use client"
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface Dish {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  governate?: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
  };
  preparation_time_minutes: number;
  serving_size: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_traditional: boolean;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  images: DishImage[];
}

interface DishImage {
  id: string;
  image_url: string;
  alt_text_ar: string;
  alt_text_en: string;
  is_primary: boolean;
  display_order: number;
}

interface Governate {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

interface DishFormData {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  governate_id: string;
  preparation_time_minutes: number;
  serving_size: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_traditional: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  images: {
    image_url: string;
    alt_text_ar: string;
    alt_text_en: string;
    is_primary: boolean;
    display_order: number;
  }[];
}

interface DishFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DishFormData) => Promise<void>;
  dish: Dish | null;
  governates: Governate[];
}

export default function DishFormModal({ isOpen, onClose, onSave, dish, governates }: DishFormModalProps) {
  const [formData, setFormData] = useState<DishFormData>({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    slug: '',
    governate_id: '',
    preparation_time_minutes: 30,
    serving_size: 4,
    difficulty: 'medium',
    is_traditional: true,
    is_featured: false,
    is_active: true,
    sort_order: 1,
    images: []
  });

  const [errors, setErrors] = useState<Partial<DishFormData>>({});
  const [loading, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImage, setNewImage] = useState({
    image_url: '',
    alt_text_ar: '',
    alt_text_en: '',
    is_primary: false,
    display_order: 1
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Reset form when modal opens/closes or dish changes
  useEffect(() => {
    if (isOpen) {
      if (dish) {
        // Edit mode - populate with existing dish data
        setFormData({
          name_ar: dish.name_ar,
          name_en: dish.name_en,
          description_ar: dish.description_ar,
          description_en: dish.description_en,
          slug: dish.slug,
          governate_id: dish.governate?.id || '',
          preparation_time_minutes: dish.preparation_time_minutes,
          serving_size: dish.serving_size,
          difficulty: dish.difficulty,
          is_traditional: dish.is_traditional,
          is_featured: dish.is_featured,
          is_active: dish.is_active,
          sort_order: dish.sort_order,
          images: dish.images.map(img => ({
            image_url: img.image_url,
            alt_text_ar: img.alt_text_ar,
            alt_text_en: img.alt_text_en,
            is_primary: img.is_primary,
            display_order: img.display_order
          }))
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          name_ar: '',
          name_en: '',
          description_ar: '',
          description_en: '',
          slug: '',
          governate_id: '',
          preparation_time_minutes: 30,
          serving_size: 4,
          difficulty: 'medium',
          is_traditional: true,
          is_featured: false,
          is_active: true,
          sort_order: 1,
          images: []
        });
      }
      setErrors({});
      setSelectedFile(null);
      setPreviewUrl('');
    }
  }, [isOpen, dish]);

  // Auto-generate slug from English name
  useEffect(() => {
    if (formData.name_en && !dish) {
      const slug = formData.name_en
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name_en, dish]);

  const validateForm = (): boolean => {
    const newErrors: Partial<DishFormData> = {};

    if (!formData.name_ar.trim()) newErrors.name_ar = 'Arabic name is required';
    if (!formData.name_en.trim()) newErrors.name_en = 'English name is required';
    if (!formData.description_ar.trim()) newErrors.description_ar = 'Arabic description is required';
    if (!formData.description_en.trim()) newErrors.description_en = 'English description is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.governate_id) newErrors.governate_id = 'Governorate is required';
    if (formData.preparation_time_minutes <= 0) newErrors.preparation_time_minutes = 'Preparation time must be positive';
    if (formData.serving_size <= 0) newErrors.serving_size = 'Serving size must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    console.log('Submitting dish data:', formData);

    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving dish:', error);
    } finally {
      setSaving(false);
    }
  };

  // Upload image to storage
  const uploadImageToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'dishes'); // This will create media-bucket/dishes/

    const token = localStorage.getItem('authToken');
    const response = await fetch('http://127.0.0.1:9000/api/v1/upload', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Image upload error:', errorData);
      throw new Error(errorData?.message || 'Failed to upload image');
    }

    const result = await response.json();
    console.log('Image uploaded successfully to dishes folder:', result.data.url);
    return result.data.url;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload and add image
  const uploadAndAddImage = async () => {
    if (!selectedFile && !newImage.image_url.trim()) return;

    try {
      setUploadingImage(true);
      
      let imageUrl = newImage.image_url;
      
      // Upload file if selected
      if (selectedFile) {
        imageUrl = await uploadImageToStorage(selectedFile);
      }

      if (!imageUrl.trim()) return;

      const imageToAdd = {
        ...newImage,
        image_url: imageUrl,
        display_order: formData.images.length + 1
      };

      // If this is set as primary, remove primary from others
      let updatedImages = formData.images;
      if (imageToAdd.is_primary) {
        updatedImages = updatedImages.map(img => ({ ...img, is_primary: false }));
      }

      setFormData(prev => ({
        ...prev,
        images: [...updatedImages, imageToAdd]
      }));

      // Reset form
      setNewImage({
        image_url: '',
        alt_text_ar: '',
        alt_text_en: '',
        is_primary: false,
        display_order: 1
      });
      setSelectedFile(null);
      setPreviewUrl('');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const addImage = uploadAndAddImage;

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        is_primary: i === index
      }))
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {dish ? 'Edit Dish' : 'Add New Dish'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Arabic) *
              </label>
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name_ar ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="اسم الطبق بالعربية"
                dir="rtl"
              />
              {errors.name_ar && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name_ar}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (English) *
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name_en ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Dish name in English"
              />
              {errors.name_en && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name_en}
                </p>
              )}
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Arabic) *
              </label>
              <textarea
                value={formData.description_ar}
                onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description_ar ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="وصف الطبق بالعربية"
                dir="rtl"
              />
              {errors.description_ar && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description_ar}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (English) *
              </label>
              <textarea
                value={formData.description_en}
                onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description_en ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Dish description in English"
              />
              {errors.description_en && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description_en}
                </p>
              )}
            </div>
          </div>

          {/* Slug and Governate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="dish-url-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.slug}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Governorate *
              </label>
              <select
                value={formData.governate_id}
                onChange={(e) => setFormData(prev => ({ ...prev, governate_id: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.governate_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a governorate</option>
                {governates.map(gov => (
                  <option key={gov.id} value={gov.id}>{gov.name_en}</option>
                ))}
              </select>
              {errors.governate_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.governate_id}
                </p>
              )}
            </div>
          </div>

          {/* Time, Serving, Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preparation Time (minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.preparation_time_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, preparation_time_minutes: parseInt(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.preparation_time_minutes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.preparation_time_minutes && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.preparation_time_minutes}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serving Size *
              </label>
              <input
                type="number"
                min="1"
                value={formData.serving_size}
                onChange={(e) => setFormData(prev => ({ ...prev, serving_size: parseInt(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.serving_size ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.serving_size && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.serving_size}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                min="1"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4 pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex items-center space-x-4 pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_traditional}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_traditional: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Traditional</span>
              </label>
            </div>

            <div className="flex items-center space-x-4 pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          {/* Images Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Images</h3>
            
            {/* Existing Images */}
            {formData.images.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative border rounded-lg p-3">
                      <div className="aspect-video bg-gray-100 rounded-md mb-2 overflow-hidden">
                        {image.image_url ? (
                          <img
                            src={image.image_url}
                            alt={image.alt_text_en}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzNEg3MFY2NkgzMFYzNFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="truncate">{image.alt_text_en || 'No description'}</div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded text-xs ${
                            image.is_primary ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {image.is_primary ? 'Primary' : `Order: ${image.display_order}`}
                          </span>
                          <div className="flex gap-1">
                            {!image.is_primary && (
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(index)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Set as primary"
                              >
                                <Upload className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Remove image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Image */}
            <div className="border border-dashed border-gray-300 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Image</h4>
              
              {/* Upload Method Selection */}
              <div className="mb-4">
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadMethod"
                      checked={!selectedFile && !previewUrl}
                      onChange={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enter URL</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadMethod"
                      checked={!!selectedFile || !!previewUrl}
                      onChange={() => {
                        setNewImage(prev => ({ ...prev, image_url: '' }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Upload from device</span>
                  </label>
                </div>

                {/* File Upload Section */}
                {(selectedFile || previewUrl || (!selectedFile && !newImage.image_url)) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="imageUpload"
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md cursor-pointer flex items-center gap-2 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {selectedFile ? 'Change Image' : 'Choose Image'}
                      </label>
                      {selectedFile && (
                        <span className="text-sm text-gray-600">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </div>
                    
                    {/* Image Preview */}
                    {previewUrl && (
                      <div className="mt-3">
                        <div className="w-32 h-32 border rounded-lg overflow-hidden">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* URL Input Section */}
                {!selectedFile && !previewUrl && (
                  <div className="mb-3">
                    <input
                      type="url"
                      placeholder="Image URL"
                      value={newImage.image_url}
                      onChange={(e) => setNewImage(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Image Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Alt text (English)"
                  value={newImage.alt_text_en}
                  onChange={(e) => setNewImage(prev => ({ ...prev, alt_text_en: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Alt text (Arabic)"
                  value={newImage.alt_text_ar}
                  onChange={(e) => setNewImage(prev => ({ ...prev, alt_text_ar: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                />
              </div>

              {/* Primary Image and Add Button */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newImage.is_primary}
                    onChange={(e) => setNewImage(prev => ({ ...prev, is_primary: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Primary Image</span>
                </label>
                <button
                  type="button"
                  onClick={addImage}
                  disabled={(!selectedFile && !newImage.image_url.trim()) || uploadingImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {uploadingImage ? 'Uploading...' : 'Add Image'}
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {loading ? 'Saving...' : (dish ? 'Update Dish' : 'Create Dish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}