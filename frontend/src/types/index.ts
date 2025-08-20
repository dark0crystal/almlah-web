// src/types/index.ts

export interface Governate {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Wilayah {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  governate_id: string;
  governate?: Governate;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  icon: string;
  type: string;
}

export interface ContentSection {
  id: string;
  section_type: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  sort_order: number;
  images?: ContentSectionImage[];
}

export interface ContentSectionImage {
  id: string;
  image_url?: string;
  alt_text_ar?: string;
  alt_text_en?: string;
  caption_ar?: string;
  caption_en?: string;
  sort_order: number;
}

export interface Car {
  id: string;
  name: string;
  image: string;
}

export interface Place {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  slug: string;
  lat?: number;
  lng?: number;
  governate_id: string;
  wilayah_id: string;
  category_id: string;
  primary_image?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  duration?: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  governate?: Governate;
  wilayah?: Wilayah;
  category?: Category;
  images?: PlaceImage[];
  content_sections?: ContentSection[];
  properties?: Property[];
  categories?: Category[];
}

export interface PlaceImage {
  id: string;
  place_id: string;
  image_url: string;
  alt_text_ar?: string;
  alt_text_en?: string;
  caption_ar?: string;
  caption_en?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  images: string[];
  governorate: string;
}