// API service for governorates
const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST || 'http://127.0.0.1:9000';

export interface GovernorateResponse {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar?: string;
  description_en?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

class GovernoratesApiService {
  private baseUrl = `${API_BASE_URL}/api/v1`;

  // Get all governorates
  async getGovernorates(): Promise<GovernorateResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/governates`, {
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
        return result.data || [];
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching governorates:', error);
      throw error;
    }
  }

  // Get active governorates only
  async getActiveGovernorates(): Promise<GovernorateResponse[]> {
    const governorates = await this.getGovernorates();
    return governorates.filter(gov => gov.is_active);
  }

  // Get governorate by slug
  async getGovernorateBySlug(slug: string): Promise<GovernorateResponse | null> {
    try {
      const governorates = await this.getGovernorates();
      return governorates.find(gov => gov.slug === slug) || null;
    } catch (error) {
      console.error('Error fetching governorate by slug:', error);
      return null;
    }
  }

  // Get governorate by ID
  async getGovernorateById(id: string): Promise<GovernorateResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/governates/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle both direct data and wrapped response
      if (result.success !== undefined) {
        return result.data;
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching governorate by ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const governoratesApi = new GovernoratesApiService();

// Helper functions

// Create a mapping from SVG IDs to governorate slugs
export const createGovernorateMapping = (governorates: GovernorateResponse[]) => {
  const svgIdMapping: { [key: string]: string } = {
    'OMMU': 'musandam',
    'OMBA': 'al-batinah-north', 
    'OMBU': 'al-buraimi',
    'OMZA': 'ad-dhahirah',
    'OMZU': 'dhofar',
    'OMWU': 'al-wusta',
    'OMSH': 'alsharqiyah-south',
    'OMSS': 'alsharqiyah-north',
    'OMMA': 'muscat',
    'OMBJ': 'al-batinah-south',
    'OMDA': 'ad-dakhiliyah'
  };

  // Create a reverse mapping for governorate data
  const mapping: { [key: string]: GovernorateResponse } = {};
  
  Object.entries(svgIdMapping).forEach(([svgId, slug]) => {
    const governorate = governorates.find(gov => gov.slug === slug);
    if (governorate) {
      mapping[svgId] = governorate;
    }
  });

  return { svgIdMapping, governorateData: mapping };
};

// Get governorate name by locale
export const getGovernorateName = (governorate: GovernorateResponse, locale: string = 'en'): string => {
  return locale === 'ar' ? governorate.name_ar : governorate.name_en;
};

// Get governorate description by locale
export const getGovernorateDescription = (governorate: GovernorateResponse, locale: string = 'en'): string => {
  return locale === 'ar' ? (governorate.description_ar || '') : (governorate.description_en || '');
};