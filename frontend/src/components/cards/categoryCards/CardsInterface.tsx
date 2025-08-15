// CardsInterface.ts - Type definitions for the category cards

export interface LocalizedCategoryResponse {
  id: string;
  name: string;
  slug?: string;
  description: string;
  icon: string;
  type?: string;
  parent_id?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  sort_order?: number;
  place_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryResponse {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  icon: string;
  type: string;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  place_count: number;
  parent?: CategoryResponse;
  subcategories?: CategoryResponse[];
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CategoryCardProps {
  category: LocalizedCategoryResponse;
  locale: string;
  onCategoryClick?: (category: LocalizedCategoryResponse) => void;
}

export interface CategoryCardsWrapperProps {
  onCategoryClick?: (category: LocalizedCategoryResponse) => void;
  className?: string;
}