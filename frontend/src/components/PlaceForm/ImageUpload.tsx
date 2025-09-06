"use client";
import React, { useRef, useState } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { ImageUploadProps, ImageFile, ExistingImage } from '../../types/image';
import { 
  CloudArrowUpIcon, 
  XMarkIcon, 
  StarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

export const ImageUpload: React.FC<ImageUploadProps> = ({
  config,
  existingImages = [],
  onImagesChange,
  onUploadProgress,
  disabled = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [currentImages, setCurrentImages] = useState<ExistingImage[]>(existingImages);

  const {
    pendingFiles,
    isUploading,
    uploadError,
    addFiles,
    removePendingFile,
    updatePendingFile,
    setPrimaryFile,
    // uploadFiles, // Currently unused
    retryFailedUploads,
    clearPendingFiles,
    hasFailedUploads,
    // hasPendingUploads // Currently unused
  } = useImageUpload({
    config,
    onUploadProgress
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled || isUploading) return;
    addFiles(files);
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

  const removeExistingImage = async (imageId: string) => {
    const imageToRemove = currentImages.find(img => img.id === imageId);
    if (imageToRemove?.path) {
      try {
        await import('../../services/supabaseStorage').then(({ SupabaseStorageService }) => 
          SupabaseStorageService.deleteFile(config.bucket, imageToRemove.path)
        );
      } catch (error) {
        console.error('Failed to delete image from storage:', error);
      }
    }

    const updatedImages = currentImages.filter(img => img.id !== imageId);
    setCurrentImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const setPrimaryExistingImage = (imageId: string) => {
    const updatedImages = currentImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    setCurrentImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const updateExistingImage = (imageId: string, updates: Partial<ExistingImage>) => {
    const updatedImages = currentImages.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    );
    setCurrentImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const totalImages = currentImages.length + pendingFiles.length;
  const maxFiles = config.maxFiles || 10;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      {totalImages < maxFiles && (
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
            ${disabled || isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={config.acceptedTypes?.join(',') || 'image/jpeg,image/png,image/webp'}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isUploading ? 'Processing...' : 'Drop images here or click to browse'}
          </h3>
          <p className="text-gray-600 mb-4">
            {config.acceptedTypes?.join(', ').toUpperCase() || 'JPG, PNG, WebP'} • 
            Max: {Math.round((config.maxFileSize || 10 * 1024 * 1024) / (1024 * 1024))}MB • 
            {maxFiles - totalImages} remaining
          </p>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {isUploading ? 'Processing...' : 'Choose Files'}
          </button>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Upload Error</p>
            <p className="text-red-600 text-sm">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Pending Files */}
      {pendingFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Upload ({pendingFiles.length})
            </h3>
            {hasFailedUploads && (
              <button
                onClick={retryFailedUploads}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Retry Failed</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pendingFiles.map((file) => (
              <PendingImageCard
                key={file.id}
                file={file}
                onRemove={() => removePendingFile(file.id)}
                onUpdate={(updates) => updatePendingFile(file.id, updates)}
                onSetPrimary={() => setPrimaryFile(file.id)}
                showMetadataFields={config.showMetadataFields}
                allowSetPrimary={config.allowSetPrimary}
              />
            ))}
          </div>

          {/* Upload Actions */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">
              {pendingFiles.filter(f => f.status === 'completed').length} completed, {' '}
              {pendingFiles.filter(f => f.status === 'error').length} failed
            </div>
            <div className="space-x-2">
              <button
                onClick={clearPendingFiles}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Images */}
      {currentImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            Uploaded Images ({currentImages.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentImages.map((image) => (
              <ExistingImageCard
                key={image.id}
                image={image}
                onRemove={() => removeExistingImage(image.id)}
                onUpdate={(updates) => updateExistingImage(image.id, updates)}
                onSetPrimary={() => setPrimaryExistingImage(image.id)}
                showMetadataFields={config.showMetadataFields}
                allowSetPrimary={config.allowSetPrimary}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Pending Image Card Component
interface PendingImageCardProps {
  file: ImageFile;
  onRemove: () => void;
  onUpdate: (updates: Partial<ImageFile['metadata']>) => void;
  onSetPrimary: () => void;
  showMetadataFields?: boolean;
  allowSetPrimary?: boolean;
}

const PendingImageCard: React.FC<PendingImageCardProps> = ({
  file,
  onRemove,
  onUpdate,
  onSetPrimary,
  showMetadataFields = true,
  allowSetPrimary = true
}) => {
  return (
    <div className="relative">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={file.preview}
          alt="Pending upload"
          className="w-full h-full object-cover"
          width={300}
          height={300}
        />
      </div>
      
      {/* Status Overlay */}
      {file.status !== 'pending' && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          {file.status === 'uploading' && (
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <div className="text-sm">{Math.round(file.progress)}%</div>
            </div>
          )}
          
          {file.status === 'completed' && (
            <CheckCircleIcon className="w-12 h-12 text-green-400" />
          )}
          
          {file.status === 'error' && (
            <div className="text-white text-center p-2">
              <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <div className="text-xs">{file.error}</div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-2 right-2 flex space-x-1">
        {allowSetPrimary && (
          <button
            onClick={onSetPrimary}
            className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
            title={file.metadata?.is_primary ? 'Primary image' : 'Set as primary'}
          >
            {file.metadata?.is_primary ? (
              <StarSolidIcon className="w-4 h-4 text-yellow-500" />
            ) : (
              <StarIcon className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
        <button
          onClick={onRemove}
          className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
          title="Remove image"
        >
          <XMarkIcon className="w-4 h-4 text-red-500" />
        </button>
      </div>

      {/* Primary Badge */}
      {file.metadata?.is_primary && (
        <div className="absolute top-2 left-2">
          <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1">
            <StarSolidIcon className="w-3 h-3" />
            <span>Primary</span>
          </div>
        </div>
      )}

      {/* Metadata Fields */}
      {showMetadataFields && (
        <div className="mt-2 space-y-1">
          <input
            type="text"
            placeholder="Alt text"
            value={file.metadata?.alt_text || ''}
            onChange={(e) => onUpdate({ alt_text: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Caption"
            value={file.metadata?.caption || ''}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
};

// Existing Image Card Component
interface ExistingImageCardProps {
  image: ExistingImage;
  onRemove: () => void;
  onUpdate: (updates: Partial<ExistingImage>) => void;
  onSetPrimary: () => void;
  showMetadataFields?: boolean;
  allowSetPrimary?: boolean;
}

const ExistingImageCard: React.FC<ExistingImageCardProps> = ({
  image,
  onRemove,
  onUpdate,
  onSetPrimary,
  showMetadataFields = true,
  allowSetPrimary = true
}) => {
  return (
    <div className="relative group">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={image.url || '/placeholder-image.jpg'}
          alt={image.alt_text || 'Uploaded image'}
          className="w-full h-full object-cover"
          width={300}
          height={300}
        />
      </div>
      
      {/* Overlay Controls */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
          {allowSetPrimary && (
            <button
              onClick={onSetPrimary}
              className="p-2 bg-white rounded-full hover:bg-gray-100"
              title={image.is_primary ? 'Primary image' : 'Set as primary'}
            >
              {image.is_primary ? (
                <StarSolidIcon className="w-4 h-4 text-yellow-500" />
              ) : (
                <StarIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-2 bg-white rounded-full hover:bg-gray-100"
            title="Remove image"
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
            <span>Primary</span>
          </div>
        </div>
      )}

      {/* Metadata Fields */}
      {showMetadataFields && (
        <div className="mt-2 space-y-1">
          <input
            type="text"
            placeholder="Alt text"
            value={image.alt_text || ''}
            onChange={(e) => onUpdate({ alt_text: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Caption"
            value={image.caption || ''}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
};