"use client"
import { useState, useCallback } from 'react';
import { SupabaseStorageService } from '../services/supabaseStorage';
import { ImageFile, ExistingImage, ImageUploadConfig } from '../types/image';

interface UseImageUploadProps {
  config: ImageUploadConfig;
  onUploadProgress?: (progress: number) => void;
}

export const useImageUpload = ({
  config,
  onUploadProgress
}: UseImageUploadProps) => {
  const [pendingFiles, setPendingFiles] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add files to pending queue
  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFiles: ImageFile[] = [];

    fileArray.forEach((file, index) => {
      // Validate file
      const validation = SupabaseStorageService.validateFile(
        file,
        config.maxFileSize || 10 * 1024 * 1024, // 10MB default
        config.acceptedTypes || ['image/jpeg', 'image/png', 'image/webp']
      );

      if (validation.valid) {
        const imageFile: ImageFile = {
          id: `pending-${Date.now()}-${index}`,
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: 'pending',
          metadata: {
            alt_text: '',
            caption: '',
            is_primary: false,
            display_order: pendingFiles.length + newFiles.length
          }
        };
        newFiles.push(imageFile);
      }
    });

    if (newFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...newFiles]);
      setUploadError(null);
    }
  }, [pendingFiles.length, config.maxFileSize, config.acceptedTypes]);

  // Remove pending file
  const removePendingFile = useCallback((fileId: string) => {
    setPendingFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Update pending file metadata
  const updatePendingFile = useCallback((fileId: string, metadata: Partial<ImageFile['metadata']>) => {
    setPendingFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, metadata: { ...file.metadata, ...metadata } }
        : file
    ));
  }, []);

  // Set primary image
  const setPrimaryFile = useCallback((fileId: string) => {
    setPendingFiles(prev => prev.map(file => ({
      ...file,
      metadata: {
        ...file.metadata,
        is_primary: file.id === fileId
      }
    })));
  }, []);

  // Upload all pending files
  const uploadFiles = useCallback(async (): Promise<ExistingImage[]> => {
    if (pendingFiles.length === 0) return [];

    setIsUploading(true);
    setUploadError(null);

    const uploadedImages: ExistingImage[] = [];
    let totalProgress = 0;

    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const imageFile = pendingFiles[i];

        // Update status
        setPendingFiles(prev => prev.map(f => 
          f.id === imageFile.id ? { ...f, status: 'uploading' as const } : f
        ));

        try {
          // Resize image if needed
          const resizedFile = await SupabaseStorageService.resizeImage(
            imageFile.file,
            1920, // max width
            1080, // max height
            0.8   // quality
          );

          // Generate filename
          let fileName: string;
          if (imageFile.metadata?.is_primary) {
            const extension = imageFile.file.name.split('.').pop();
            fileName = `cover.${extension}`;
          } else {
            fileName = SupabaseStorageService.generateFileName(imageFile.file.name);
          }

          // Upload to Supabase
          const result = await SupabaseStorageService.uploadFile({
            bucket: config.bucket,
            folder: config.folder,
            fileName,
            file: resizedFile
          });

          if (result.success && result.path && result.url) {
            // Create uploaded image
            const uploadedImage: ExistingImage = {
              id: imageFile.id,
              path: result.path,
              url: result.url,
              alt_text: imageFile.metadata?.alt_text || '',
              caption: imageFile.metadata?.caption || '',
              is_primary: imageFile.metadata?.is_primary || false,
              display_order: imageFile.metadata?.display_order || i
            };

            uploadedImages.push(uploadedImage);

            // Update status
            setPendingFiles(prev => prev.map(f => 
              f.id === imageFile.id ? { ...f, status: 'completed' as const } : f
            ));

          } else {
            throw new Error(result.error || 'Upload failed');
          }

        } catch (error) {
          console.error(`Failed to upload file ${imageFile.file.name}:`, error);
          
          setPendingFiles(prev => prev.map(f => 
            f.id === imageFile.id 
              ? { 
                  ...f, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : 'Upload failed' 
                }
              : f
          ));
        }

        totalProgress = ((i + 1) / pendingFiles.length) * 100;
        onUploadProgress?.(totalProgress);
      }

      // Clean up successful uploads
      setPendingFiles(prev => prev.filter(f => f.status !== 'completed'));
      
      return uploadedImages;

    } catch (error) {
      console.error('Upload process failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      return [];
    } finally {
      setIsUploading(false);
      onUploadProgress?.(100);
    }
  }, [pendingFiles, config.bucket, config.folder, onUploadProgress]);

  // Retry failed uploads
  const retryFailedUploads = useCallback(async () => {
    const failedFiles = pendingFiles.filter(f => f.status === 'error');
    if (failedFiles.length === 0) return [];

    // Reset failed files to pending
    setPendingFiles(prev => prev.map(f => 
      f.status === 'error' 
        ? { ...f, status: 'pending' as const, error: undefined, progress: 0 }
        : f
    ));

    return uploadFiles();
  }, [pendingFiles, uploadFiles]);

  // Clear all pending files
  const clearPendingFiles = useCallback(() => {
    pendingFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setPendingFiles([]);
    setUploadError(null);
  }, [pendingFiles]);

  return {
    pendingFiles,
    isUploading,
    uploadError,
    addFiles,
    removePendingFile,
    updatePendingFile,
    setPrimaryFile,
    uploadFiles,
    retryFailedUploads,
    clearPendingFiles,
    hasFailedUploads: pendingFiles.some(f => f.status === 'error'),
    hasPendingUploads: pendingFiles.length > 0
  };
};