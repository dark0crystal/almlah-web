// services/placesApi.ts
import { PlaceCategory, ApiResponse, PlaceWithNewStatus } from './types';
import { Place } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

class PlacesApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      return result.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all places from the API
   */
  async getAllPlaces(): Promise<Place[]> {
    return this.makeRequest<Place[]>('/api/v1/places');
  }

  /**
   * Get places by category ID
   */
  async getPlacesByCategory(categoryId: string): Promise<Place[]> {
    return this.makeRequest<Place[]>(`/api/v1/places/category/${categoryId}`);
  }

  /**
   * Get places by governate ID
   */
  async getPlacesByGovernate(governateId: string): Promise<Place[]> {
    return this.makeRequest<Place[]>(`/api/v1/places/governate/${governateId}`);
  }

  /**
   * Get places with filters
   */
  async getPlacesByFilters(
    categoryId?: string, 
    governateId?: string
  ): Promise<Place[]> {
    const categoryParam = categoryId || '';
    const governateParam = governateId || '';
    return this.makeRequest<Place[]>(
      `/api/v1/places/filter/${categoryParam}/${governateParam}`
    );
  }

  /**
   * Search places by query
   */
  async searchPlaces(query: string): Promise<Place[]> {
    const encodedQuery = encodeURIComponent(query);
    return this.makeRequest<Place[]>(`/api/v1/places/search?q=${encodedQuery}`);
  }

  /**
   * Get a specific place by ID
   */
  async getPlaceById(id: string): Promise<Place> {
    return this.makeRequest<Place>(`/api/v1/places/${id}`);
  }

  /**
   * Get recent places (sorted by creation date)
   * This will return places sorted by newest first
   */
  async getRecentPlaces(limit: number = 6): Promise<Place[]> {
    const places = await this.getAllPlaces();
    
    // Sort places by creation date (newest first)
    const sortedPlaces = places
      .filter(place => place.created_at) // Only include places with creation date
      .sort((a, b) => {
        const dateA = new Date(a.created_at!);
        const dateB = new Date(b.created_at!);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });

    return sortedPlaces.slice(0, limit);
  }

  /**
   * Check if a place is "new" (created within the last week)
   */
  isPlaceNew(createdAt: string): boolean {
    const createdDate = new Date(createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return createdDate > oneWeekAgo;
  }

  /**
   * Get places with "new" status based on creation date
   */
  async getPlacesWithNewStatus(limit: number = 6): Promise<PlaceWithNewStatus[]> {
    const recentPlaces = await this.getRecentPlaces(limit);
    
    return recentPlaces.map(place => ({
      ...place,
      isNew: place.created_at ? this.isPlaceNew(place.created_at) : false
    }));
  }

  /**
   * Format relative time (e.g., "منذ يومين", "منذ أسبوع")
   */
  formatRelativeTime(dateString: string, language: 'ar' | 'en' = 'ar'): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (language === 'ar') {
      if (diffInDays === 0) return 'اليوم';
      if (diffInDays === 1) return 'منذ يوم';
      if (diffInDays === 2) return 'منذ يومين';
      if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
      if (diffInWeeks === 1) return 'منذ أسبوع';
      if (diffInWeeks === 2) return 'منذ أسبوعين';
      if (diffInWeeks < 4) return `منذ ${diffInWeeks} أسابيع`;
      if (diffInMonths === 1) return 'منذ شهر';
      if (diffInMonths === 2) return 'منذ شهرين';
      return `منذ ${diffInMonths} أشهر`;
    } else {
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return '1 day ago';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInWeeks === 1) return '1 week ago';
      if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
      if (diffInMonths === 1) return '1 month ago';
      return `${diffInMonths} months ago`;
    }
  }

  /**
   * Get the primary image URL or return a default placeholder
   */
  getPlaceImageUrl(place: Place): string {
    if (place.primary_image) {
      return place.primary_image;
    }

    // If no primary image, check if there are any images in the categories
    // This is a fallback - you might want to add a default image URL
    return '/images/placeholder-place.jpg'; // Make sure to add this default image
  }

  /**
   * Get place name based on language preference
   */
  getPlaceName(place: Place, language: 'ar' | 'en' = 'ar'): string {
    return language === 'ar' ? place.name_ar : place.name_en;
  }

  /**
   * Get place description based on language preference
   */
  getPlaceDescription(place: Place, language: 'ar' | 'en' = 'ar'): string {
    return language === 'ar' ? (place.description_ar || '') : (place.description_en || '');
  }

  /**
   * Get category name based on language preference
   */
  getCategoryName(category: PlaceCategory, language: 'ar' | 'en' = 'ar'): string {
    return language === 'ar' ? category.name_ar : category.name_en;
  }
}

// Export a singleton instance
export const placesApi = new PlacesApiService();

// Export the class for dependency injection if needed
export default PlacesApiService;