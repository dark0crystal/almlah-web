export interface PlaceName {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

export interface Place {
  id: string;
  name: string | PlaceName;
  lat: number;
  lng: number;
  image: string;
  rating?: number;
  duration?: string;
  type?: string;
  description?: string;
  highlights?: string[];
  wilayah?: string;
  location?: string;
}

// Helper function to safely get place name
export const getPlaceName = (name: Place['name'], locale: string = 'en'): string => {
  if (typeof name === 'string') {
    return name;
  }
  
  if (typeof name === 'object' && name !== null) {
    return locale === 'ar' ? name.name_ar : name.name_en;
  }
  
  return 'Unknown Place';
};
