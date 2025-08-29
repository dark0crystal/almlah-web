// services/supabaseStorage.ts - Updated with governate support
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UploadOptions {
  bucket: string;
  folder: string;
  fileName: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
  url?: string;
}

export type EntityType = 'place' | 'governate' | 'wilayah' | 'content-section';
export type ImageType = 'cover' | 'gallery' | 'content-section';

export class SupabaseStorageService {
  
  /**
   * Generate a unique filename with timestamp
   */
  static generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Upload a single file to the specified folder
   */
  static async uploadFile({
    bucket,
    folder,
    fileName,
    file,
    onProgress
  }: UploadOptions): Promise<UploadResult> {
    try {
      const filePath = `${folder}/${fileName}`;
      console.log('🔄 Uploading file to Supabase:', { bucket, filePath, fileName: file.name });

      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('✅ File uploaded successfully:', { path: filePath, url: urlData.publicUrl });

      return {
        success: true,
        path: filePath,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('💥 Upload exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload governate images with proper file structure
   */
  static async uploadGovernateImages(
    governateId: string,
    images: Array<{
      file: File;
      isPrimary: boolean;
      altText: string;
      displayOrder: number;
    }>
  ): Promise<Array<{
    path: string;
    url: string;
    isPrimary: boolean;
    altText: string;
    displayOrder: number;
  }>> {
    console.log('🚀 SupabaseStorageService.uploadGovernateImages called:', { governateId, imageCount: images.length });
    
    const results = [];
    let galleryIndex = 0;

    for (const image of images) {
      try {
        let folder: string;
        let fileName: string;

        if (image.isPrimary) {
          // Cover image goes in governates/{id}/
          folder = `governates/${governateId}`;
          const extension = image.file.name.split('.').pop() || 'jpg';
          fileName = `cover.${extension}`;
        } else {
          // Gallery images go in governates/{id}/gallery/
          folder = `governates/${governateId}/gallery`;
          const extension = image.file.name.split('.').pop() || 'jpg';
          const paddedIndex = (galleryIndex + 1).toString().padStart(3, '0');
          fileName = `${paddedIndex}.${extension}`;
          galleryIndex++;
        }

        console.log('📁 Generated path:', `${folder}/${fileName}`);

        const result = await this.uploadFile({
          bucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'media-bucket',
          folder,
          fileName,
          file: image.file
        });

        if (result.success && result.url && result.path) {
          results.push({
            path: result.path,
            url: result.url,
            isPrimary: image.isPrimary,
            altText: image.altText,
            displayOrder: image.displayOrder
          });
        } else {
          throw new Error(`Failed to upload ${image.isPrimary ? 'cover' : 'gallery'} image: ${result.error}`);
        }
      } catch (error) {
        console.error(`💥 Error uploading image ${image.isPrimary ? 'cover' : 'gallery'}:`, error);
        throw error;
      }
    }

    console.log('✅ All governate images uploaded successfully:', results);
    return results;
  }

  /**
   * Upload place images with proper file structure
   */
  static async uploadPlaceImages(
    placeId: string,
    images: Array<{
      file: File;
      isPrimary: boolean;
      altText: string;
      displayOrder: number;
    }>
  ): Promise<Array<{
    path: string;
    url: string;
    isPrimary: boolean;
    altText: string;
    displayOrder: number;
  }>> {
    console.log('🚀 SupabaseStorageService.uploadPlaceImages called:', { placeId, imageCount: images.length });
    
    const results = [];
    let galleryIndex = 0;

    for (const image of images) {
      try {
        let folder: string;
        let fileName: string;

        if (image.isPrimary) {
          // Cover image goes in places/{id}/
          folder = `places/${placeId}`;
          const extension = image.file.name.split('.').pop() || 'jpg';
          fileName = `cover.${extension}`;
        } else {
          // Gallery images go in places/{id}/gallery/
          folder = `places/${placeId}/gallery`;
          const extension = image.file.name.split('.').pop() || 'jpg';
          const paddedIndex = (galleryIndex + 1).toString().padStart(3, '0');
          fileName = `${paddedIndex}.${extension}`;
          galleryIndex++;
        }

        console.log('📁 Generated path:', `${folder}/${fileName}`);

        const result = await this.uploadFile({
          bucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'media-bucket',
          folder,
          fileName,
          file: image.file
        });

        if (result.success && result.url && result.path) {
          results.push({
            path: result.path,
            url: result.url,
            isPrimary: image.isPrimary,
            altText: image.altText,
            displayOrder: image.displayOrder
          });
        } else {
          throw new Error(`Failed to upload ${image.isPrimary ? 'cover' : 'gallery'} image: ${result.error}`);
        }
      } catch (error) {
        console.error(`💥 Error uploading image ${image.isPrimary ? 'cover' : 'gallery'}:`, error);
        throw error;
      }
    }

    console.log('✅ All place images uploaded successfully:', results);
    return results;
  }

  /**
   * Upload wilayah images with proper file structure
   */
  static async uploadWilayahImages(
    wilayahId: string,
    images: Array<{
      file: File;
      isPrimary: boolean;
      altText: string;
      displayOrder: number;
    }>
  ): Promise<Array<{
    path: string;
    url: string;
    isPrimary: boolean;
    altText: string;
    displayOrder: number;
  }>> {
    console.log('🚀 SupabaseStorageService.uploadWilayahImages called:', { wilayahId, imageCount: images.length });
    
    const results = [];
    let galleryIndex = 0;

    for (const image of images) {
      try {
        let folder: string;
        let fileName: string;

        if (image.isPrimary) {
          // Cover image goes in wilayahs/{id}/
          folder = `wilayahs/${wilayahId}`;
          const extension = image.file.name.split('.').pop() || 'jpg';
          fileName = `cover.${extension}`;
        } else {
          // Gallery images go in wilayahs/{id}/gallery/
          folder = `wilayahs/${wilayahId}/gallery`;
          const extension = image.file.name.split('.').pop() || 'jpg';
          const paddedIndex = (galleryIndex + 1).toString().padStart(3, '0');
          fileName = `${paddedIndex}.${extension}`;
          galleryIndex++;
        }

        console.log('📁 Generated path:', `${folder}/${fileName}`);

        const result = await this.uploadFile({
          bucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'media-bucket',
          folder,
          fileName,
          file: image.file
        });

        if (result.success && result.url && result.path) {
          results.push({
            path: result.path,
            url: result.url,
            isPrimary: image.isPrimary,
            altText: image.altText,
            displayOrder: image.displayOrder
          });
        } else {
          throw new Error(`Failed to upload ${image.isPrimary ? 'cover' : 'gallery'} image: ${result.error}`);
        }
      } catch (error) {
        console.error(`💥 Error uploading image ${image.isPrimary ? 'cover' : 'gallery'}:`, error);
        throw error;
      }
    }

    console.log('✅ All wilayah images uploaded successfully:', results);
    return results;
  }

  /**
   * Upload content section images
   */
  static async uploadContentSectionImages(
    placeId: string,
    sectionId: string,
    images: Array<{
      file: File;
      altTextAr: string;
      altTextEn: string;
      captionAr: string;
      captionEn: string;
      sortOrder: number;
    }>
  ): Promise<Array<{
    path: string;
    url: string;
    altTextAr: string;
    altTextEn: string;
    captionAr: string;
    captionEn: string;
    sortOrder: number;
  }>> {
    console.log('🚀 SupabaseStorageService.uploadContentSectionImages called:', { placeId, sectionId, imageCount: images.length });
    
    const results = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const extension = image.file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      
      const folder = `places/${placeId}/content-sections/${sectionId}`;
      const fileName = `image-${timestamp}-${random}.${extension}`;

      const result = await this.uploadFile({
        bucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'media-bucket',
        folder,
        fileName,
        file: image.file
      });

      if (result.success && result.url && result.path) {
        results.push({
          path: result.path,
          url: result.url,
          altTextAr: image.altTextAr,
          altTextEn: image.altTextEn,
          captionAr: image.captionAr,
          captionEn: image.captionEn,
          sortOrder: image.sortOrder
        });
      } else {
        throw new Error(`Failed to upload content section image ${i + 1}: ${result.error}`);
      }
    }

    return results;
  }

  /**
   * Delete a file
   */
  static async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete exception:', error);
      return false;
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Validate file
   */
  static validateFile(
    file: File, 
    maxSize: number = 10 * 1024 * 1024, // 10MB default
    acceptedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`
      };
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: ${acceptedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Resize image (optional - requires canvas)
   */
  static async resizeImage(
    file: File, 
    maxWidth: number = 1920, 
    maxHeight: number = 1080, 
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Export functions individually as well for backwards compatibility
export const uploadGovernateImages = SupabaseStorageService.uploadGovernateImages.bind(SupabaseStorageService);
export const uploadPlaceImages = SupabaseStorageService.uploadPlaceImages.bind(SupabaseStorageService);
export const uploadWilayahImages = SupabaseStorageService.uploadWilayahImages.bind(SupabaseStorageService);
export const uploadContentSectionImages = SupabaseStorageService.uploadContentSectionImages.bind(SupabaseStorageService);
export const uploadFile = SupabaseStorageService.uploadFile.bind(SupabaseStorageService);
export const deleteFile = SupabaseStorageService.deleteFile.bind(SupabaseStorageService);
export const validateFile = SupabaseStorageService.validateFile.bind(SupabaseStorageService);
export const resizeImage = SupabaseStorageService.resizeImage.bind(SupabaseStorageService);