"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, 
  Star, 
  StarOff, 
  AlertCircle,
  Loader2,
  Edit3,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import { SupabaseStorageService } from '../services/supabaseStorage';
import { ImageFile, ExistingImage, ImageUploadProps } from '../types/image';

const ImageUpload: React.FC<ImageUploadProps> = ({
  config,
  existingImages = [],
  onImagesChange,
  onUploadProgress,
  disabled = false,
  className = ''
}) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    maxFiles = 10,
    maxFileSize = 5 * 1024 * 1024, // 5MB
    acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    bucket,
    folder,
    // allowReorder = true, // Currently unused
    allowSetPrimary = true,
    showMetadataFields = true
  } = config;

  // Convert existing images to display format
  const [displayImages, setDisplayImages] = useState<ExistingImage[]>(existingImages);

  useEffect(() => {
    setDisplayImages(existingImages);
  }, [existingImages]);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const newImages: ImageFile[] = [];
    const currentImageCount = displayImages.length + images.length;

    Array.from(files).forEach((file, index) => {
      if (currentImageCount + newImages.length >= maxFiles) return;

      const validation = SupabaseStorageService.validateFile(file, maxFileSize, acceptedTypes);
      
      const imageFile: ImageFile = {
        id: `new-${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: validation.valid ? 'pending' : 'error',
        error: validation.error,
        metadata: {
          alt_text: '',
          caption: '',
          is_primary: displayImages.length === 0 && newImages.length === 0,
          display_order: currentImageCount + newImages.length
        }
      };

      newImages.push(imageFile);
    });

    setImages(prev => [...prev, ...newImages]);
  }, [disabled, maxFiles, maxFileSize, acceptedTypes, displayImages.length, images.length]);

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

  // Upload images to Supabase
  const uploadImages = async () => {
    if (images.length === 0) return;

    setUploading(true);
    const imagesToUpload = images.filter(img => img.status === 'pending');
    let completedUploads = 0;

    const uploadPromises = imagesToUpload.map(async (imageFile) => {
      try {
        // Update status to uploading
        setImages(prev => prev.map(img => 
          img.id === imageFile.id ? { ...img, status: 'uploading' as const } : img
        ));

        // Generate unique filename
        const fileName = SupabaseStorageService.generateFileName(imageFile.file.name);
        
        // Upload to Supabase
        const result = await SupabaseStorageService.uploadFile({
          bucket,
          folder,
          fileName,
          file: imageFile.file,
          onProgress: (progress) => {
            setImages(prev => prev.map(img => 
              img.id === imageFile.id ? { ...img, progress } : img
            ));
          }
        });

        if (result.success && result.path) {
          // Update status to completed
          setImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, status: 'completed' as const, path: result.path, progress: 100 }
              : img
          ));

          // Add to display images
          const newDisplayImage: ExistingImage = {
            id: imageFile.id,
            path: result.path,
            alt_text: imageFile.metadata?.alt_text || '',
            caption: imageFile.metadata?.caption || '',
            is_primary: imageFile.metadata?.is_primary || false,
            display_order: imageFile.metadata?.display_order || 0,
            url: result.url
          };

          setDisplayImages(prev => [...prev, newDisplayImage]);
          
          completedUploads++;
          if (onUploadProgress) {
            onUploadProgress((completedUploads / imagesToUpload.length) * 100);
          }
        } else {
          // Update status to error
          setImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, status: 'error' as const, error: result.error }
              : img
          ));
        }
      } catch (error) {
        setImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { 
                ...img, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : img
        ));
      }
    });

    await Promise.all(uploadPromises);
    
    // Remove completed uploads from pending images
    setImages(prev => prev.filter(img => img.status !== 'completed'));
    setUploading(false);

    // Notify parent of changes
    onImagesChange(displayImages);
  };

  // Remove image (pending or existing)
  const removeImage = async (id: string, isExisting: boolean = false) => {
    if (isExisting) {
      const imageToRemove = displayImages.find(img => img.id === id);
      if (imageToRemove && imageToRemove.path) {
        // Delete from Supabase
        await SupabaseStorageService.deleteFile(bucket, imageToRemove.path);
      }
      
      const updatedImages = displayImages.filter(img => img.id !== id);
      setDisplayImages(updatedImages);
      onImagesChange(updatedImages);
    } else {
      const imageToRemove = images.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      setImages(prev => prev.filter(img => img.id !== id));
    }
  };

  // Set primary image
  const setPrimaryImage = (id: string, isExisting: boolean = false) => {
    if (isExisting) {
      const updatedImages = displayImages.map(img => ({
        ...img,
        is_primary: img.id === id
      }));
      setDisplayImages(updatedImages);
      onImagesChange(updatedImages);
    } else {
      setImages(prev => prev.map(img => ({
        ...img,
        metadata: {
          ...img.metadata,
          is_primary: img.id === id
        }
      })));
    }
  };

  // Update image metadata
  const updateImageMetadata = (id: string, metadata: Partial<ExistingImage>, isExisting: boolean = false) => {
    if (isExisting) {
      const updatedImages = displayImages.map(img => 
        img.id === id ? { ...img, ...metadata } : img
      );
      setDisplayImages(updatedImages);
      onImagesChange(updatedImages);
    } else {
      setImages(prev => prev.map(img => 
        img.id === id 
          ? { ...img, metadata: { ...img.metadata, ...metadata } }
          : img
      ));
    }
  };

  // Image preview component
  const ImagePreview: React.FC<{ 
    image: ExistingImage | ImageFile, 
    isExisting: boolean 
  }> = ({ image, isExisting }) => {
    const isUploading = !isExisting && 'status' in image && image.status === 'uploading';
    const hasError = !isExisting && 'status' in image && image.status === 'error';
    const imageUrl = isExisting 
      ? (image as ExistingImage).url || SupabaseStorageService.getPublicUrl(bucket, (image as ExistingImage).path)
      : (image as ImageFile).preview;

    return (
      <div className="relative group bg-gray-100 rounded-lg overflow-hidden">
        {/* Image */}
        <div className="aspect-square relative">
          <Image
            src={imageUrl}
            alt={isExisting ? (image as ExistingImage).alt_text : 'Preview'}
            className="w-full h-full object-cover"
            width={300}
            height={300}
          />
          
          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                <div className="text-sm">
                  {(image as ImageFile).progress}%
                </div>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {hasError && (
            <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
              <div className="text-white text-center p-2">
                <AlertCircle className="mx-auto mb-1" size={20} />
                <div className="text-xs">{(image as ImageFile).error}</div>
              </div>
            </div>
          )}

          {/* Primary badge */}
          {((isExisting && (image as ExistingImage).is_primary) || 
            (!isExisting && (image as ImageFile).metadata?.is_primary)) && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
              Primary
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            {allowSetPrimary && !hasError && (
              <button
                onClick={() => setPrimaryImage(image.id, isExisting)}
                className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75"
                title="Set as primary"
              >
                {((isExisting && (image as ExistingImage).is_primary) || 
                  (!isExisting && (image as ImageFile).metadata?.is_primary)) 
                  ? <Star size={14} fill="currentColor" />
                  : <StarOff size={14} />
                }
              </button>
            )}
            
            {showMetadataFields && (
              <button
                onClick={() => setEditingMetadata(image.id)}
                className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75"
                title="Edit metadata"
              >
                <Edit3 size={14} />
              </button>
            )}
            
            <button
              onClick={() => removeImage(image.id, isExisting)}
              className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75"
              title="Remove image"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Metadata form */}
        {editingMetadata === image.id && showMetadataFields && (
          <div className="p-3 border-t space-y-2">
            <input
              type="text"
              placeholder="Alt text"
              value={isExisting ? (image as ExistingImage).alt_text : (image as ImageFile).metadata?.alt_text || ''}
              onChange={(e) => updateImageMetadata(image.id, { alt_text: e.target.value }, isExisting)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Caption"
              value={isExisting ? (image as ExistingImage).caption : (image as ImageFile).metadata?.caption || ''}
              onChange={(e) => updateImageMetadata(image.id, { caption: e.target.value }, isExisting)}
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

  const totalImages = displayImages.length + images.length;
  const canAddMore = totalImages < maxFiles;

  return (
    <div className={`space-y-4 ${className}`}>
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
                {dragOver ? 'Drop images here' : 'Click to upload or drag and drop'}
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
      {(displayImages.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Existing images */}
          {displayImages.map((image) => (
            <ImagePreview key={image.id} image={image} isExisting={true} />
          ))}
          
          {/* Pending images */}
          {images.map((image) => (
            <ImagePreview key={image.id} image={image} isExisting={false} />
          ))}
        </div>
      )}

      {/* Upload Actions */}
      {images.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            {images.filter(img => img.status === 'pending').length} images ready to upload
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                images.forEach(img => URL.revokeObjectURL(img.preview));
                setImages([]);
              }}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
              disabled={uploading}
            >
              Clear All
            </button>
            
            <button
              onClick={uploadImages}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={uploading || images.filter(img => img.status === 'pending').length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="inline animate-spin mr-1" size={14} />
                  Uploading...
                </>
              ) : (
                'Upload Images'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      {totalImages > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {totalImages} of {maxFiles} images
        </div>
      )}
    </div>
  );
};

export default ImageUpload;