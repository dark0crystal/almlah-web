// services/categoryApi.ts
// Create stub types for build compatibility
interface LocalizedCategoryResponse {
  id: string;
  name: string;
  slug: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

/**
 * Fetch primary categories from API with localization support
 * @param lang - Language code ('ar' | 'en')
 * @returns Promise<LocalizedCategoryResponse[]>
 */
export const fetchPrimaryCategories = async (
  lang: string = 'en'
): Promise<LocalizedCategoryResponse[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/categories/primary?lang=${lang}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Add cache control for better performance
        next: { revalidate: 300 } // Revalidate every 5 minutes
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: ApiResponse<LocalizedCategoryResponse[]> = await response.json();
    
    // Handle API response structure
    if (data.success) {
      return data.data || [];
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching primary categories:', error);
    throw new Error('Failed to fetch categories. Please try again later.');
  }
};

/**
 * Fetch all categories (both languages)
 * @returns Promise<LocalizedCategoryResponse[]>
 */
export const fetchAllCategories = async (): Promise<LocalizedCategoryResponse[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 300 }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: ApiResponse<LocalizedCategoryResponse[]> = await response.json();
    
    if (data.success) {
      return data.data || [];
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching all categories:', error);
    throw new Error('Failed to fetch categories. Please try again later.');
  }
};

/**
 * Fetch category by ID with localization
 * @param id - Category ID
 * @param lang - Language code ('ar' | 'en')
 * @returns Promise<LocalizedCategoryResponse>
 */
export const fetchCategoryById = async (
  id: string, 
  lang: string = 'en'
): Promise<LocalizedCategoryResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/categories/${id}?lang=${lang}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        next: { revalidate: 300 }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: ApiResponse<LocalizedCategoryResponse> = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    
    throw new Error('Category not found');
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    throw new Error('Failed to fetch category. Please try again later.');
  }
};