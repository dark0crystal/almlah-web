// API service for dishes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST || 'http://127.0.0.1:9000';

export interface DishImage {
  id: string;
  dish_id: string;
  image_url: string;
  alt_text_ar: string;
  alt_text_en: string;
  caption_ar?: string;
  caption_en?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Governate {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

export interface DishResponse {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  governate?: Governate;
  preparation_time_minutes: number;
  serving_size: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_traditional: boolean;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  images: DishImage[];
  created_at: string;
  updated_at: string;
}

export interface DishListResponse {
  dishes: DishResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DishFilters {
  search?: string;
  governate_id?: string;
  difficulty?: string;
  is_traditional?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

class DishesApiService {
  private baseUrl = `${API_BASE_URL}/api/v1`;

  // Get all dishes with optional filters
  async getDishes(filters: DishFilters = {}): Promise<DishListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `${this.baseUrl}/dishes${params.toString() ? `?${params.toString()}` : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle both direct data and wrapped response
      if (result.success !== undefined) {
        return result.data || { dishes: [], total: 0, page: 1, page_size: 20, total_pages: 0 };
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching dishes:', error);
      throw error;
    }
  }

  // Get a single dish by ID
  async getDishById(id: string): Promise<DishResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/dishes/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle both direct data and wrapped response
      if (result.success !== undefined) {
        return result.data;
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching dish:', error);
      throw error;
    }
  }

  // Get dishes by governorate
  async getDishesByGovernate(governateId: string, filters: Omit<DishFilters, 'governate_id'> = {}): Promise<DishListResponse> {
    return this.getDishes({
      ...filters,
      governate_id: governateId,
      is_active: true, // Only show active dishes on public page
    });
  }

  // Get featured dishes
  async getFeaturedDishes(limit: number = 10): Promise<DishResponse[]> {
    const result = await this.getDishes({
      is_featured: true,
      is_active: true,
      page_size: limit,
      sort_by: 'sort_order',
      sort_order: 'asc'
    });
    
    return result.dishes;
  }

  // Get traditional dishes
  async getTraditionalDishes(limit: number = 20): Promise<DishResponse[]> {
    const result = await this.getDishes({
      is_traditional: true,
      is_active: true,
      page_size: limit,
      sort_by: 'name_en',
      sort_order: 'asc'
    });
    
    return result.dishes;
  }

  // Search dishes
  async searchDishes(searchTerm: string, filters: Omit<DishFilters, 'search'> = {}): Promise<DishListResponse> {
    return this.getDishes({
      ...filters,
      search: searchTerm,
      is_active: true,
    });
  }
}

// Export singleton instance
export const dishesApi = new DishesApiService();

// Helper functions for the dishes map page

// Map governorate slug to display name
export const getGovernorateDisplayName = (slug: string, locale: string = 'en'): string => {
  const names: { [key: string]: { en: string; ar: string } } = {
    'musandam': { en: 'Musandam', ar: 'مسندم' },
    'al-batinah-north': { en: 'Al Batinah North', ar: 'الباطنة شمال' },
    'al-buraimi': { en: 'Al Buraimi', ar: 'البريمي' },
    'ad-dhahirah': { en: 'Ad Dhahirah', ar: 'الظاهرة' },
    'dhofar': { en: 'Dhofar', ar: 'ظفار' },
    'al-wusta': { en: 'Al Wusta', ar: 'الوسطى' },
    'ash-sharqiyah-south': { en: 'Ash Sharqiyah South', ar: 'الشرقية جنوب' },
    'ash-sharqiyah-north': { en: 'Ash Sharqiyah North', ar: 'الشرقية شمال' },
    'muscat': { en: 'Muscat', ar: 'مسقط' },
    'al-batinah-south': { en: 'Al Batinah South', ar: 'الباطنة جنوب' },
    'ad-dakhiliyah': { en: 'Ad Dakhiliyah', ar: 'الداخلية' }
  };

  return names[slug]?.[locale as 'en' | 'ar'] || slug;
};

// Get dish name based on locale
export const getDishName = (dish: DishResponse, locale: string = 'en'): string => {
  return locale === 'ar' ? dish.name_ar : dish.name_en;
};

// Get dish description based on locale
export const getDishDescription = (dish: DishResponse, locale: string = 'en'): string => {
  return locale === 'ar' ? dish.description_ar : dish.description_en;
};

// Get primary image URL for a dish
export const getDishPrimaryImage = (dish: DishResponse): string | null => {
  const primaryImage = dish.images.find(img => img.is_primary);
  return primaryImage?.image_url || dish.images[0]?.image_url || null;
};

// Get all image URLs for a dish
export const getDishImages = (dish: DishResponse): string[] => {
  return dish.images
    .sort((a, b) => a.display_order - b.display_order)
    .map(img => img.image_url);
};

// Convert API dish to frontend Dish type for compatibility
export const convertApiDishToFrontendDish = (apiDish: DishResponse, locale: string = 'en') => {
  return {
    id: apiDish.id,
    name: getDishName(apiDish, locale),
    description: getDishDescription(apiDish, locale),
    images: getDishImages(apiDish),
    governorate: apiDish.governate?.slug || '',
    difficulty: apiDish.difficulty,
    preparationTime: apiDish.preparation_time_minutes,
    servingSize: apiDish.serving_size,
    isTraditional: apiDish.is_traditional,
    isFeatured: apiDish.is_featured,
  };
};