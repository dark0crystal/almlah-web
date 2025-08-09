// types/image.ts
export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  path?: string; // Supabase storage path
  metadata?: {
    alt_text?: string;
    caption?: string;
    is_primary?: boolean;
    display_order?: number;
  };
}

export interface ExistingImage {
  id: string;
  path: string;
  alt_text?: string;
  caption?: string;
  is_primary?: boolean;
  display_order?: number;
  url?: string; // Full URL (constructed from path)
}

export interface ImageUploadConfig {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  bucket: string;
  folder: string; // e.g., 'governates/123e4567-e89b-12d3'
  allowReorder?: boolean;
  allowSetPrimary?: boolean;
  showMetadataFields?: boolean;
}

export interface ImageUploadProps {
  config: ImageUploadConfig;
  existingImages?: ExistingImage[];
  onImagesChange: (images: ExistingImage[]) => void;
  onUploadProgress?: (progress: number) => void;
  disabled?: boolean;
  className?: string;
}