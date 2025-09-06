// Enhanced Place Management Component with Backend Image Integration

"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Calendar,
  Users,
  FileImage,
  MoreVertical,
  AlertTriangle,
  X,
  Loader2,
  Star,
  RefreshCw,
  Upload
} from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api/v1';

// Interface for API query parameters
interface PlaceQueryParams {
  search?: string;
  categoryId?: string;
  governateId?: string;
}

// Enhanced API Service for place management with image support
const placeService = {
  // Get all places with images
  getAllPlaces: async (params: PlaceQueryParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('q', params.search);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.governateId) queryParams.append('governateId', params.governateId);
    
    const url = queryParams.toString() 
      ? `${API_BASE_URL}/places?${queryParams.toString()}`
      : `${API_BASE_URL}/places`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch places: ${response.statusText}`);
    }

    return response.json();
  },

  // Get place by ID with full image data
  getPlaceById: async (placeId) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch place: ${response.statusText}`);
    }

    return response.json();
  },

  // Get place images separately
  getPlaceImages: async (placeId) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}/images`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch place images: ${response.statusText}`);
    }

    return response.json();
  },

  // Upload new images
  uploadImages: async (placeId, imageFiles, imageData) => {
    const formData = new FormData();
    
    // Prepare image metadata
    const imageMetadata = imageData.map((data, index) => ({
      image_url: '', // Will be set by backend after upload
      alt_text: data.altText || '',
      is_primary: data.isPrimary || false,
      display_order: data.displayOrder || index + 1
    }));

    // Add the JSON data
    formData.append('data', JSON.stringify({ images: imageMetadata }));
    
    // Add image files
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${API_BASE_URL}/places/${placeId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload images: ${response.statusText}`);
    }

    return response.json();
  },

  // Update image metadata
  updateImage: async (placeId, imageId, imageData) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}/images/${imageId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update image: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete image
  deleteImage: async (placeId, imageId) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }

    return response.json();
  },

  // Update place
  updatePlace: async (placeId, data) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update place: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete place with cleanup
  deletePlace: async (placeId) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete place: ${response.statusText}`);
    }

    return response.json();
  },

  // Content Section Images
  getContentSectionImages: async (sectionId) => {
    const response = await fetch(`${API_BASE_URL}/content-sections/${sectionId}/images`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content section images: ${response.statusText}`);
    }

    return response.json();
  },

  uploadContentSectionImages: async (sectionId, imageFiles, imageData) => {
    const formData = new FormData();
    
    const imageMetadata = imageData.map((data, index) => ({
      image_url: '',
      alt_text_ar: data.altTextAr || '',
      alt_text_en: data.altTextEn || '',
      caption_ar: data.captionAr || '',
      caption_en: data.captionEn || '',
      sort_order: data.sortOrder || index + 1
    }));

    formData.append('data', JSON.stringify({ images: imageMetadata }));
    
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${API_BASE_URL}/content-sections/${sectionId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload content section images: ${response.statusText}`);
    }

    return response.json();
  },

  deleteContentSectionImage: async (sectionId, imageId) => {
    const response = await fetch(`${API_BASE_URL}/content-sections/${sectionId}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete content section image: ${response.statusText}`);
    }

    return response.json();
  }
};

// Enhanced Image Manager Component
const ImageManager = ({ placeId, images, onImagesChange, loading }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const refreshImages = async () => {
    try {
      const response = await placeService.getPlaceImages(placeId);
      if (response.success) {
        onImagesChange(response.data || []);
      }
    } catch (err) {
      console.error('Error refreshing images:', err);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const fileArray = Array.from(files);
      
      // Prepare image data
      const imageData = fileArray.map((file, index) => ({
        altText: '',
        isPrimary: images.length === 0 && index === 0,
        displayOrder: images.length + index + 1
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload images
      const response = await placeService.uploadImages(placeId, fileArray, imageData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        // Refresh images from backend
        await refreshImages();
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      alert(`Failed to upload images: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const updateImageMetadata = async (imageId, updates) => {
    try {
      const response = await placeService.updateImage(placeId, imageId, updates);
      if (response.success) {
        await refreshImages();
      }
    } catch (err) {
      console.error('Error updating image:', err);
      alert(`Failed to update image: ${err.message}`);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      const response = await placeService.deleteImage(placeId, imageId);
      if (response.success) {
        await refreshImages();
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert(`Failed to delete image: ${err.message}`);
    }
  };

  const setPrimaryImage = async (imageId) => {
    try {
      const response = await placeService.updateImage(placeId, imageId, { is_primary: true });
      if (response.success) {
        await refreshImages();
      }
    } catch (err) {
      console.error('Error setting primary image:', err);
      alert(`Failed to set primary image: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Images ({images.length})</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshImages}
            disabled={loading || uploading}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50">
            <Upload className="w-4 h-4" />
            Upload Images
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">Uploading images... {uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          Drag and drop images here, or{' '}
          <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
            click to browse
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: JPG, PNG, WebP, GIF (max 10MB each)
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading images...</span>
        </div>
      )}

      {/* Images Grid */}
      {!loading && images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden">
              <div className="relative">
                <Image
                  src={image.image_url}
                  alt={image.alt_text || 'Place image'}
                  width={400}
                  height={128}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg'; // Add a placeholder image
                  }}
                />
                
                {/* Primary badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Primary
                  </div>
                )}

                {/* Display order badge */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  #{image.display_order}
                </div>

                {/* Actions */}
                <div className="absolute bottom-2 right-2 flex gap-1">
                  {!image.is_primary && (
                    <button
                      onClick={() => setPrimaryImage(image.id)}
                      className="w-7 h-7 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100"
                      title="Set as primary"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="w-7 h-7 bg-red-500 bg-opacity-90 text-white rounded-full flex items-center justify-center hover:bg-opacity-100"
                    title="Delete image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <input
                  type="text"
                  placeholder="Alt text (for accessibility)"
                  value={image.alt_text || ''}
                  onChange={(e) => updateImageMetadata(image.id, { alt_text: e.target.value })}
                  onBlur={(e) => updateImageMetadata(image.id, { alt_text: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Order: {image.display_order}</span>
                  <span>
                    {new Date(image.upload_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && images.length === 0 && (
        <div className="text-center py-8">
          <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-600 mb-4">
            Upload some images to showcase this place
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload First Image
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>
        </div>
      )}
    </div>
  );
};

// Enhanced Place Card Component with proper image handling
const PlaceCard = ({ place, onEdit, onDelete, onView }) => {
  const [showActions, setShowActions] = useState(false);
  
  // Handle image URL properly from backend
  const primaryImage = place.images?.find(img => img.is_primary) || place.images?.[0];
  const imageCount = place.images?.length || 0;
  const sectionCount = place.content_sections?.length || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {primaryImage ? (
          <Image 
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || place.name_en}
            fill
            className="object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-image.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileImage className="w-12 h-12 text-gray-400" />
            <span className="text-gray-500 text-sm mt-2">No image</span>
          </div>
        )}
        
        {/* Image count badge */}
        {imageCount > 0 && (
          <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
            <FileImage className="w-3 h-3" />
            {imageCount}
          </div>
        )}

        {/* Actions dropdown */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border py-1 min-w-32 z-10">
                <button
                  onClick={() => {
                    onView(place);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => {
                    onEdit(place);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(place);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
              {place.name_en}
            </h3>
            <p className="text-sm text-gray-600 mb-1">{place.name_ar}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {place.description_en}
        </p>

        {/* Location */}
        {(place.governate || place.wilayah) && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin className="w-4 h-4" />
            <span>
              {place.wilayah?.name_en || ''}{place.wilayah && place.governate ? ', ' : ''}{place.governate?.name_en || ''}
            </span>
          </div>
        )}

        {/* Categories */}
        {place.categories && place.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {place.categories.slice(0, 2).map((category) => (
              <span 
                key={category.id}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {category.name_en}
              </span>
            ))}
            {place.categories.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{place.categories.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileImage className="w-3 h-3" />
              {imageCount} images
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {sectionCount} sections
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(place.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete confirmation modal component (unchanged)
const DeleteConfirmModal = ({ place, isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen || !place) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Place</h3>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            Are you sure you want to delete &quot;<strong>{place.name_en}</strong>&quot;?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will permanently delete:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
              <li>The place and all its data</li>
              <li>All associated images ({place.images?.length || 0} images)</li>
              <li>All content sections ({place.content_sections?.length || 0} sections)</li>
              <li>All reviews and ratings</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(place.id)}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Place
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export { placeService, ImageManager, PlaceCard, DeleteConfirmModal };