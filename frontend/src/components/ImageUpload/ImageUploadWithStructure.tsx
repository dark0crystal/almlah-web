// components/ImageUpload/ImageUploadWithStructure.tsx - Enhanced integration
"use client";
import React, { useState, useRef } from 'react';
import { PlaceImage } from '../../stores/usePlaceStore';
import { 
  processMultipleImageFiles, 
  setPrimaryImage, 
  reorderImages, 
  updatePlaceImageMetadata,
  formatFileSize,
  cleanupImagePreviews
} from '../../utils/imageUploadUtils';
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  XMarkIcon, 
  StarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface ImageUploadProps {
  images: PlaceImage[];
  onImagesChange: (images: PlaceImage[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export const ImageUploadWithStructure: React.FC<ImageUploadProps> = ({
  images = [],
  onImagesChange,
  maxFiles = 10,
  disabled = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || disabled || isProcessing) return;
    
    setIsProcessing(true);
    setErrors([]);

    try {
      // Check if adding these files would exceed the limit
      if (images.length + files.length > maxFiles) {
        setErrors([`Cannot add ${files.length} files. Maximum ${maxFiles} files allowed (currently have ${images.length})`]);
        setIsProcessing(false);
        return;
      }

      // Process the selected files
      const result = await processMultipleImageFiles(
        files, 
        images.length, // Start display order from current image count
        images.length === 0 // Make first image primary if no images exist
      );

      if (result.errors.length > 0) {
        setErrors(result.errors);
      }

      if (result.images.length > 0) {
        const updatedImages = [...images, ...result.images];
        onImagesChange(updatedImages);
      }

    } catch (error) {
      console.error('Error processing files:', error);
      setErrors(['Failed to process selected files']);
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
    const imageToRemove = images[index];
    
    // Clean up preview URL
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const updatedImages = images.filter((_, i) => i !== index);
    
    // If we removed the primary image, make the first remaining image primary
    if (imageToRemove.is_primary && updatedImages.length > 0) {
      updatedImages[0] = { ...updatedImages[0], is_primary: true };
    }
    
    // Update display orders
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      display_order: i
    }));
    
    onImagesChange(reorderedImages);
  };

  const makeImagePrimary = (index: number) => {
    const updatedImages = setPrimaryImage(images, index);
    onImagesChange(updatedImages);
  };

  const updateImageAltText = (index: number, altText: string) => {
    const updatedImages = images.map((img, i) => 
      i === index ? updatePlaceImageMetadata(img, { altText }) : img
    );
    onImagesChange(updatedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const reorderedImages = reorderImages(images, fromIndex, toIndex);
    onImagesChange(reorderedImages);
  };

  const remainingSlots = maxFiles - images.length;

  return (
    <div className={`space-y-6 ${className}`}>
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
            ${disabled || isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled || isProcessing}
          />
          
          <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isProcessing ? 'Processing images...' : 'Drop images here or click to browse'}
          </h3>
          <p className="text-gray-600 mb-4">
            JPG, PNG, WebP • Max: 10MB each • {remainingSlots} remaining
          </p>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessing}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Choose Files'}
          </button>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Upload Errors</p>
              <ul className="text-red-600 text-sm mt-1 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Current Images */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              Images ({images.length}/{maxFiles})
            </h3>
            {images.filter(img => img.is_primary).length > 0 && (
              <span className="text-sm text-blue-600 flex items-center">
                <StarSolidIcon className="w-4 h-4 mr-1" />
                Primary image selected
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                onRemove={() => removeImage(index)}
                onMakePrimary={() => makeImagePrimary(index)}
                onUpdateAltText={(altText) => updateImageAltText(index, altText)}
                onMoveUp={index > 0 ? () => moveImage(index, index - 1) : undefined}
                onMoveDown={index < images.length - 1 ? () => moveImage(index, index + 1) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Images State */}
      {images.length === 0 && !isProcessing && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No images added yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Add high-quality photos to showcase your place
          </p>
        </div>
      )}

      {/* File Structure Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📁 File Organization</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Cover image: <code className="bg-blue-100 px-1 rounded">places/{'{place-id}'}/cover.jpg</code></p>
          <p>• Gallery images: <code className="bg-blue-100 px-1 rounded">places/{'{place-id}'}/gallery/001.jpg</code></p>
          <p>• Images are automatically optimized and organized</p>
        </div>
      </div>
    </div>
  );
};

// Individual Image Card Component
interface ImageCardProps {
  image: PlaceImage;
  index: number;
  onRemove: () => void;
  onMakePrimary: () => void;
  onUpdateAltText: (altText: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  index,
  onRemove,
  onMakePrimary,
  onUpdateAltText,
  onMoveUp,
  onMoveDown
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
              onClick={onMakePrimary}
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

        {/* Movement Controls */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {onMoveUp && (
              <button
                onClick={onMoveUp}
                className="p-1 text-gray-600 hover:text-blue-600"
                title="Move up"
              >
                <ArrowsUpDownIcon className="w-3 h-3 rotate-180" />
              </button>
            )}
            {onMoveDown && (
              <button
                onClick={onMoveDown}
                className="p-1 text-gray-600 hover:text-blue-600"
                title="Move down"
              >
                <ArrowsUpDownIcon className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {image.is_primary ? 'Cover' : 'Gallery'}
          </div>
        </div>
      </div>
    </div>
  );
};