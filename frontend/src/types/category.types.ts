// Shared type definitions for category management

export interface Category {
  id: string;
  name?: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  icon?: string;
  type: 'primary' | 'secondary';
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  place_count?: number;
  subcategories?: Category[];
  children?: Category[];
}

export interface CategoryFormData {
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  icon: string;
  type: 'primary' | 'secondary';
  parent_id: string | null;
  sort_order: number;
}

export interface FormErrors {
  [key: string]: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type LanguageOption = 'en' | 'ar' | 'both';
export type ViewMode = 'hierarchy' | 'flat';

// Props interfaces
export interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  primaryCategories: Category[];
  onSave: (id: string | null, categoryData: CategoryFormData) => Promise<void>;
  currentLang: LanguageOption;
}

export interface CategoryItemProps {
  category: Category;
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  expandedCategories: Set<string>;
  onToggleExpand: (categoryId: string) => void;
  currentLang: LanguageOption;
}

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onConfirm: () => void;
  loading: boolean;
  currentLang: LanguageOption;
}