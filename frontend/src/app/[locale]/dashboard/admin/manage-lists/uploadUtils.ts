// Enhanced upload utilities using the new upload service
import { uploadService, PendingUpload, UploadResult, BatchUploadResult } from '@/services/uploadService';

// Legacy interface for backward compatibility
export interface PendingImageUpload {
  file: File;
  previewUrl: string;
  bucket: string;
}

// Convert legacy PendingImageUpload to new PendingUpload
function convertToPendingUpload(legacyUpload: PendingImageUpload): PendingUpload {
  return uploadService.createPendingUpload(legacyUpload.file, legacyUpload.bucket);
}

// Legacy function for backward compatibility
export async function uploadPendingImage(pendingUpload: PendingImageUpload): Promise<string> {
  const newUpload = convertToPendingUpload(pendingUpload);
  const result = await uploadService.uploadSingle(newUpload.file, newUpload.bucket);
  
  if (result.success && result.url) {
    return result.url;
  } else {
    throw new Error(result.error || 'Upload failed');
  }
}

// Legacy function for backward compatibility
export async function uploadMultiplePendingImages(pendingUploads: PendingImageUpload[]): Promise<string[]> {
  const files = pendingUploads.map(upload => upload.file);
  const bucket = pendingUploads[0]?.bucket || 'general';
  
  const result = await uploadService.uploadBatch(files, bucket);
  
  if (result.failedCount > 0) {
    const errors = result.failed.map(f => f.error).filter(Boolean);
    throw new Error(`Some uploads failed: ${errors.join(', ')}`);
  }
  
  return result.successful.map(s => s.url!).filter(Boolean);
}

// New enhanced functions
export async function uploadSingleFile(
  file: File, 
  bucket: string, 
  // _onProgress?: (progress: number) => void
): Promise<UploadResult> {
  // Note: Current uploadService.uploadSingle doesn't support progress callbacks
  // The _onProgress parameter is kept for API compatibility but not used
  return uploadService.uploadSingle(file, bucket);
}

export async function uploadMultipleFiles(
  files: File[], 
  bucket: string, 
  onProgress?: (completed: number, total: number) => void
): Promise<BatchUploadResult> {
  return uploadService.uploadBatch(files, bucket, onProgress);
}

export async function processPendingUploads(
  uploads: PendingUpload[],
  onProgress?: (uploadId: string, progress: number) => void,
  onComplete?: (uploadId: string, result: UploadResult) => void
): Promise<BatchUploadResult> {
  return uploadService.processPendingUploads(uploads, onProgress, onComplete);
}

// Utility functions
export function createPendingUpload(file: File, bucket: string): PendingUpload {
  return uploadService.createPendingUpload(file, bucket);
}

export function cleanupPendingUpload(upload: PendingUpload): void {
  uploadService.cleanupPendingUpload(upload);
}

// Export types for use in components
export type { PendingUpload, UploadResult, BatchUploadResult } from '@/services/uploadService';