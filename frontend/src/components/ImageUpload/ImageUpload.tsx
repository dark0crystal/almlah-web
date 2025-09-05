'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { uploadService, PendingUpload } from '@/services/uploadService';

export interface ImageUploadProps {
  currentImage?: string;
  onImageUpload?: (imageUrl: string) => void;
  onFileSelect?: (pendingUpload: PendingUpload | null) => void;
  bucket: string;
  locale: 'ar' | 'en';
  immediateUpload?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  showProgress?: boolean;
  className?: string;
}

export default function ImageUpload({ 
  currentImage, 
  onImageUpload, 
  onFileSelect,
  bucket,
  locale,
  immediateUpload = false,
  multiple = false,
  maxFiles = 5,
  showProgress = true,
  className = ""
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to check if a string is a valid URL
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  // Helper function to check if a string is a data URL (base64)
  const isDataUrl = (string: string) => {
    return string.startsWith('data:');
  };

  // Helper function to check if a string is a blob URL
  const isBlobUrl = (string: string) => {
    return string.startsWith('blob:');
  };

  // Get the display image with proper URL handling
  const getDisplayImage = () => {
    const image = previewUrl || currentImage;
    if (!image) return null;
    
    // If it's already a valid URL, data URL, or blob URL, use it as is
    if (isValidUrl(image) || isDataUrl(image) || isBlobUrl(image)) {
      return image;
    }
    
    // If it's a relative path, make it absolute
    if (image.startsWith('/')) {
      return image;
    }
    
    // If it's a relative path without leading slash, add it
    return `/${image}`;
  };

  const displayImage = getDisplayImage();

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file count
    if (files.length > maxFiles) {
      setError(locale === 'ar' 
        ? `يمكن رفع ${maxFiles} ملفات كحد أقصى` 
        : `Maximum ${maxFiles} files allowed`);
      return;
    }

    setError(null);

    if (immediateUpload) {
      // Upload immediately
      setUploading(true);
      setUploadProgress(0);

      try {
        if (files.length === 1) {
          // Single file upload
          const result = await uploadService.uploadSingle(
            files[0], 
            bucket, 
            (progress) => setUploadProgress(progress.percentage)
          );

          if (result.success && result.url) {
            onImageUpload?.(result.url);
            setPreviewUrl(result.url);
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } else {
          // Multiple file upload
          const batchResult = await uploadService.uploadBatch(
            files,
            bucket,
            (completed, total) => setUploadProgress((completed / total) * 100)
          );

          if (batchResult.successfulCount > 0) {
            // Use the first successful upload
            const firstSuccess = batchResult.successful[0];
            if (firstSuccess.url) {
              onImageUpload?.(firstSuccess.url);
              setPreviewUrl(firstSuccess.url);
            }
          }

          if (batchResult.failedCount > 0) {
            const errorMessages = batchResult.failed.map(f => f.error).filter(Boolean);
            throw new Error(`Some uploads failed: ${errorMessages.join(', ')}`);
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || (locale === 'ar' ? 'فشل في رفع الصورة' : 'Failed to upload image'));
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    } else {
      // Prepare for deferred upload
      const newPendingUploads: PendingUpload[] = [];
      
      for (const file of files) {
        const pendingUpload = uploadService.createPendingUpload(file, bucket);
        if (pendingUpload.status === 'failed') {
          setError(pendingUpload.error || 'Invalid file');
          return;
        }
        newPendingUploads.push(pendingUpload);
      }

      setPendingUploads(prev => [...prev, ...newPendingUploads]);
      
      if (files.length === 1) {
        // Create a blob URL for preview
        const blobUrl = URL.createObjectURL(files[0]);
        setPreviewUrl(blobUrl);
        onFileSelect?.(newPendingUploads[0]);
      } else {
        onFileSelect?.(newPendingUploads[0]); // Pass first file for compatibility
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [bucket, locale, immediateUpload, maxFiles, onImageUpload, onFileSelect]);

  const handleRemoveImage = useCallback(() => {
    // Clean up blob URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    setPendingUploads([]);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (immediateUpload) {
      onImageUpload?.('');
    } else {
      onFileSelect?.(null);
    }
  }, [immediateUpload, onImageUpload, onFileSelect, previewUrl]);

  const handleRemovePendingUpload = useCallback((uploadId: string) => {
    setPendingUploads(prev => {
      const upload = prev.find(u => u.id === uploadId);
      if (upload) {
        uploadService.cleanupPendingUpload(upload);
      }
      return prev.filter(u => u.id !== uploadId);
    });
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Preview */}
      {displayImage && !uploading && (
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={displayImage}
              alt="Uploaded image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && showProgress && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            {locale === 'ar' ? `جاري الرفع... ${Math.round(uploadProgress)}%` : `Uploading... ${Math.round(uploadProgress)}%`}
          </p>
        </div>
      )}

      {/* Pending Uploads */}
      {pendingUploads.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {locale === 'ar' ? 'الملفات المعلقة:' : 'Pending files:'}
          </p>
          {pendingUploads.map((upload) => (
            <div key={upload.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Image
                  src={upload.previewUrl} 
                  alt="Preview" 
                  width={32}
                  height={32}
                  className="w-8 h-8 object-cover rounded"
                />
                <span className="text-sm text-gray-700 truncate">{upload.file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePendingUpload(upload.id)}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
          multiple={multiple}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-600">
                {locale === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="w-8 h-8 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-600">
                {displayImage 
                  ? (locale === 'ar' ? 'اختر صورة جديدة' : 'Choose new image')
                  : (locale === 'ar' ? 'اختر صورة' : 'Choose image')
                }
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP, SVG (max 10MB)
                {multiple && ` • Max ${maxFiles} files`}
              </p>
            </div>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
      
      {/* Current URL Display */}
      {displayImage && !previewUrl && !uploading && (
        <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded break-all">
          {displayImage}
        </div>
      )}
      
      {/* Preview Notice */}
      {previewUrl && !immediateUpload && !uploading && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          {locale === 'ar' ? 'سيتم رفع الصورة عند الحفظ' : 'Image will be uploaded when you save'}
        </div>
      )}
    </div>
  );
}
