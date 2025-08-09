"use client";
import React, { useState, useEffect } from 'react';
import { usePlaceStore, PlaceImage } from '../../../stores/usePlaceStore';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PhotoIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export const ImagesStep: React.FC = () => {
  const {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    setErrors,
    clearErrors,
    errors
  } = usePlaceStore();

  const [localImages, setLocalImages] = useState<PlaceImage[]>(formData.images || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const maxFiles = 10;
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  // Sync with store on mount
  useEffect(() => {
    if (formData.images && formData.images.length > 0) {
      setLocalImages(formData.images);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`;
    }
    if (!acceptedTypes.includes(file.type)) {
      return `File type must be one of: ${acceptedTypes.join(', ')}`;
    }
    return null;
  };

  const processFile = async (file: File, isPrimary: boolean = false): Promise<PlaceImage> => {
    // Create preview URL
    const preview = URL.createObjectURL(file);
    
    return {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      file: file,
      preview: preview,
      alt_text: file.name.split('.')[0], // Use filename without extension as default
      is_primary: isPrimary,
      display_order: localImages.length
    };
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || isProcessing) return;
    
    setIsProcessing(true);
    clearErrors();

    try {
      const newImages: PlaceImage[] = [];
      const errors: string[] = [];

      // Check if adding these files would exceed the limit
      if (localImages.length + files.length > maxFiles) {
        setErrors({ 
          images: `Cannot add ${files.length} files. Maximum ${maxFiles} files allowed (currently have ${localImages.length})` 
        });
        setIsProcessing(false);
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validationError = validateFile(file);
        
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          continue;
        }

        // Make first image primary if no images exist yet
        const isPrimary = localImages.length === 0 && newImages.length === 0;
        const processedImage = await processFile(file, isPrimary);
        newImages.push(processedImage);
      }

      if (errors.length > 0) {
        setErrors({ images: errors.join('; ') });
      }

      if (newImages.length > 0) {
        const updatedImages = [...localImages, ...newImages];
        setLocalImages(updatedImages);
      }

    } catch (error) {
      console.error('Error processing files:', error);
      setErrors({ images: 'Failed to process selected files' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    const imageToRemove = localImages[index];
    
    // Clean up preview URL
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const updatedImages = localImages.filter((_, i) => i !== index);
    
    // If we removed the primary image, make the first remaining image primary
    if (imageToRemove.is_primary && updatedImages.length > 0) {
      updatedImages[0] = { ...updatedImages[0], is_primary: true };
    }
    
    // Update display orders
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      display_order: i
    }));
    
    setLocalImages(reorderedImages);
  };

  const setPrimaryImage = (index: number) => {
    const updatedImages = localImages.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    setLocalImages(updatedImages);
  };

  const updateImageAltText = (index: number, altText: string) => {
    const updatedImages = localImages.map((img, i) => 
      i === index ? { ...img, alt_text: altText } : img
    );
    setLocalImages(updatedImages);
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    clearErrors();

    try {
      // Update form data with current images
      updateFormData({ images: localImages });
      
      console.log('Images saved to form data:', localImages);
      
      // Move to next step
      nextStep();
    } catch (error) {
      console.error('Error saving images:', error);
      setErrors({ images: 'Failed to save images. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipImages = () => {
    // Clear any existing images and move to next step
    updateFormData({ images: [] });
    nextStep();
  };

  const remainingSlots = maxFiles - localImages.length;
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <PhotoIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Photos</h2>
        <p className="text-gray-600">
          Upload high-quality photos to showcase your place. You can always add more later.
        </p>
      </div>

      {/* Upload Area */}
      {remainingSlots > 0 && (
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
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />
          
          <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isProcessing ? 'Processing images...' : 'Drop images here or click to browse'}
          </h3>
          <p className="text-gray-600 mb-4">
            JPG, PNG, WebP • Max: 10MB each • {remainingSlots} remaining
          </p>
          
          <label
            htmlFor="file-upload"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors cursor-pointer"
          >
            {isProcessing ? 'Processing...' : 'Choose Files'}
          </label>
        </div>
      )}

      {/* Current Images */}
      {localImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Images ({localImages.length}/{maxFiles})
            </h3>
            {localImages.filter(img => img.is_primary).length > 0 && (
              <span className="text-sm text-blue-600 flex items-center">
                <StarSolidIcon className="w-4 h-4 mr-1" />
                Primary image selected
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localImages.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                onRemove={() => removeImage(index)}
                onSetPrimary={() => setPrimaryImage(index)}
                onUpdateAltText={(altText) => updateImageAltText(index, altText)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.images && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{errors.images}</p>
          </div>
        </div>
      )}

      {/* Image Count Status */}
      {localImages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CloudArrowUpIcon className="w-5 h-5 text-blue-500" />
              <span className="text-blue-800 font-medium">
                {localImages.length} photo{localImages.length !== 1 ? 's' : ''} ready for upload
              </span>
            </div>
            <div className="text-blue-600 text-sm">
              {localImages.filter(img => img.is_primary).length > 0 && '⭐ Primary photo selected'}
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          💡 Photo Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="space-y-2">
            <p>📷 Choose a clear cover photo first</p>
            <p>🖼️ Add 3-8 photos for best results</p>
            <p>📝 Use descriptive alt text</p>
          </div>
          <div className="space-y-2">
            <p>✨ Show different angles and features</p>
            <p>🌅 Good lighting makes a big difference</p>
            <p>📱 Photos are automatically optimized</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={prevStep}
          disabled={isProcessing}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <div className="space-x-3">
          <button
            type="button"
            onClick={handleSkipImages}
            disabled={isProcessing}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors duration-200"
          >
            Skip Photos
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ChevronRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Next Step Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            6
          </div>
          <div>
            <p className="text-blue-800 font-medium">Next: Properties & Contact Info</p>
            <p className="text-blue-600 text-sm">Add amenities and contact details</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Image Card Component
interface ImageCardProps {
  image: PlaceImage;
  index: number;
  onRemove: () => void;
  onSetPrimary: () => void;
  onUpdateAltText: (altText: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  index,
  onRemove,
  onSetPrimary,
  onUpdateAltText
}) => {
  const [isEditingAlt, setIsEditingAlt] = useState(false);
  const [tempAltText, setTempAltText] = useState(image.alt_text);

  const handleSaveAltText = () => {
    onUpdateAltText(tempAltText);
    setIsEditingAlt(false);
  };

  const handleCancelEdit = () => {
    setTempAltText(image.alt_text);
    setIsEditingAlt(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Image */}
      <div className="aspect-video relative">
        <img
          src={image.preview || image.url}
          alt={image.alt_text}
          className="w-full h-full object-cover"
        />
        
        {/* Primary Badge */}
        {image.is_primary && (
          <div className="absolute top-2 left-2">
            <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1">
              <StarSolidIcon className="w-3 h-3" />
              <span>Cover</span>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
            <button
              onClick={onSetPrimary}
              className="p-2 bg-white rounded-full hover:bg-gray-100"
              title={image.is_primary ? 'Cover image' : 'Set as cover'}
            >
              {image.is_primary ? (
                <StarSolidIcon className="w-4 h-4 text-yellow-500" />
              ) : (
                <StarIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
            
            <button
              onClick={onRemove}
              className="p-2 bg-white rounded-full hover:bg-gray-100"
              title="Remove image"
            >
              <XMarkIcon className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Info */}
      <div className="p-3 space-y-2">
        {/* Alt Text */}
        <div>
          <label className="text-xs font-medium text-gray-700">Alt Text:</label>
          {isEditingAlt ? (
            <div className="mt-1 space-y-2">
              <input
                type="text"
                value={tempAltText}
                onChange={(e) => setTempAltText(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Describe the image..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAltText();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveAltText}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <p 
                className="text-sm text-gray-600 cursor-pointer hover:text-blue-600 border-b border-dashed border-gray-300 hover:border-blue-300"
                onClick={() => setIsEditingAlt(true)}
                title="Click to edit"
              >
                {image.alt_text || 'Click to add description...'}
              </p>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>#{index + 1}</span>
          {image.file && (
            <span>{formatFileSize(image.file.size)}</span>
          )}
        </div>
      </div>
    </div>
  );
};