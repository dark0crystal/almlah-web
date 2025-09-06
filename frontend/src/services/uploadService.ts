// Enhanced Upload Service with progress tracking, retry mechanism, and better error handling

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  uploadTime?: number;
}

export interface BatchUploadResult {
  successful: UploadResult[];
  failed: UploadResult[];
  totalFiles: number;
  successfulCount: number;
  failedCount: number;
  totalTime: number;
}

export interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
  bucket: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  result?: UploadResult;
}

class UploadService {
  private baseURL: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_HOST 
      ? `${process.env.NEXT_PUBLIC_API_HOST}/api/v1` 
      : "http://localhost:9000/api/v1";
  }

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    // File size validation (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only images are allowed' };
    }

    return { valid: true };
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async uploadSingle(
    file: File, 
    bucket: string
  ): Promise<UploadResult> {
    const startTime = Date.now();
    
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', bucket);

    // Retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Upload attempt ${attempt}/${this.maxRetries} for file: ${file.name}`);

        const response = await fetch(`${this.baseURL}/upload`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            console.error('❌ Upload error response:', errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            console.error('❌ Failed to parse error response:', e);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (data.success) {
          const uploadTime = Date.now() - startTime;
          console.log(`✅ Upload successful in ${uploadTime}ms: ${data.data.url}`);
          
          return {
            success: true,
            url: data.data.url,
            filename: data.data.filename,
            uploadTime
          };
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (error) {
        console.error(`❌ Upload attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed after all retries'
          };
        }
        
        // Wait before retry
        await this.sleep(this.retryDelay * attempt);
      }
    }

    return {
      success: false,
      error: 'Upload failed after all retries'
    };
  }

  async uploadBatch(
    files: File[], 
    bucket: string, 
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchUploadResult> {
    const startTime = Date.now();
    const results: UploadResult[] = [];
    
    console.log(`🚀 Starting batch upload of ${files.length} files to bucket: ${bucket}`);

    // Validate all files first
    const validFiles: File[] = [];
    const invalidFiles: UploadResult[] = [];

    for (const file of files) {
      const validation = this.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({
          success: false,
          error: validation.error
        });
      }
    }

    // Upload valid files
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      console.log(`📤 Uploading file ${i + 1}/${validFiles.length}: ${file.name}`);
      
      const result = await this.uploadSingle(file, bucket);
      results.push(result);
      
      // Call progress callback
      onProgress?.(i + 1, validFiles.length);
    }

    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success);
    const failed = [...results.filter(r => !r.success), ...invalidFiles];

    console.log(`✅ Batch upload completed in ${totalTime}ms. Success: ${successful.length}, Failed: ${failed.length}`);

    return {
      successful,
      failed,
      totalFiles: files.length,
      successfulCount: successful.length,
      failedCount: failed.length,
      totalTime
    };
  }

  async uploadWithProgress(
    file: File, 
    bucket: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // For now, we'll use the single upload method
    // In the future, this could be enhanced with actual progress tracking using XMLHttpRequest
    return this.uploadSingle(file, bucket);
  }

  // Utility method to create a pending upload object
  createPendingUpload(file: File, bucket: string): PendingUpload {
    const validation = this.validateFile(file);
    
    return {
      id: this.generateUploadId(),
      file,
      previewUrl: URL.createObjectURL(file),
      bucket,
      status: validation.valid ? 'pending' : 'failed',
      progress: 0,
      error: validation.valid ? undefined : validation.error
    };
  }

  // Clean up preview URLs to prevent memory leaks
  cleanupPendingUpload(upload: PendingUpload): void {
    if (upload.previewUrl) {
      URL.revokeObjectURL(upload.previewUrl);
    }
  }

  // Process multiple pending uploads
  async processPendingUploads(
    uploads: PendingUpload[],
    onProgress?: (uploadId: string, progress: number) => void,
    onComplete?: (uploadId: string, result: UploadResult) => void
  ): Promise<BatchUploadResult> {
    const results: UploadResult[] = [];
    const validUploads = uploads.filter(u => u.status !== 'failed');

    for (const upload of validUploads) {
      try {
        upload.status = 'uploading';
        upload.progress = 0;

        const result = await this.uploadSingle(upload.file, upload.bucket);

        upload.status = result.success ? 'completed' : 'failed';
        upload.result = result;
        upload.error = result.error;

        results.push(result);
        onComplete?.(upload.id, result);

        // Clean up preview URL
        this.cleanupPendingUpload(upload);
      } catch (error) {
        const errorResult: UploadResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        };

        upload.status = 'failed';
        upload.error = errorResult.error;
        upload.result = errorResult;

        results.push(errorResult);
        onComplete?.(upload.id, errorResult);

        // Clean up preview URL
        this.cleanupPendingUpload(upload);
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      successful,
      failed,
      totalFiles: uploads.length,
      successfulCount: successful.length,
      failedCount: failed.length,
      totalTime: 0 // Will be calculated by individual uploads
    };
  }
}

// Export singleton instance
export const uploadService = new UploadService();

// Types are already exported above - no need to re-export
