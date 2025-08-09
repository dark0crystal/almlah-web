// components/SimpleImageSelector.tsx
"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Star, StarOff, Trash2, Edit3, Image as ImageIcon } from 'lucide-react';
import { ExistingImage } from '../types/image';

interface SimpleImageSelectorProps {
  existingImages: ExistingImage[];
  onImagesChange: (images: ExistingImage[]) => void;
  onNewFiles: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

interface PendingImagePreview {
  id: string;
  file: File;
  preview: string;
  metadata: {
    alt_text: string;
    caption: string;
    is_primary: boolean;
    display_order: number;
  };
}

const SimpleImageSelector: React.FC<SimpleImageSelectorProps> = ({
  existingImages,
  onImagesChange,
  onNewFiles,
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false
}) => {
  const [pendingImages, setPendingImages] = useState<PendingImagePreview[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const newImages: PendingImagePreview[] = [];
    const currentImageCount = existingImages.length + pendingImages.length;

    Array.from(files).forEach((file, index) => {
      if (currentImageCount + newImages.length >= maxFiles) return;

      // Validate file
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${Math.round(maxFileSize / (1024 * 1024))}MB`);
        return;
      }

      if (!acceptedTypes.includes(file.type)) {
        alert(`File ${file.name} has unsupported format. Accepted formats: ${acceptedTypes.join(', ')}`);
        return;
      }

      const imagePreview: PendingImagePreview = {
        id: `pending-${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
        metadata: {
          alt_text: '',
          caption: '',
          is_primary: existingImages.length === 0 && newImages.length === 0,
          display_order: currentImageCount + newImages.length
        }
      };

      newImages.push(imagePreview);
    });

    const updatedPending = [...pendingImages, ...newImages];
    setPendingImages(updatedPending);
    
    // Send files to parent
    onNewFiles(updatedPending.map(img => img.file));
  }, [disabled, maxFiles, maxFileSize, acceptedTypes, existingImages.length, pendingImages, onNewFiles]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [disabled, handleFileSelect]);

  // Remove existing image
  const removeExistingImage = (id: string) => {
    const updatedImages = existingImages.filter(img => img.id !== id);
    onImagesChange(updatedImages);
  };

  // Remove pending image
  const removePendingImage = (id: string) => {
    const imageToRemove = pendingImages.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedPending = pendingImages.filter(img => img.id !== id);
    setPendingImages(updatedPending);
    onNewFiles(updatedPending.map(img => img.file));
  };

  // Set primary image (existing)
  const setPrimaryExistingImage = (id: string) => {
    const updatedImages = existingImages.map(img => ({
      ...img,
      is_primary: img.id === id
    }));
    onImagesChange(updatedImages);
  };

  // Set primary image (pending)
  const setPrimaryPendingImage = (id: string) => {
    const updatedPending = pendingImages.map(img => ({
      ...img,
      metadata: {
        ...img.metadata,
        is_primary: img.id === id
      }
    }));
    setPendingImages(updatedPending);
    onNewFiles(updatedPending.map(img => img.file));
  };

  // Update existing image metadata
  const updateExistingImageMetadata = (id: string, metadata: Partial<ExistingImage>) => {
    const updatedImages = existingImages.map(img => 
      img.id === id ? { ...img, ...metadata } : img
    );
    onImagesChange(updatedImages);
  };

  // Update pending image metadata
  const updatePendingImageMetadata = (id: string, metadata: Partial<PendingImagePreview['metadata']>) => {
    const updatedPending = pendingImages.map(img => 
      img.id === id 
        ? { ...img, metadata: { ...img.metadata, ...metadata } }
        : img
    );
    setPendingImages(updatedPending);
  };

  // Clear all pending images
  const clearPendingImages = () => {
    pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
    setPendingImages([]);
    onNewFiles([]);
  };

  const totalImages = existingImages.length + pendingImages.length;
  const canAddMore = totalImages < maxFiles;

  // Image preview component
  const ImagePreview: React.FC<{ 
    image: ExistingImage | PendingImagePreview, 
    isExisting: boolean 
  }> = ({ image, isExisting }) => {
    const imageUrl = isExisting 
      ? (image as ExistingImage).url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_STORAGE_BUCKET}/${(image as ExistingImage).path}`
      : (image as PendingImagePreview).preview;

    const isPrimary = isExisting 
      ? (image as ExistingImage).is_primary 
      : (image as PendingImagePreview).metadata.is_primary;

    const altText = isExisting 
      ? (image as ExistingImage).alt_text 
      : (image as PendingImagePreview).metadata.alt_text;

    const caption = isExisting 
      ? (image as ExistingImage).caption 
      : (image as PendingImagePreview).metadata.caption;

    return (
      <div className="relative group bg-gray-100 rounded-lg overflow-hidden">
        {/* Image */}
        <div className="aspect-square relative">
          <img
            src={imageUrl}
            alt={altText || 'Preview'}
            className="w-full h-full object-cover"
          />
          
          {/* Primary badge */}
          {isPrimary && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
              Primary
            </div>
          )}

          {/* New badge for pending images */}
          {!isExisting && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
              New
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
              <button
                onClick={() => isExisting ? setPrimaryExistingImage(image.id) : setPrimaryPendingImage(image.id)}
                className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75"
                title="Set as primary"
              >
                {isPrimary ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
              </button>
              
              <button
                onClick={() => setEditingMetadata(image.id)}
                className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75"
                title="Edit metadata"
              >
                <Edit3 size={14} />
              </button>
              
              <button
                onClick={() => isExisting ? removeExistingImage(image.id) : removePendingImage(image.id)}
                className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75"
                title="Remove image"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Metadata form */}
        {editingMetadata === image.id && (
          <div className="p-3 border-t space-y-2 bg-white">
            <input
              type="text"
              placeholder="Alt text"
              value={altText}
              onChange={(e) => {
                if (isExisting) {
                  updateExistingImageMetadata(image.id, { alt_text: e.target.value });
                } else {
                  updatePendingImageMetadata(image.id, { alt_text: e.target.value });
                }
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Caption"
              value={caption}
              onChange={(e) => {
                if (isExisting) {
                  updateExistingImageMetadata(image.id, { caption: e.target.value });
                } else {
                  updatePendingImageMetadata(image.id, { caption: e.target.value });
                }
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <button
              onClick={() => setEditingMetadata(null)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Done
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : disabled 
                ? 'border-gray-200 bg-gray-50' 
                : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled}
          />
          
          <div className="space-y-2">
            <Upload className={`mx-auto ${disabled ? 'text-gray-300' : 'text-gray-400'}`} size={32} />
            <div>
              <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                {dragOver ? 'Drop images here' : 'Click to select images or drag and drop'}
              </p>
              <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
                Max {maxFiles} files, up to {Math.round(maxFileSize / (1024 * 1024))}MB each
              </p>
              <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
                {acceptedTypes.join(', ').replace(/image\//g, '').toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {(existingImages.length > 0 || pendingImages.length > 0) && (
        <div className="space-y-4">
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ImageIcon size={16} className="mr-1" />
                Current Images ({existingImages.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingImages.map((image) => (
                  <ImagePreview key={image.id} image={image} isExisting={true} />
                ))}
              </div>
            </div>
          )}

          {/* Pending Images */}
          {pendingImages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Upload size={16} className="mr-1" />
                  New Images ({pendingImages.length}) - Will upload when you save
                </h4>
                <button
                  onClick={clearPendingImages}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pendingImages.map((image) => (
                  <ImagePreview key={image.id} image={image} isExisting={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status */}
      {totalImages > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <span>
            {totalImages} of {maxFiles} images selected
          </span>
          {pendingImages.length > 0 && (
            <span className="text-blue-600 font-medium">
              {pendingImages.length} new image{pendingImages.length !== 1 ? 's' : ''} ready to upload
            </span>
          )}
        </div>
      )}

      {/* Help Text */}
      {totalImages === 0 && (
        <div className="text-center text-gray-500 text-sm">
          <ImageIcon size={24} className="mx-auto mb-2 text-gray-300" />
          <p>No images selected yet</p>
          <p className="text-xs">Images will be uploaded to the governates folder when you save the form</p>
        </div>
      )}
    </div>
  );
};

export default SimpleImageSelector;