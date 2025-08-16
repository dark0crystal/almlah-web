// src/services/placesApi.ts - Updated version with new functions
import { Place, Governate } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000/api/v1";

// Tourism category ID
const TOURISM_CATEGORY_ID = "9a5c3331-e22e-4e8e-bb3a-d0ce3c799017";

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
  categories?: Array<{
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    icon: string;
    type: string;
  }>;
}

// Extended interface for full place details
interface BackendPlaceDetailsResponse extends BackendPlaceResponse {
  description_ar: string;
  description_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  images?: Array<{
    id: string;
    place_id: string;
    image_url: string;
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
    images?: Array<{
      id: string;
      image_url: string;
      alt_text_ar: string;
      alt_text_en: string;
      caption_ar: string;
      caption_en: string;
      sort_order: number;
    }>;
  }>;
  properties?: Array<{
    id: string;
    name: string;
    icon: string;
    type: string;
  }>;
}

// New interfaces for recent places
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

// Single function to fetch places with optional governate filter
export const fetchPlaces = async (governateId?: string | null): Promise<Place[]> => {
  try {
    // Build URL: /places/filter/{categoryId}/{governateId?}
    let url = `${API_BASE_URL}/places/filter/${TOURISM_CATEGORY_ID}`;
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
        category_id: TOURISM_CATEGORY_ID,
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

// NEW: Fetch full place details by ID
export const fetchPlaceById = async (placeId: string): Promise<Place | null> => {
  try {
    const url = `${API_BASE_URL}/places/${placeId}`;
    console.log('Fetching place details from:', url);

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
    console.log('Place details API Response:', responseData);

    let placeData: BackendPlaceDetailsResponse;
    if (responseData.success && responseData.data) {
      placeData = responseData.data;
    } else if (responseData.data) {
      placeData = responseData.data;
    } else {
      console.error('Unexpected response format:', responseData);
      return null;
    }

    // Transform to frontend Place type with full details
    const transformedPlace: Place = {
      id: placeData.id,
      name_ar: placeData.name_ar || '',
      name_en: placeData.name_en || '',
      description_ar: placeData.description_ar || '',
      description_en: placeData.description_en || '',
      subtitle_ar: placeData.subtitle_ar || '',
      subtitle_en: placeData.subtitle_en || '',
      slug: placeData.name_en?.toLowerCase().replace(/\s+/g, '-') || '',
      lat: placeData.latitude || 0,
      lng: placeData.longitude || 0,
      governate_id: placeData.governate?.id || '',
      wilayah_id: placeData.wilayah?.id || '',
      category_id: TOURISM_CATEGORY_ID,
      primary_image: placeData.primary_image?.url || '',
      phone: placeData.phone || '',
      email: placeData.email || '',
      website: placeData.website || '',
      rating: placeData.rating || 0,
      review_count: placeData.review_count || 0,
      is_featured: false,
      is_active: true,
      created_at: '',
      updated_at: '',
      governate: placeData.governate,
      wilayah: placeData.wilayah,
      images: placeData.images?.map(img => ({
        id: img.id,
        place_id: img.place_id,
        image_url: img.image_url,
        alt_text_ar: img.alt_text || '',
        alt_text_en: img.alt_text || '',
        caption_ar: '',
        caption_en: '',
        is_primary: img.is_primary,
        display_order: img.display_order,
        created_at: '',
        updated_at: ''
      })) || [],
      content_sections: placeData.content_sections?.map(section => ({
        id: section.id,
        section_type: section.section_type,
        title_ar: section.title_ar,
        title_en: section.title_en,
        content_ar: section.content_ar,
        content_en: section.content_en,
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
      })) || []
    };

    console.log('Transformed place details:', transformedPlace);
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

    const url = `${API_BASE_URL}/places/recent?${params.toString()}`;
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
    const url = `${API_BASE_URL}/places/recent/stats`;
    
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
    const url = `${API_BASE_URL}/places/recent/count`;
    
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
    category_id: TOURISM_CATEGORY_ID,
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