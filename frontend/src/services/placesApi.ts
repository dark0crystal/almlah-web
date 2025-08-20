// src/services/placesApi.ts - Updated to work with actual backend response and scalable categories
import { Place, Governate } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST ? `${process.env.NEXT_PUBLIC_API_HOST}/api/v1` : "http://localhost:9000/api/v1";

// CATEGORY IDS - Add your hardcoded category IDs here
export const CATEGORY_IDS = {
  TOURISM: "70f3cab9-5222-4716-b8ac-d76a399dcf3d",
  RESTAURANTS: "ef8ae8b3-9643-4204-bc93-fc239ade5b40", // NEW: Restaurant category ID
  FOOD_BEVERAGES: "another-category-id-here",
  ENTERTAINMENT: "yet-another-category-id-here",
  // Add more categories as needed
} as const;

// Type for category keys
export type CategoryType = keyof typeof CATEGORY_IDS;

// Actual backend response format from your Go service (dto.PlaceResponse)
interface BackendPlaceCompleteResponse {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  slug?: string;
  latitude: number;
  longitude: number;
  governate?: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
  };
  wilayah?: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  is_featured?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images?: Array<{
    id: string;
    url: string;
    alt_text: string;
    is_primary: boolean;
    display_order: number;
  }>;
  content_sections?: Array<{
    id: string;
    section_type: string;
    title_ar: string;
    title_en: string;
    content_ar: string;
    content_en: string;
    sort_order: number;
    is_active: boolean;
    images?: Array<{
      id: string;
      image_url: string;
      alt_text_ar: string;
      alt_text_en: string;
      caption_ar: string;
      caption_en: string;
      sort_order: number;
    }>;
    created_at: string;
    updated_at: string;
  }>;
  properties?: Array<{
    id: string;
    name: string;
    icon: string;
    type: string;
  }>;
  categories?: Array<{
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    icon: string;
    type: string;
  }>;
}

interface BackendPlaceResponse {
  id: string;
  name_ar: string;
  name_en: string;
  latitude: number;
  longitude: number;
  governate?: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
  };
  wilayah?: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
  };
  primary_image?: {
    id: string;
    url: string;
    is_primary: boolean;
  };
}

// NEW interfaces for recent places
interface PlaceWithNewStatus extends BackendPlaceResponse {
  is_new: boolean;
  created_at?: string;
}

interface RecentPlacesResponse {
  places: PlaceWithNewStatus[];
  total_count: number;
  new_count: number;
  has_fallback: boolean;
  stats?: PlacesStats;
}

interface PlacesStats {
  total_places: number;
  new_this_week: number;
  new_this_month: number;
  last_updated: string;
}

// UPDATED: Main function to fetch places by category and optional governate filter
export const fetchPlaces = async (
  categoryId: string, 
  governateId?: string | null
): Promise<Place[]> => {
  try {
    // Build URL: /places/filter/{categoryId}/{governateId?}
    let url = `${API_BASE_URL}/places/filter/${categoryId}`;
    if (governateId) {
      url += `/${governateId}`;
    }

    console.log('Fetching places from:', url);

    const response = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch places: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('API Response:', responseData);

    // Extract places data
    let placesData: BackendPlaceResponse[] = [];
    if (responseData.success && Array.isArray(responseData.data)) {
      placesData = responseData.data;
    } else if (Array.isArray(responseData.data)) {
      placesData = responseData.data;
    } else if (responseData.success && responseData.data === null) {
      // Handle null data case - no places found for this category/governate combination
      console.log('No places found for the specified filters');
      return [];
    } else {
      console.error('Unexpected response format:', responseData);
      return [];
    }

    // Transform to frontend Place type with proper coordinate mapping
    const transformedPlaces = placesData.map(place => {
      // Debug coordinate mapping
      console.log(`Mapping place ${place.name_en}: backend lat=${place.latitude}, lng=${place.longitude}`);
      
      const transformedPlace: Place = {
        id: place.id,
        name_ar: place.name_ar || '',
        name_en: place.name_en || '',
        description_ar: '',
        description_en: '',
        slug: '',
        // FIX: Properly map latitude and longitude from backend
        lat: place.latitude || 0,
        lng: place.longitude || 0,
        governate_id: place.governate?.id || '',
        wilayah_id: place.wilayah?.id || '',
        category_id: categoryId,
        primary_image: place.primary_image?.url || '',
        is_featured: false,
        is_active: true,
        created_at: '',
        updated_at: '',
        governate: place.governate,
        wilayah: place.wilayah,
        images: place.primary_image ? [{
          id: place.primary_image.id,
          place_id: place.id,
          image_url: place.primary_image.url,
          alt_text_ar: '',
          alt_text_en: '',
          caption_ar: '',
          caption_en: '',
          is_primary: place.primary_image.is_primary,
          display_order: 0,
          created_at: '',
          updated_at: ''
        }] : []
      };
      
      console.log(`Transformed place ${place.name_en}: frontend lat=${transformedPlace.lat}, lng=${transformedPlace.lng}`);
      return transformedPlace;
    });

    console.log('Final transformed places:', transformedPlaces);
    return transformedPlaces;

  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
};

// CONVENIENCE FUNCTIONS: Helper functions for specific categories
export const fetchTourismPlaces = async (governateId?: string | null): Promise<Place[]> => {
  return fetchPlaces(CATEGORY_IDS.TOURISM, governateId);
};

export const fetchRestaurantPlaces = async (governateId?: string | null): Promise<Place[]> => {
  return fetchPlaces(CATEGORY_IDS.RESTAURANTS, governateId);
};

export const fetchFoodBeveragePlaces = async (governateId?: string | null): Promise<Place[]> => {
  return fetchPlaces(CATEGORY_IDS.FOOD_BEVERAGES, governateId);
};

export const fetchEntertainmentPlaces = async (governateId?: string | null): Promise<Place[]> => {
  return fetchPlaces(CATEGORY_IDS.ENTERTAINMENT, governateId);
};

// UTILITY: Get category name for display
export const getCategoryName = (categoryType: CategoryType, locale: 'ar' | 'en' = 'en'): string => {
  const names = {
    TOURISM: { ar: 'السياحة', en: 'Tourism' },
    RESTAURANTS: { ar: 'المطاعم', en: 'Restaurants' },
    FOOD_BEVERAGES: { ar: 'الأطعمة والمشروبات', en: 'Food & Beverages' },
    ENTERTAINMENT: { ar: 'الترفيه', en: 'Entertainment' },
  };
  
  return names[categoryType]?.[locale] || categoryType;
};

// MAIN FUNCTION: Get complete place data with both languages (works with actual backend)
export const fetchPlaceById = async (placeId: string): Promise<Place | null> => {
  try {
    const url = `${API_BASE_URL}/places/${placeId}/complete`;
    console.log('Fetching complete place from:', url);

    const response = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 1800 } // 30 minutes cache
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Place not found:', placeId);
        return null;
      }
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch place details: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Complete place API Response:', responseData);

    let placeData: BackendPlaceCompleteResponse;
    if (responseData.success && responseData.data) {
      placeData = responseData.data;
    } else if (responseData.data) {
      placeData = responseData.data;
    } else {
      console.error('Unexpected response format:', responseData);
      return null;
    }

    // Transform backend PlaceResponse to frontend Place type
    const transformedPlace: Place = {
      id: placeData.id,
      name_ar: placeData.name_ar || '',
      name_en: placeData.name_en || '',
      description_ar: placeData.description_ar || '',
      description_en: placeData.description_en || '',
      subtitle_ar: placeData.subtitle_ar || '',
      subtitle_en: placeData.subtitle_en || '',
      slug: placeData.slug || placeData.name_en?.toLowerCase().replace(/\s+/g, '-') || '',
      lat: placeData.latitude || 0,
      lng: placeData.longitude || 0,
      governate_id: placeData.governate?.id || '',
      wilayah_id: placeData.wilayah?.id || '',
      category_id: placeData.categories?.[0]?.id || '',
      primary_image: placeData.images?.find(img => img.is_primary)?.url || 
                     placeData.images?.[0]?.url || '',
      phone: placeData.phone || '',
      email: placeData.email || '',
      website: placeData.website || '',
      rating: placeData.rating || 0,
      review_count: placeData.review_count || 0,
      is_featured: placeData.is_featured || false,
      is_active: placeData.is_active || true,
      created_at: placeData.created_at || '',
      updated_at: placeData.updated_at || '',
      governate: placeData.governate,
      wilayah: placeData.wilayah,
      // FIXED: Map images correctly from backend format
      images: placeData.images?.map(img => ({
        id: img.id,
        place_id: placeData.id, // Use placeData.id since backend doesn't include place_id in image
        image_url: img.url, // Backend uses 'url' not 'image_url'
        alt_text_ar: img.alt_text || '', // Backend only has alt_text, not separate ar/en
        alt_text_en: img.alt_text || '',
        caption_ar: '',
        caption_en: '',
        is_primary: img.is_primary,
        display_order: img.display_order,
        created_at: '',
        updated_at: ''
      })) || [],
      // FIXED: Map content sections correctly
      content_sections: placeData.content_sections?.map(section => ({
        id: section.id,
        section_type: section.section_type,
        title_ar: section.title_ar || '',
        title_en: section.title_en || '',
        content_ar: section.content_ar || '',
        content_en: section.content_en || '',
        sort_order: section.sort_order,
        images: section.images?.map(img => ({
          id: img.id,
          image_url: img.image_url,
          alt_text_ar: img.alt_text_ar,
          alt_text_en: img.alt_text_en,
          caption_ar: img.caption_ar,
          caption_en: img.caption_en,
          sort_order: img.sort_order
        })) || []
      })) || [],
      properties: placeData.properties?.map(prop => ({
        id: prop.id,
        name: prop.name,
        icon: prop.icon,
        type: prop.type
      })) || [],
      categories: placeData.categories?.map(cat => ({
        id: cat.id,
        name_ar: cat.name_ar || '',
        name_en: cat.name_en || '',
        slug: cat.slug,
        icon: cat.icon,
        type: cat.type
      })) || []
    };

    console.log('Transformed complete place:', transformedPlace);
    console.log('Images count:', transformedPlace.images?.length || 0);
    console.log('Content sections count:', transformedPlace.content_sections?.length || 0);
    return transformedPlace;

  } catch (error) {
    console.error('Error fetching complete place:', error);
    throw error;
  }
};

// DEPRECATED: Keep for backward compatibility only (language-specific endpoint)
export const fetchPlaceByIdWithLanguage = async (placeId: string, language: 'ar' | 'en' = 'ar'): Promise<Place | null> => {
  console.warn('fetchPlaceByIdWithLanguage is deprecated. Use fetchPlaceById instead for complete data.');
  
  try {
    const url = `${API_BASE_URL}/places/${placeId}?lang=${language}`;
    
    const response = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 1800 }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch place details: ${response.status}`);
    }

    const responseData = await response.json();
    const placeData = responseData.data;

    // Map to Place interface but with limited language data
    const transformedPlace: Place = {
      id: placeData.id,
      name_ar: language === 'ar' ? placeData.name : '',
      name_en: language === 'en' ? placeData.name : '',
      description_ar: language === 'ar' ? placeData.description : '',
      description_en: language === 'en' ? placeData.description : '',
      subtitle_ar: language === 'ar' ? placeData.subtitle : '',
      subtitle_en: language === 'en' ? placeData.subtitle : '',
      slug: placeData.name?.toLowerCase().replace(/\s+/g, '-') || '',
      lat: placeData.latitude || 0,
      lng: placeData.longitude || 0,
      governate_id: placeData.governate?.id || '',
      wilayah_id: placeData.wilayah?.id || '',
      category_id: placeData.categories?.[0]?.id || '',
      primary_image: placeData.images?.find((img: any) => img.is_primary)?.url || 
                     placeData.images?.[0]?.url || '',
      phone: placeData.phone || '',
      email: placeData.email || '',
      website: placeData.website || '',
      rating: placeData.rating || 0,
      review_count: placeData.review_count || 0,
      is_featured: false,
      is_active: true,
      created_at: '',
      updated_at: '',
      governate: placeData.governate ? {
        id: placeData.governate.id,
        name_ar: language === 'ar' ? placeData.governate.name : '',
        name_en: language === 'en' ? placeData.governate.name : '',
        slug: placeData.governate.slug
      } : undefined,
      wilayah: placeData.wilayah ? {
        id: placeData.wilayah.id,
        name_ar: language === 'ar' ? placeData.wilayah.name : '',
        name_en: language === 'en' ? placeData.wilayah.name : '',
        slug: placeData.wilayah.slug
      } : undefined,
      images: placeData.images?.map((img: any) => ({
        id: img.id,
        place_id: placeData.id,
        image_url: img.url,
        alt_text_ar: img.alt_text || '',
        alt_text_en: img.alt_text || '',
        caption_ar: '',
        caption_en: '',
        is_primary: img.is_primary,
        display_order: img.display_order,
        created_at: '',
        updated_at: ''
      })) || [],
      content_sections: placeData.content_sections?.map((section: any) => ({
        id: section.id,
        section_type: section.section_type,
        title_ar: language === 'ar' ? section.title : '',
        title_en: language === 'en' ? section.title : '',
        content_ar: language === 'ar' ? section.content : '',
        content_en: language === 'en' ? section.content : '',
        sort_order: section.sort_order,
        images: section.images?.map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          alt_text_ar: img.alt_text_ar,
          alt_text_en: img.alt_text_en,
          caption_ar: img.caption_ar,
          caption_en: img.caption_en,
          sort_order: img.sort_order
        })) || []
      })) || [],
      properties: placeData.properties?.map((prop: any) => ({
        id: prop.id,
        name: prop.name,
        icon: prop.icon,
        type: prop.type
      })) || [],
      categories: placeData.categories?.map((cat: any) => ({
        id: cat.id,
        name_ar: language === 'ar' ? cat.name : '',
        name_en: language === 'en' ? cat.name : '',
        slug: cat.slug,
        icon: cat.icon,
        type: cat.type
      })) || []
    };

    return transformedPlace;
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
};

// NEW: Get recent places using the optimized backend endpoint
export const fetchRecentPlaces = async (
  limit: number = 6,
  minCount: number = 6,
  fallback: boolean = true,
  includeStats: boolean = false
): Promise<RecentPlacesResponse> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      min_count: minCount.toString(),
      fallback: fallback.toString(),
    });

    if (includeStats) {
      params.append('include_stats', 'true');
    }

    const url = `${API_BASE_URL}/recent?${params.toString()}`;
    console.log('Fetching recent places from:', url);

    const response = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 900 } // 15 minutes cache
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch recent places: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Recent places API Response:', responseData);

    let data: RecentPlacesResponse;
    if (responseData.success && responseData.data) {
      data = responseData.data;
    } else if (responseData.data) {
      data = responseData.data;
    } else {
      console.error('Unexpected response format:', responseData);
      throw new Error('Invalid response format');
    }

    return data;

  } catch (error) {
    console.error('Error fetching recent places:', error);
    throw error;
  }
};

// NEW: Get places statistics
export const fetchPlacesStats = async (): Promise<PlacesStats> => {
  try {
    const url = `${API_BASE_URL}/recent/stats`;
    
    const response = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 1800 } // 30 minutes cache
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch places statistics: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (responseData.success && responseData.data) {
      return responseData.data;
    } else if (responseData.data) {
      return responseData.data;
    } else {
      throw new Error('Invalid response format');
    }

  } catch (error) {
    console.error('Error fetching places statistics:', error);
    throw error;
  }
};

// NEW: Get count of new places only
export const fetchNewPlacesCount = async (): Promise<number> => {
  try {
    const url = `${API_BASE_URL}/recent/count`;
    
    const response = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 900 } // 15 minutes cache
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch new places count: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (responseData.success && responseData.data && typeof responseData.data.count === 'number') {
      return responseData.data.count;
    } else if (responseData.data && typeof responseData.data.count === 'number') {
      return responseData.data.count;
    } else {
      throw new Error('Invalid response format');
    }

  } catch (error) {
    console.error('Error fetching new places count:', error);
    throw error;
  }
};

// NEW: Transform recent places to your existing Place format
export const transformRecentPlacesToPlaces = (recentPlaces: PlaceWithNewStatus[]): (Place & { isNew: boolean })[] => {
  return recentPlaces.map(place => ({
    id: place.id,
    name_ar: place.name_ar || '',
    name_en: place.name_en || '',
    description_ar: '',
    description_en: '',
    slug: place.name_en?.toLowerCase().replace(/\s+/g, '-') || '',
    lat: place.latitude || 0,
    lng: place.longitude || 0,
    governate_id: place.governate?.id || '',
    wilayah_id: place.wilayah?.id || '',
    category_id: '', // Will be filled by the specific category function
    primary_image: place.primary_image?.url || '',
    is_featured: false,
    is_active: true,
    created_at: place.created_at || '',
    updated_at: '',
    governate: place.governate,
    wilayah: place.wilayah,
    images: place.primary_image ? [{
      id: place.primary_image.id,
      place_id: place.id,
      image_url: place.primary_image.url,
      alt_text_ar: '',
      alt_text_en: '',
      caption_ar: '',
      caption_en: '',
      is_primary: place.primary_image.is_primary,
      display_order: 0,
      created_at: '',
      updated_at: ''
    }] : [],
    isNew: place.is_new
  }));
};

// NEW: Utility function to check if a place is new (client-side fallback)
export const isPlaceNew = (createdAt: string): boolean => {
  const createdDate = new Date(createdAt);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return createdDate > oneWeekAgo;
};

// NEW: Format relative time for Arabic/English
export const formatRelativeTime = (dateString: string, language: 'ar' | 'en' = 'ar'): string => {
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
};

// Simple function to fetch governates (unchanged)
export const fetchGovernates = async (): Promise<Governate[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/governates`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 86400 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch governates');
    }

    const responseData = await response.json();
    
    let data = [];
    if (responseData.success && Array.isArray(responseData.data)) {
      data = responseData.data;
    } else if (Array.isArray(responseData.data)) {
      data = responseData.data;
    } else {
      return [];
    }

    return data.map((gov: any) => ({
      id: gov.id,
      name_ar: gov.name_ar || '',
      name_en: gov.name_en || '',
      slug: gov.slug || '',
      created_at: gov.created_at || '',
      updated_at: gov.updated_at || ''
    }));

  } catch (error) {
    console.error('Error fetching governates:', error);
    return [];
  }
};