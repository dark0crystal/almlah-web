// src/services/placesApi.ts - Simplified version
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

    // Transform to frontend Place type
    return placesData.map(place => ({
      id: place.id,
      name_ar: place.name_ar || '',
      name_en: place.name_en || '',
      description_ar: '',
      description_en: '',
      slug: '',
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
    } as Place));

  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
};

// Simple function to fetch governates
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