'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

export interface PendingImageUpload {
  file: File;
  previewUrl: string;
  bucket: string;
}

interface ImageUploadProps {
  currentImage?: string;
  onImageUpload?: (imageUrl: string) => void;
  onFileSelect?: (pendingUpload: PendingImageUpload | null) => void;
  bucket: string;
  locale: 'ar' | 'en';
  immediateUpload?: boolean; // Default false - for backward compatibility
}

export default function ImageUpload({ 
  currentImage, 
  onImageUpload, 
  onFileSelect,
  bucket,
  locale,
  immediateUpload = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = previewUrl || currentImage;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(locale === 'ar' ? 'يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)' : 'Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError(locale === 'ar' ? 'حجم الملف يجب أن يكون أقل من 5 ميجابايت' : 'File size must be less than 5MB');
      return;
    }

    setError(null);

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    if (immediateUpload) {
      // Legacy behavior - upload immediately
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', bucket);

        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:9000/api/v1/upload', {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        
        if (data.success) {
          onImageUpload?.(data.data.url);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (err: any) {
        setError(err.message || (locale === 'ar' ? 'فشل في رفع الصورة' : 'Failed to upload image'));
      } finally {
        setUploading(false);
      }
    } else {
      // New behavior - prepare for deferred upload
      onFileSelect?.({
        file,
        previewUrl: preview,
        bucket
      });
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (immediateUpload) {
      onImageUpload?.('');
    } else {
      onFileSelect?.(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Current Image Preview */}
      {displayImage && (
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={displayImage}
              alt="Featured image"
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

      {/* Upload Button */}
      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/jpg,image/png,image/webp"
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
                  : (locale === 'ar' ? 'اختر صورة مميزة' : 'Choose featured image')
                }
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP (max 5MB)
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
      {displayImage && !previewUrl && (
        <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
          {displayImage}
        </div>
      )}
      
      {/* Preview Notice */}
      {previewUrl && !immediateUpload && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          {locale === 'ar' ? 'سيتم رفع الصورة عند الحفظ' : 'Image will be uploaded when you save'}
        </div>
      )}
    </div>
  );
}