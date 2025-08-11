// Simple Image Manager Component
// Usage: Replace your existing PlaceImageManager with this

import React, { useState, useEffect } from 'react';
import { Upload, FileImage, Loader2, RefreshCw, Star, X } from 'lucide-react';
import { placeImageService } from '../../../../services/placeImageService';

const SimpleImageManager = ({ placeId, onImageCountChange }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (placeId) {
      loadImages();
    }
  }, [placeId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await placeImageService.getPlaceImages(placeId);
      if (response.success) {
        const imageData = response.data || [];
        setImages(imageData);
        onImageCountChange?.(imageData.length);
      }
    } catch (err) {
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const fileArray = Array.from(files);
      
      // Validate files
      for (const file of fileArray) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image.`);
        }
      }

      // Prepare metadata
      const imageMetadata = fileArray.map((file, index) => ({
        altText: '',
        isPrimary: images.length === 0 && index === 0,
        displayOrder: images.length + index + 1
      }));

      // Show progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Upload using simple service
      const result = await placeImageService.uploadImages(placeId, fileArray, imageMetadata);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        // Reload images
        await loadImages();
        alert('Images uploaded successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }

      // Reset progress
      setTimeout(() => setUploadProgress(0), 1000);

    } catch (err) {
      console.error('Error uploading images:', err);
      alert(`Failed to upload images: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const updateImageMetadata = async (imageId, updates) => {
    try {
      const response = await placeImageService.updateImage(placeId, imageId, updates);
      if (response.success) {
        await loadImages();
      }
    } catch (err) {
      console.error('Error updating image:', err);
      alert(`Failed to update image: ${err.message}`);
    }
  };

  const deleteImage = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image? This will also delete it from storage.')) return;

    try {
      const response = await placeImageService.deleteImage(placeId, imageId);
      if (response.success) {
        await loadImages();
        alert('Image deleted successfully!');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert(`Failed to delete image: ${err.message}`);
    }
  };

  const setPrimaryImage = async (imageId) => {
    try {
      const response = await placeImageService.updateImage(placeId, imageId, { is_primary: true });
      if (response.success) {
        await loadImages();
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
            onClick={loadImages}
            disabled={loading || uploading}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
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
            <span className="text-sm text-blue-800">Uploading to Supabase and saving to database... {uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Simple Drop Zone */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
          Images will be uploaded to Supabase Storage automatically
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
                <img
                  src={image.image_url}
                  alt={image.alt_text || 'Place image'}
                  className="w-full h-32 object-cover"
                />
                
                {/* Primary badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Primary
                  </div>
                )}

                {/* Display order */}
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
                  placeholder="Alt text"
                  value={image.alt_text || ''}
                  onChange={(e) => {
                    // Update local state for immediate feedback
                    setImages(prev => prev.map(img => 
                      img.id === image.id ? { ...img, alt_text: e.target.value } : img
                    ));
                  }}
                  onBlur={(e) => updateImageMetadata(image.id, { alt_text: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Order: {image.display_order}</span>
                  <span>{new Date(image.upload_date).toLocaleDateString()}</span>
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
          <p className="text-gray-600 mb-4">Upload images to showcase this place</p>
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

export default SimpleImageManager;