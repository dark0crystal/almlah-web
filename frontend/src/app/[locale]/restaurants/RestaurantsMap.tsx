"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchPlaces } from '@/services/placesApi' // Using the scalable placesApi
import { Place } from '@/types' // Using Place type instead of Restaurant

interface RestaurantsMapProps {
  selectedGovernateId?: string | null;
  searchQuery?: string;
  categoryId: string; // Required category ID prop
}

declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

export default function RestaurantsMap({ selectedGovernateId, categoryId }: RestaurantsMapProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [restaurants, setRestaurants] = useState<Place[]>([]); // Using Place type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Your Google Maps API key - Replace with your actual API key
  const GOOGLE_MAPS_API_KEY = 'AIzaSyBUxLKRFGzQm6LisWYqDby-H-YsacK47j0';

  // Localized text
  const text = {
    loading: locale === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...',
    googleMapsLoading: locale === 'ar' ? 'جاري تحميل خرائط جوجل...' : 'Loading Google Maps...',
    error: locale === 'ar' ? 'خطأ في تحميل الخريطة' : 'Error loading map',
    noRestaurants: locale === 'ar' ? 'لم يتم العثور على مطاعم' : 'No restaurants found',
    mapTitle: locale === 'ar' ? 'المطاعم' : 'Restaurants',
    restaurantsCount: (count: number) => 
      locale === 'ar' ? `${count} مطعم على الخريطة` : `${count} restaurants on map`,
    coordinates: locale === 'ar' ? 'الإحداثيات' : 'Coordinates',
    retry: locale === 'ar' ? 'حاول مرة أخرى' : 'Try Again'
  };

  // Load Google Maps API dynamically
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
        return;
      }

      window.initGoogleMap = () => {
        console.log('Google Maps loaded successfully');
        setTimeout(() => {
          setGoogleMapsLoaded(true);
        }, 100);
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initGoogleMap&libraries=marker,places&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        setError('Failed to load Google Maps');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          if (marker.setMap) {
            marker.setMap(null);
          }
        });
        markersRef.current = [];
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [GOOGLE_MAPS_API_KEY]);

  // Fetch restaurants with category ID
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading restaurants for categoryId:', categoryId, 'governateId:', selectedGovernateId);
        
        // FIXED: Use the unified fetchPlaces function with category ID
        const data = await fetchPlaces(categoryId, selectedGovernateId);
        console.log('Restaurants loaded:', data);
        
        // Filter restaurants with valid coordinates
        const validRestaurants = data.filter(restaurant => {
          const hasValidLat = restaurant.lat && !isNaN(restaurant.lat) && restaurant.lat !== 0 && Math.abs(restaurant.lat) <= 90;
          const hasValidLng = restaurant.lng && !isNaN(restaurant.lng) && restaurant.lng !== 0 && Math.abs(restaurant.lng) <= 180;
          
          console.log(`Restaurant ${restaurant.name_en}: lat=${restaurant.lat}, lng=${restaurant.lng}, valid=${hasValidLat && hasValidLng}`);
          
          return hasValidLat && hasValidLng;
        });
        
        console.log('Valid restaurants with coordinates:', validRestaurants);
        
        if (validRestaurants.length === 0 && data.length > 0) {
          console.warn('No restaurants have valid coordinates. All restaurants have lat/lng = 0');
          setError('No restaurants have valid coordinates');
        }
        
        setRestaurants(validRestaurants);
      } catch (err) {
        console.error('Failed to load restaurants:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    // Only load if we have a valid categoryId
    if (categoryId) {
      loadRestaurants();
    }
  }, [selectedGovernateId, categoryId]);

  // Initialize Google Map when Google Maps is loaded
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainer.current || map.current) return;

    const google = window.google;
    if (!google || !google.maps) {
      setError('Google Maps not available');
      return;
    }

    try {
      map.current = new google.maps.Map(mapContainer.current, {
        center: { lat: 23.6, lng: 58.4 }, // Oman center
        zoom: 6,
        mapId: 'DEMO_MAP_ID',
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      infoWindowRef.current = new google.maps.InfoWindow();
      console.log('Google Map initialized successfully');

    } catch (error) {
      console.error('Map initialization error:', error);
      setError('Failed to initialize map');
    }
  }, [googleMapsLoaded]);

  // Add markers when restaurants change
  useEffect(() => {
    if (!map.current || !googleMapsLoaded || loading || !restaurants.length) return;

    const google = window.google;
    if (!google || !google.maps) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidBounds = false;

    // Add markers
    restaurants.forEach(restaurant => {
      try {
        const name = locale === 'ar' ? restaurant.name_ar : restaurant.name_en;
        const governateName = locale === 'ar' 
          ? restaurant.governate?.name_ar 
          : restaurant.governate?.name_en;
        const wilayahName = locale === 'ar' 
          ? restaurant.wilayah?.name_ar 
          : restaurant.wilayah?.name_en;

        const locationText = [governateName, wilayahName]
          .filter(Boolean)
          .join(' | ');

        const cuisineType = restaurant.categories && restaurant.categories.length > 0
          ? (locale === 'ar' ? restaurant.categories[0].name_ar : restaurant.categories[0].name_en)
          : (locale === 'ar' ? 'مطاعم ومشروبات' : 'Food & Beverages');

        const position = { lat: restaurant.lat, lng: restaurant.lng };

        // Create a custom marker element for restaurants (orange color)
        const markerElement = document.createElement('div');
        markerElement.innerHTML = `
          <div style="
            width: 32px;
            height: 40px;
            background: #ea580c;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `;

        let marker;
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          marker = new google.maps.marker.AdvancedMarkerElement({
            map: map.current,
            position: position,
            content: markerElement,
            title: name
          });
        } else {
          marker = new google.maps.Marker({
            position: position,
            map: map.current,
            title: name,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24c0-8.8-7.2-16-16-16z" fill="#ea580c"/>
                  <circle cx="16" cy="16" r="6" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 40),
              anchor: new google.maps.Point(16, 40)
            }
          });
        }

        // Create info window content for restaurants
        const infoContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px; color: #1f2937; margin-top: 0;">
              ${name}
            </h3>
            <p style="font-size: 14px; margin-bottom: 4px; color: #ea580c; font-weight: 500;">
              🍽️ ${cuisineType}
            </p>
            ${locationText ? `
              <p style="font-size: 14px; margin-bottom: 4px; color: #6b7280; margin: 4px 0;">
                📍 ${locationText}
              </p>
            ` : ''}
            ${restaurant.rating ? `
              <p style="font-size: 14px; margin-bottom: 4px; color: #6b7280; margin: 4px 0;">
                ⭐ ${restaurant.rating.toFixed(1)} ${locale === 'ar' ? 'تقييم' : 'rating'}
              </p>
            ` : ''}
            ${restaurant.phone ? `
              <p style="font-size: 14px; margin-bottom: 4px; color: #6b7280; margin: 4px 0;">
                📞 ${restaurant.phone}
              </p>
            ` : ''}
            <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0;">
              ${text.coordinates}: ${restaurant.lat.toFixed(4)}, ${restaurant.lng.toFixed(4)}
            </p>
          </div>
        `;

        marker.addListener('click', () => {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(map.current, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
        hasValidBounds = true;

      } catch (error) {
        console.error('Error adding marker for restaurant:', restaurant.name_en, error);
      }
    });

    // Fit map to bounds or center on single restaurant
    if (hasValidBounds) {
      if (restaurants.length === 1) {
        map.current.setCenter({ lat: restaurants[0].lat, lng: restaurants[0].lng });
        map.current.setZoom(12);
      } else {
        map.current.fitBounds(bounds);
        const listener = google.maps.event.addListener(map.current, 'bounds_changed', () => {
          if (map.current.getZoom() > 12) {
            map.current.setZoom(12);
          }
          google.maps.event.removeListener(listener);
        });
      }
    }

  }, [restaurants, loading, locale, text.coordinates, googleMapsLoaded]);

  // Loading state
  if (loading || !googleMapsLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <div className="text-gray-600">
            {loading ? text.loading : text.googleMapsLoading}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">{text.error}</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            {text.retry}
          </button>
        </div>
      </div>
    );
  }

  // No restaurants state
  if (restaurants.length === 0 && !loading) {
    const message = error === 'No restaurants have valid coordinates' 
      ? (locale === 'ar' ? 'المطاعم المحملة لا تحتوي على إحداثيات صالحة' : 'Loaded restaurants do not have valid coordinates')
      : text.noRestaurants;
      
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-lg">{message}</div>
          {error === 'No restaurants have valid coordinates' && (
            <div className="text-sm mt-2 text-gray-400">
              {locale === 'ar' ? 'يرجى إضافة إحداثيات للمطاعم في قاعدة البيانات' : 'Please add coordinates to restaurants in database'}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="text-sm font-medium text-gray-700">{text.mapTitle}</div>
        <div className="text-xs text-gray-500">{text.restaurantsCount(restaurants.length)}</div>
      </div>
    </div>
  );
}