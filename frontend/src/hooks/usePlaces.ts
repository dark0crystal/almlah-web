// hooks/usePlaces.ts
"use client"
import { useState, useEffect, useCallback } from 'react';
import { placesApi, Place, PlaceWithNewStatus, PlacesStats } from '../services/placesApi';

export interface PlaceFilters {
  categoryId?: string;
  governateId?: string;
  wilayahId?: string;
  limit?: number;
  searchQuery?: string;
}

export interface UsePlacesOptions {
  filters?: PlaceFilters;
  language?: 'ar' | 'en';
  autoFetch?: boolean;
  fallbackToAll?: boolean; // If true, fetch all places when filtered results are < 6
}

export interface UsePlacesResult {
  places: Place[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasNewPlaces: boolean;
  newPlacesCount: number;
  totalPlaces: number;
}

export const usePlaces = (options: UsePlacesOptions = {}): UsePlacesResult => {
  const {
    filters = {},
    language = 'ar',
    autoFetch = true,
    fallbackToAll = true
  } = options;

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedPlaces: Place[] = [];
      const { categoryId, governateId, wilayahId, limit = 20, searchQuery } = filters;

      console.log('Fetching places with filters:', filters);

      // Handle search query first
      if (searchQuery) {
        fetchedPlaces = await placesApi.searchPlaces(searchQuery);
      }
      // Handle multiple filters
      else if (categoryId && governateId) {
        fetchedPlaces = await placesApi.getPlacesByFilters(categoryId, governateId);
      }
      // Handle single filters
      else if (categoryId) {
        fetchedPlaces = await placesApi.getPlacesByCategory(categoryId);
      }
      else if (governateId) {
        fetchedPlaces = await placesApi.getPlacesByGovernate(governateId);
      }
      else if (wilayahId) {
        fetchedPlaces = await placesApi.getPlacesByWilayah(wilayahId);
      }
      // Default: get recent places
      else {
        fetchedPlaces = await placesApi.getRecentPlaces(limit);
      }

      // Fallback logic: if we have fewer than 6 places and fallback is enabled
      if (fetchedPlaces.length < 6 && fallbackToAll && !searchQuery) {
        console.log(`Only ${fetchedPlaces.length} places found, fetching all places as fallback...`);
        
        try {
          const allPlaces = await placesApi.getAllPlaces();
          
          // Sort by creation date (newest first) and take the limit
          const sortedPlaces = allPlaces
            .filter(place => place.created_at)
            .sort((a, b) => {
              const dateA = new Date(a.created_at!);
              const dateB = new Date(b.created_at!);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, limit);

          fetchedPlaces = sortedPlaces;
          console.log(`Fallback successful: Now have ${fetchedPlaces.length} places`);
        } catch (fallbackError) {
          console.warn('Fallback fetch failed:', fallbackError);
          // Continue with original results even if fallback fails
        }
      }

      // Apply limit if specified
      if (limit && fetchedPlaces.length > limit) {
        fetchedPlaces = fetchedPlaces.slice(0, limit);
      }

      setPlaces(fetchedPlaces);

      console.log(`✅ Successfully fetched ${fetchedPlaces.length} places`);
      
      // Log debug info about new places
      const newPlaces = fetchedPlaces.filter(place => 
        place.created_at && placesApi.isPlaceNew(place.created_at)
      );
      console.log(`📍 ${newPlaces.length} places are marked as "new"`);

    } catch (err) {
      console.error('❌ Error fetching places:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في جلب البيانات';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, fallbackToAll]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchPlaces();
    }
  }, [fetchPlaces, autoFetch]);

  // Calculate derived values
  const hasNewPlaces = places.some(place => 
    place.created_at && placesApi.isPlaceNew(place.created_at)
  );

  const newPlacesCount = places.filter(place => 
    place.created_at && placesApi.isPlaceNew(place.created_at)
  ).length;

  const totalPlaces = places.length;

  return {
    places,
    loading,
    error,
    refetch: fetchPlaces,
    hasNewPlaces,
    newPlacesCount,
    totalPlaces
  };
};

// Specialized hook for recent places with new status using optimized endpoint
export const useRecentPlaces = (
  limit: number = 6, 
  language: 'ar' | 'en' = 'ar',
  minCount: number = 6,
  fallback: boolean = true
) => {
  const [places, setPlaces] = useState<PlaceWithNewStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlacesStats | null>(null);
  const [metadata, setMetadata] = useState({
    totalCount: 0,
    newCount: 0,
    hasFallback: false
  });

  const fetchRecentPlaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the optimized backend endpoint
      const response = await placesApi.getRecentPlacesOptimized(
        limit, 
        minCount, 
        fallback, 
        true // include stats
      );
      
      setPlaces(response.places);
      setStats(response.stats || null);
      setMetadata({
        totalCount: response.total_count,
        newCount: response.new_count,
        hasFallback: response.has_fallback
      });

      console.log(`✅ Successfully fetched ${response.places.length} recent places from optimized endpoint`);
      console.log(`📍 ${response.new_count} places are marked as "new"`);
      if (response.has_fallback) {
        console.log(`🔄 Fallback was used to reach minimum count of ${minCount}`);
      }

    } catch (err) {
      console.error('❌ Error fetching recent places:', err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في جلب البيانات';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit, minCount, fallback]);

  useEffect(() => {
    fetchRecentPlaces();
  }, [fetchRecentPlaces]);

  return {
    places,
    loading,
    error,
    refetch: fetchRecentPlaces,
    hasNewPlaces: metadata.newCount > 0,
    newPlacesCount: metadata.newCount,
    totalPlaces: metadata.totalCount,
    hasFallback: metadata.hasFallback,
    stats
  };
};

// Specialized hook for places by category
export const usePlacesByCategory = (
  categoryId: string, 
  language: 'ar' | 'en' = 'ar',
  limit?: number
) => {
  return usePlaces({
    filters: { categoryId, limit },
    language,
    fallbackToAll: false
  });
};

// Specialized hook for places by location
export const usePlacesByLocation = (
  governateId?: string,
  wilayahId?: string,
  language: 'ar' | 'en' = 'ar',
  limit?: number
) => {
  return usePlaces({
    filters: { governateId, wilayahId, limit },
    language,
    fallbackToAll: false
  });
};

// Specialized hook for search
export const useSearchPlaces = (
  searchQuery: string,
  language: 'ar' | 'en' = 'ar'
) => {
  return usePlaces({
    filters: { searchQuery },
    language,
    fallbackToAll: false,
    autoFetch: !!searchQuery // Only auto-fetch if there's a search query
  });
};