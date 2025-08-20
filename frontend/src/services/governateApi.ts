// src/services/governateApi.ts - API service for governate data
const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST ? `${process.env.NEXT_PUBLIC_API_HOST}/api/v1` : "http://localhost:9000/api/v1";

// Types based on your backend DTOs
export interface GovernateImage {
  id: string;
  governate_id?: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  upload_date?: string;
}

export interface SimpleWilayah {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

export interface GovernateDetails {
  id: string;
  name_ar: string;
  name_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  sort_order: number;
  wilayah_count: number;
  place_count: number;
  wilayahs?: SimpleWilayah[];
  images: GovernateImage[];
  created_at: string;
  updated_at: string;
}

// Fetch all governorates
export const fetchGovernates = async (): Promise<GovernateDetails[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/governates`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch governates: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Governates API Response:', responseData);

    // Handle different response structures
    let governatesData: GovernateDetails[] = [];
    if (responseData.success && Array.isArray(responseData.data)) {
      governatesData = responseData.data;
    } else if (Array.isArray(responseData.data)) {
      governatesData = responseData.data;
    } else if (Array.isArray(responseData)) {
      governatesData = responseData;
    } else {
      console.error('Unexpected response format:', responseData);
      return [];
    }

    return governatesData;
  } catch (error) {
    console.error('Error fetching governates:', error);
    throw error;
  }
};

// Fetch single governate by ID
export const fetchGovernateById = async (governateId: string): Promise<GovernateDetails | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/governates/${governateId}`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Governate not found:', governateId);
        return null;
      }
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch governate: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Governate details API Response:', responseData);

    // Handle different response structures
    let governateData: GovernateDetails;
    if (responseData.success && responseData.data) {
      governateData = responseData.data;
    } else if (responseData.data) {
      governateData = responseData.data;
    } else {
      console.error('Unexpected response format:', responseData);
      return null;
    }

    return governateData;
  } catch (error) {
    console.error('Error fetching governate details:', error);
    throw error;
  }
};

// Fetch governate wilayahs
export const fetchGovernateWilayahs = async (governateId: string): Promise<SimpleWilayah[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/governates/${governateId}/wilayahs`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch wilayahs: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Wilayahs API Response:', responseData);

    let wilayahsData: SimpleWilayah[] = [];
    if (responseData.success && Array.isArray(responseData.data)) {
      wilayahsData = responseData.data;
    } else if (Array.isArray(responseData.data)) {
      wilayahsData = responseData.data;
    } else {
      console.error('Unexpected response format:', responseData);
      return [];
    }

    return wilayahsData;
  } catch (error) {
    console.error('Error fetching wilayahs:', error);
    throw error;
  }
};

// Fetch governate images
export const fetchGovernateImages = async (governateId: string): Promise<GovernateImage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/governates/${governateId}/images`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 1800 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch images: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Images API Response:', responseData);

    let imagesData: GovernateImage[] = [];
    if (responseData.success && Array.isArray(responseData.data)) {
      imagesData = responseData.data;
    } else if (Array.isArray(responseData.data)) {
      imagesData = responseData.data;
    } else {
      console.error('Unexpected response format:', responseData);
      return [];
    }

    return imagesData;
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
};

// Wilayah image interface
export interface WilayahImage {
  id: string;
  wilayah_id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  upload_date?: string;
}

// Extended wilayah interface with images
export interface WilayahWithImages extends SimpleWilayah {
  image_url?: string;
  place_count?: number;
  images?: WilayahImage[];
}

// Fetch wilayah images
export const fetchWilayahImages = async (wilayahId: string): Promise<WilayahImage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/wilayahs/${wilayahId}/images`, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      next: { revalidate: 1800 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch wilayah images: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Wilayah Images API Response:', responseData);

    let imagesData: WilayahImage[] = [];
    if (responseData.success && Array.isArray(responseData.data)) {
      imagesData = responseData.data;
    } else if (Array.isArray(responseData.data)) {
      imagesData = responseData.data;
    } else {
      console.error('Unexpected response format:', responseData);
      return [];
    }

    return imagesData;
  } catch (error) {
    console.error('Error fetching wilayah images:', error);
    return []; // Return empty array instead of throwing
  }
};

// Utility functions
export const getGovernateImageUrl = (imageUrl: string): string => {
  console.log('getGovernateImageUrl called with:', imageUrl);
  
  if (!imageUrl) {
    console.log('No imageUrl provided, returning default');
    return '/img1.jpeg'; // Using existing image as fallback
  }
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('Full URL detected, returning as is:', imageUrl);
    return imageUrl;
  }
  
  // If it's a relative path, add API base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:9000";
  if (imageUrl.startsWith('/')) {
    const fullUrl = `${API_BASE}${imageUrl}`;
    console.log('Relative URL detected, converted to:', fullUrl);
    return fullUrl;
  }
  
  console.log('Returning imageUrl as is (no modification needed):', imageUrl);
  return imageUrl;
};

export const getPrimaryImage = (images: GovernateImage[]): string => {
  if (!images || images.length === 0) return '/img1.jpeg'; // Using existing image as fallback
  
  // Find primary image or use first image
  const primaryImage = images.find(img => img.is_primary) || images[0];
  return getGovernateImageUrl(primaryImage.url);
};

export const getSortedImages = (images: GovernateImage[]): GovernateImage[] => {
  return [...(images || [])].sort((a, b) => {
    // Primary image first
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    // Then by display order
    return a.display_order - b.display_order;
  });
};

// Wilayah image utility functions
export const getWilayahImageUrl = (imageUrl: string): string => {
  if (!imageUrl) {
    return '/img1.jpeg'; // Default fallback image
  }
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative path, add API base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:9000";
  if (imageUrl.startsWith('/')) {
    return `${API_BASE}${imageUrl}`;
  }
  
  return imageUrl;
};

export const getPrimaryWilayahImage = (images: WilayahImage[]): string => {
  if (!images || images.length === 0) return '/img1.jpeg';
  
  // Find primary image or use first image
  const primaryImage = images.find(img => img.is_primary) || images[0];
  return getWilayahImageUrl(primaryImage.url);
};

export const getSortedWilayahImages = (images: WilayahImage[]): WilayahImage[] => {
  return [...(images || [])].sort((a, b) => {
    // Primary image first
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    // Then by display order
    return a.display_order - b.display_order;
  });
};