import { Place } from '@/types';

// PostCard component props interface
export interface PostCardProps {
  title: string;
  description?: string;
  image?: string;
  author?: string;
  date?: string;
  category?: string;
  isNew?: boolean;
  placeId?: string;
}

// Enhanced PostData interface for internal use in PostCardWrapper
export interface PostData {
  id: string;
  title: string;
  description?: string;
  image?: string;
  author?: string;
  date?: string;
  category?: string;
  isNew?: boolean;
  slug?: string;
  place?: Place; // Store the original place data for reference
}

// Props for PostCardsWrapper component
export interface PostCardsWrapperProps {
  title?: string;
  language?: 'ar' | 'en';
  categoryId?: string;
  governateId?: string;
  wilayahId?: string;
}

// Drag state interface for mouse interactions
export interface DragState {
  x: number;
  scrollLeft: number;
}

// API interfaces for the places service
export interface PlaceImage {
  id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

export interface PlaceCategory {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon?: string;
  type: string;
}

export interface PlaceGovernate {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

export interface PlaceWilayah {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

// Extended Place interface with optional isNew property
export interface PlaceWithNewStatus extends Place {
  isNew?: boolean;
}

// API Response wrapper interface
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}