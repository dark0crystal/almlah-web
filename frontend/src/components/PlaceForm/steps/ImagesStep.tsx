"use client"
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlaceStore, PlaceImage } from '../../../stores/usePlaceStore';
import { imagesSchema, ImagesFormData } from '../../../schemas/placeSchemas';
import { SupabaseStorageService } from '../../../services/supabaseStorage';
import { ChevronLeftIcon, ChevronRightIcon, PhotoIcon, XMarkIcon, StarIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface UploadingImage extends PlaceImage {
  uploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
}

export const ImagesStep: React.FC = () => {
  const {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    addImage,
    removeImage,
    updateImage,
    setPrimaryImage,
    setErrors,
    clearErrors
  } = usePlaceStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    handleSubmit,
    formState: { errors }
  } = useForm<ImagesFormData>({
    defaultValues: {
      images: formData.images
    }
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || isUploading) return;

    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    );

    if (newFiles.length === 0) {
      setErrors({ images: 'Please select valid image files (max 10MB each)' });
      return;
    }

    setIsUploading(true);
    clearErrors();

    // Add files to uploading state with preview
    const uploadingFiles: UploadingImage[] = newFiles.map((file, index) => ({
      id: `uploading-${Date.now()}-${index}`,
      url: '',
      alt_text: '',
      is_primary: formData.images.length === 0 && index === 0,
      display_order: formData.images.length + index,
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      uploadProgress: 0
    }));

    setUploadingImages(uploadingFiles);

    // Upload files to Supabase
    const uploadPromises = uploadingFiles.map(async (imageFile, index) => {
      try {
        // Update progress to show starting
        setUploadingImages(prev => prev.map(img => 
          img.id === imageFile.id ? { ...img, uploadProgress: 1 } : img
        ));

        // Generate unique filename
        const fileName = SupabaseStorageService.generateFileName(imageFile.file!.name);
        
        // Resize image if it's too large
        const resizedFile = await SupabaseStorageService.resizeImage(
          imageFile.file!,
          1920, // max width
          1080, // max height
          0.8   // quality
        );

        // Upload to Supabase with proper folder structure
        // For now, we'll use a temporary folder since we don't have place-id yet
        // This will be moved to proper structure after place creation
        const tempPlaceId = `temp-${Date.now()}`;
        const folder = image.is_primary ? `places/${tempPlaceId}` : `places/${tempPlaceId}/gallery`;
        const finalFileName = image.is_primary ? `cover.${fileName.split('.').pop()}` : fileName;
        
        const result = await SupabaseStorageService.uploadFile({
          bucket: 'media-bucket',
          folder,
          fileName: finalFileName,
          file: resizedFile,
          onProgress: (progress) => {
            setUploadingImages(prev => prev.map(img => 
              img.id === imageFile.id ? { ...img, uploadProgress: progress } : img
            ));
          }
        });

        if (result.success && result.url) {
          // Successfully uploaded
          const uploadedImage: PlaceImage = {
            id: imageFile.id,
            url: result.url,
            alt_text: imageFile.alt_text,
            is_primary: imageFile.is_primary,
            display_order: imageFile.display_order,
            preview: imageFile.preview
          };

          // Add to form data
          addImage(uploadedImage);

          // Remove from uploading state
          setUploadingImages(prev => prev.filter(img => img.id !== imageFile.id));

          return { success: true, image: uploadedImage };
        } else {
          // Upload failed
          setUploadingImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, uploading: false, uploadError: result.error || 'Upload failed' }
              : img
          ));
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadingImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { ...img, uploading: false, uploadError: 'Upload failed' }
            : img
        ));
        return { success: false, error: 'Upload failed' };
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    const failedUploads = results.filter(r => !r.success);
    
    if (failedUploads.length > 0) {
      setErrors({ 
        images: `${failedUploads.length} image(s) failed to upload. Please try again.` 
      });
    }

    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = async (index: number) => {
    const image = formData.images[index];
    
    // If it's a Supabase image, delete from storage
    if (image.url && image.url.includes('supabase') && image.supabase_path) {
      try {
        await SupabaseStorageService.deleteFile('media-bucket', image.supabase_path);
      } catch (error) {
        console.error('Failed to delete image from storage:', error);
      }
    }

    // Clean up preview URL
    if (image.preview) {
      URL.revokeObjectURL(image.preview);
    }

    removeImage(index);
  };

  const handleRemoveUploadingImage = (imageId: string) => {
    const image = uploadingImages.find(img => img.id === imageId);
    if (image && image.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setUploadingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const retryUpload = async (imageId: string) => {
    const image = uploadingImages.find(img => img.id === imageId);
    if (!image || !image.file) return;

    setUploadingImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, uploading: true, uploadError: undefined, uploadProgress: 0 }
        : img
    ));

    try {
      const tempPlaceId = `temp-${Date.now()}`;
      const folder = image.is_primary ? `places/${tempPlaceId}` : `places/${tempPlaceId}/gallery`;
      const finalFileName = image.is_primary ? `cover.${image.file.name.split('.').pop()}` : SupabaseStorageService.generateFileName(image.file.name);
      
      const resizedFile = await SupabaseStorageService.resizeImage(image.file);

      const result = await SupabaseStorageService.uploadFile({
        bucket: 'media-bucket',
        folder,
        fileName: finalFileName,
        file: resizedFile,
        onProgress: (progress) => {
          setUploadingImages(prev => prev.map(img => 
            img.id === imageId ? { ...img, uploadProgress: progress } : img
          ));
        }
      });

      if (result.success && result.url) {
        const uploadedImage: PlaceImage = {
          id: image.id,
          url: result.url,
          alt_text: image.alt_text,
          is_primary: image.is_primary,
          display_order: image.display_order,
          preview: image.preview
        };

        addImage(uploadedImage);
        setUploadingImages(prev => prev.filter(img => img.id !== imageId));
      } else {
        setUploadingImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, uploading: false, uploadError: result.error || 'Upload failed' }
            : img
        ));
      }
    } catch (error) {
      setUploadingImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, uploading: false, uploadError: 'Upload failed' }
          : img
      ));
    }
  };

  const onSubmit = (data: ImagesFormData) => {
    if (formData.images.length === 0 && uploadingImages.length === 0) {
      setErrors({ images: 'Please add at least one image' });
      return;
    }

    if (uploadingImages.length > 0) {
      setErrors({ images: 'Please wait for all images to finish uploading' });
      return;
    }

    updateFormData({ images: formData.images });
    clearErrors();
    nextStep();
  };

  const onError = () => {
    if (formData.images.length === 0) {
      setErrors({ images: 'Please add at least one image' });
    }
  };

  const totalImages = formData.images.length + uploadingImages.length;

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Photos</h2>
        <p className="text-gray-600">
          Upload high-quality photos to showcase your place. Images are automatically optimized and stored securely.
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${dragOver 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={isUploading}
        />
        
        <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isUploading ? 'Uploading...' : 'Drop photos here or click to browse'}
        </h3>
        <p className="text-gray-600 mb-4">
          Support: JPG, PNG, WebP • Max: 10MB per image • Auto-optimized
        </p>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Choose Files'}
        </button>
      </div>

      {errors.images && (
        <p className="text-red-500 text-sm text-center">{errors.images}</p>
      )}

      {/* Uploading Images */}
      {uploadingImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Uploading ({uploadingImages.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadingImages.map((image) => (
              <div key={image.id} className="relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.preview}
                    alt="Uploading..."
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Upload Progress Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  {image.uploading ? (
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <div className="text-sm">{Math.round(image.uploadProgress || 0)}%</div>
                    </div>
                  ) : image.uploadError ? (
                    <div className="text-white text-center p-2">
                      <XMarkIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                      <div className="text-xs mb-2">{image.uploadError}</div>
                      <button
                        onClick={() => retryUpload(image.id!)}
                        className="text-xs bg-blue-500 px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Retry
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveUploadingImage(image.id!)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images */}
      {formData.images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            Your Photos ({formData.images.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.preview || image.url}
                    alt={image.alt_text}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title={image.is_primary ? 'Main photo' : 'Set as main photo'}
                    >
                      {image.is_primary ? (
                        <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <StarIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Remove photo"
                    >
                      <XMarkIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1">
                      <StarSolidIcon className="w-3 h-3" />
                      <span>Main</span>
                    </div>
                  </div>
                )}

                {/* Alt Text Input */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Image description (optional)"
                    value={image.alt_text}
                    onChange={(e) => updateImage(index, { alt_text: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-gray-600 bg-green-50 p-4 rounded-lg">
            <p>✅ All images uploaded successfully to secure cloud storage</p>
            <p className="mt-1">💡 Tip: Set your best photo as the main photo by clicking the star icon</p>
          </div>
        </div>
      )}

      {/* Upload Status */}
      {totalImages > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-blue-900">
              {formData.images.length} uploaded, {uploadingImages.length} pending
            </span>
            {isUploading && (
              <span className="text-blue-600">Uploading to secure cloud storage...</span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={prevStep}
          disabled={isUploading}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <button
          type="submit"
          disabled={formData.images.length === 0 || isUploading || uploadingImages.length > 0}
          className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
        >
          <span>Continue</span>
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};