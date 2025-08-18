// types/restaurant.ts - TypeScript types for restaurants
// Add these types to your existing types file or create a new one

export interface Restaurant {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  slug: string;
  lat: number;
  lng: number;
  governate_id?: string;
  wilayah_id?: string;
  category_id: string;
  primary_image?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  is_featured?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
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
  category?: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    icon: string;
    type: string;
  };
  images?: RestaurantImage[];
  content_sections?: RestaurantContentSection[];
  properties?: RestaurantProperty[];
  categories?: RestaurantCategory[];
  
  // Restaurant-specific fields
  opening_hours?: string;
  closing_hours?: string;
  price_range?: string;
  cuisine_type?: string;
  delivery_available?: boolean;
  takeaway_available?: boolean;
  reservation_required?: boolean;
  outdoor_seating?: boolean;
  parking_available?: boolean;
  wifi_available?: boolean;
  payment_methods?: string[];
}

export interface RestaurantImage {
  id: string;
  place_id: string;
  image_url: string;
  alt_text_ar: string;
  alt_text_en: string;
  caption_ar: string;
  caption_en: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantContentSection {
  id: string;
  section_type: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  sort_order: number;
  images?: RestaurantContentSectionImage[];
}

export interface RestaurantContentSectionImage {
  id: string;
  image_url: string;
  alt_text_ar: string;
  alt_text_en: string;
  caption_ar: string;
  caption_en: string;
  sort_order: number;
}

export interface RestaurantProperty {
  id: string;
  name: string;
  icon: string;
  type: string;
}

export interface RestaurantCategory {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  type: string;
}

// Restaurant-specific filter types
export interface RestaurantFilters {
  governateId?: string | null;
  cuisineType?: string | null;
  priceRange?: string | null;
  rating?: number | null;
  features?: string[]; // delivery, takeaway, outdoor_seating, etc.
  openNow?: boolean;
}

// Restaurant search result type
export interface RestaurantSearchResult {
  id: string;
  name_ar: string;
  name_en: string;
  cuisine_type?: string;
  rating?: number;
  price_range?: string;
  distance?: number; // if location-based search
  image_url?: string;
  governate?: {
    name_ar: string;
    name_en: string;
  };
}

// Restaurant hours type
export interface RestaurantHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  is_24_hours?: boolean;
  is_closed?: boolean;
}

// Restaurant menu category type
export interface RestaurantMenuCategory {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  sort_order: number;
  items?: RestaurantMenuItem[];
}

// Restaurant menu item type
export interface RestaurantMenuItem {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  price: number;
  currency: string;
  image_url?: string;
  is_available: boolean;
  is_popular?: boolean;
  is_spicy?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  allergens?: string[];
  calories?: number;
  preparation_time?: number; // in minutes
}

// Restaurant review type
export interface RestaurantReview {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  title?: string;
  comment?: string;
  visit_date?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    profile_pic?: string;
  };
  helpful_count?: number;
  photos?: string[];
}

// Restaurant analytics type
export interface RestaurantAnalytics {
  total_views: number;
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  popular_times?: {
    [day: string]: number[]; // 24 hour array
  };
  search_keywords: string[];
  conversion_rate: number;
}

// Restaurant availability status
export interface RestaurantAvailability {
  is_open: boolean;
  opens_at?: string;
  closes_at?: string;
  next_opening?: string;
  is_temporarily_closed?: boolean;
  closure_reason?: string;
}

// Restaurant delivery info
export interface RestaurantDeliveryInfo {
  delivery_available: boolean;
  delivery_fee?: number;
  minimum_order?: number;
  delivery_radius?: number; // in km
  estimated_delivery_time?: number; // in minutes
  delivery_areas?: string[];
  delivery_partners?: string[]; // Talabat, Careem, etc.
}

// Restaurant reservation info
export interface RestaurantReservationInfo {
  reservation_required: boolean;
  online_booking_available: boolean;
  booking_url?: string;
  booking_phone?: string;
  advance_booking_days?: number;
  party_size_limit?: number;
  special_requirements?: string[];
}

// Extended restaurant type with additional features
export interface ExtendedRestaurant extends Restaurant {
  hours?: RestaurantHours;
  menu_categories?: RestaurantMenuCategory[];
  reviews?: RestaurantReview[];
  analytics?: RestaurantAnalytics;
  availability?: RestaurantAvailability;
  delivery_info?: RestaurantDeliveryInfo;
  reservation_info?: RestaurantReservationInfo;
  photos?: string[];
  videos?: string[];
  social_media?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  contact_person?: {
    name: string;
    position: string;
    phone: string;
    email: string;
  };
}