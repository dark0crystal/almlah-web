// src/utils/restaurantUtils.ts - Utility functions for working with restaurants using placesApi
import { fetchPlaces, fetchPlaceById } from "@/services/placesApi";
import { Place } from "@/types";

// Restaurant category ID - you'll need to update this with the actual restaurant category ID
export const RESTAURANT_CATEGORY_ID = "9a5c3331-e22e-4e8e-bb3a-d0ce3c799018";

/**
 * Fetch restaurants by filtering places for restaurant category
 */
export const fetchRestaurants = async (governateId?: string | null): Promise<Place[]> => {
  try {
    const places = await fetchPlaces(governateId);
    
    // Filter for restaurants based on category
    const restaurants = places.filter(place => 
      place.categories?.some(cat => cat.id === RESTAURANT_CATEGORY_ID) ||
      place.category_id === RESTAURANT_CATEGORY_ID
    );
    
    return restaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
};

/**
 * Fetch a single restaurant by ID
 */
export const fetchRestaurantById = async (restaurantId: string): Promise<Place | null> => {
  try {
    const place = await fetchPlaceById(restaurantId);
    
    // Verify it's actually a restaurant
    if (place && (
      place.categories?.some(cat => cat.id === RESTAURANT_CATEGORY_ID) ||
      place.category_id === RESTAURANT_CATEGORY_ID
    )) {
      return place;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching restaurant by ID:', error);
    throw error;
  }
};

/**
 * Filter restaurants by cuisine type (based on category names)
 */
export const filterRestaurantsByCuisine = (restaurants: Place[], cuisineType: string): Place[] => {
  return restaurants.filter(restaurant =>
    restaurant.categories?.some(cat =>
      cat.name_en.toLowerCase().includes(cuisineType.toLowerCase()) ||
      cat.name_ar.toLowerCase().includes(cuisineType.toLowerCase())
    )
  );
};

/**
 * Filter restaurants by rating
 */
export const filterRestaurantsByRating = (restaurants: Place[], minRating: number): Place[] => {
  return restaurants.filter(restaurant =>
    restaurant.rating && restaurant.rating >= minRating
  );
};

/**
 * Sort restaurants by rating (highest first)
 */
export const sortRestaurantsByRating = (restaurants: Place[]): Place[] => {
  return [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
};

/**
 * Sort restaurants by name (alphabetical)
 */
export const sortRestaurantsByName = (restaurants: Place[], language: 'ar' | 'en' = 'en'): Place[] => {
  return [...restaurants].sort((a, b) => {
    const nameA = language === 'ar' ? a.name_ar : a.name_en;
    const nameB = language === 'ar' ? b.name_ar : b.name_en;
    return nameA.localeCompare(nameB);
  });
};

/**
 * Get featured restaurants
 */
export const getFeaturedRestaurants = (restaurants: Place[]): Place[] => {
  return restaurants.filter(restaurant => restaurant.is_featured);
};

/**
 * Search restaurants by name or description
 */
export const searchRestaurants = (restaurants: Place[], query: string, language: 'ar' | 'en' = 'en'): Place[] => {
  const searchTerm = query.toLowerCase();
  
  return restaurants.filter(restaurant => {
    const name = language === 'ar' ? restaurant.name_ar : restaurant.name_en;
    const description = language === 'ar' ? restaurant.description_ar : restaurant.description_en;
    
    return name.toLowerCase().includes(searchTerm) ||
           description.toLowerCase().includes(searchTerm);
  });
};

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

/**
 * Find nearby restaurants within a radius
 */
export const findNearbyRestaurants = (
  restaurants: Place[], 
  userLat: number, 
  userLng: number, 
  radiusKm: number = 10
): (Place & { distance: number })[] => {
  return restaurants
    .map(restaurant => ({
      ...restaurant,
      distance: calculateDistance(userLat, userLng, restaurant.lat, restaurant.lng)
    }))
    .filter(restaurant => restaurant.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get restaurant statistics
 */
export const getRestaurantStats = (restaurants: Place[]) => {
  const totalRestaurants = restaurants.length;
  const restaurantsWithRating = restaurants.filter(r => r.rating && r.rating > 0);
  const averageRating = restaurantsWithRating.length > 0 
    ? restaurantsWithRating.reduce((sum, r) => sum + (r.rating || 0), 0) / restaurantsWithRating.length
    : 0;
  
  const featuredCount = restaurants.filter(r => r.is_featured).length;
  
  // Group by governate
  const byGovernate = restaurants.reduce((acc, restaurant) => {
    const governateName = restaurant.governate?.name_en || 'Unknown';
    acc[governateName] = (acc[governateName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Group by cuisine type (first category)
  const byCuisine = restaurants.reduce((acc, restaurant) => {
    const cuisineName = restaurant.categories?.[0]?.name_en || 'Other';
    acc[cuisineName] = (acc[cuisineName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalRestaurants,
    averageRating: Math.round(averageRating * 10) / 10,
    featuredCount,
    restaurantsWithRating: restaurantsWithRating.length,
    byGovernate,
    byCuisine
  };
};

/**
 * Format restaurant hours for display
 */
export const formatRestaurantHours = (hours: string | undefined, language: 'ar' | 'en' = 'en'): string => {
  if (!hours) {
    return language === 'ar' ? 'غير محدد' : 'Hours not specified';
  }
  
  // You can add more sophisticated parsing here if needed
  return hours;
};

/**
 * Get restaurant type/cuisine from categories
 */
export const getRestaurantCuisine = (restaurant: Place, language: 'ar' | 'en' = 'en'): string => {
  if (restaurant.categories && restaurant.categories.length > 0) {
    // Get the first non-primary category (assuming first category is "Restaurants" and second is cuisine type)
    const cuisineCategory = restaurant.categories.find(cat => cat.type !== 'primary') || restaurant.categories[0];
    return language === 'ar' ? cuisineCategory.name_ar : cuisineCategory.name_en;
  }
  
  return language === 'ar' ? 'مطاعم ومشروبات' : 'Food & Beverages';
};

/**
 * Check if a restaurant is currently open (basic implementation)
 */
export const isRestaurantOpen = (hours: string | undefined): boolean => {
  if (!hours) return true; // Assume open if no hours specified
  
  // This is a basic implementation - you'd want to parse actual hours
  // For now, just return true
  return true;
};

/**
 * Get restaurant price level indicator
 */
export const getRestaurantPriceLevel = (restaurant: Place): number => {
  // This could be based on average price, category, or a specific field
  // For now, return a random level between 1-4
  if (restaurant.rating && restaurant.rating > 4.5) return 4;
  if (restaurant.rating && restaurant.rating > 4.0) return 3;
  if (restaurant.rating && restaurant.rating > 3.5) return 2;
  return 1;
};

export default {
  RESTAURANT_CATEGORY_ID,
  fetchRestaurants,
  fetchRestaurantById,
  filterRestaurantsByCuisine,
  filterRestaurantsByRating,
  sortRestaurantsByRating,
  sortRestaurantsByName,
  getFeaturedRestaurants,
  searchRestaurants,
  calculateDistance,
  findNearbyRestaurants,
  getRestaurantStats,
  formatRestaurantHours,
  getRestaurantCuisine,
  isRestaurantOpen,
  getRestaurantPriceLevel
};