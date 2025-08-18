"use client"
import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { fetchPlaces } from '@/services/placesApi';
import { Place } from '@/types';

interface RestaurantsMapProps {
  selectedGovernateId?: string | null;
  searchQuery?: string;
  categoryId: string;
  locale?: string;
  onMarkerClick?: (restaurantId: string) => void;
}

export default function RestaurantsMap({ 
  selectedGovernateId, 
  categoryId, 
  locale = 'en',
  onMarkerClick 
}: RestaurantsMapProps) {
  const t = useTranslations('places');
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [restaurants, setRestaurants] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [activeRestaurant, setActiveRestaurant] = useState<string | null>(null);

  // Oman's geographic bounds for better map centering
  const OMAN_BOUNDS = {
    center: [58.4059, 23.5859], // Muscat coordinates as center
    bounds: [
      [51.9999, 16.6333], // Southwest coordinates
      [60.0000, 26.3959]  // Northeast coordinates
    ]
  };

  // Mapbox access token (same as your example)
  const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYWxtbGFoIiwiYSI6ImNtZGo1YXUxMDBoaGQyanF5amUybzNueW4ifQ.URYquetQ0MFz1bPJ_5lLaA';

  // Fetch restaurants with category ID
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading restaurants for categoryId:', categoryId, 'governateId:', selectedGovernateId);
        
        if (!categoryId) {
          throw new Error('Category ID is required');
        }
        
        const data = await fetchPlaces(categoryId, selectedGovernateId);
        console.log('Restaurants loaded:', data.length, 'items');
        
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
          setError(t('errors.noValidCoordinates'));
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

    if (categoryId) {
      loadRestaurants();
    }
  }, [selectedGovernateId, categoryId, t]);

  // Initialize map when scripts are loaded
  useEffect(() => {
    if (!scriptsLoaded || map.current || !mapContainer.current) return;

    const mapboxgl = window.mapboxgl;
    
    if (!mapboxgl) {
      console.error('Mapbox GL JS not loaded');
      setError(t('errors.mapInitializationFailed'));
      return;
    }

    // Set access token
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token not found');
      setError(t('errors.mapInitializationFailed'));
      return;
    }

    try {
      console.log('Initializing Mapbox map...');
      
      // Initialize Mapbox map centered on Oman
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: OMAN_BOUNDS.center,
        zoom: 6,
        maxBounds: OMAN_BOUNDS.bounds // Restrict map to Oman
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('Mapbox map loaded successfully');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox map error:', e);
        setError(t('errors.mapInitializationFailed'));
      });

      map.current.on('style.load', () => {
        console.log('Mapbox style loaded');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setError(t('errors.mapInitializationFailed'));
    }

    // Cleanup function
    return () => {
      if (map.current) {
        console.log('Cleaning up map...');
        map.current.remove();
        map.current = null;
      }
    };
  }, [scriptsLoaded, t]);

  // Add markers when restaurants change
  useEffect(() => {
    if (!map.current || !mapLoaded || !restaurants.length) {
      console.log('Markers effect - conditions not met:', {
        hasMap: !!map.current,
        mapLoaded,
        restaurantsLength: restaurants.length
      });
      return;
    }

    console.log('Adding markers for', restaurants.length, 'restaurants');

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for each restaurant
    restaurants.forEach(restaurant => {
      if (restaurant.lat && restaurant.lng) {
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

        // Get restaurant image source with proper URL handling
        const getImageSrc = () => {
          let imageUrl = '';
          
          // First try primary_image
          if (restaurant.primary_image) {
            imageUrl = restaurant.primary_image;
          }
          // Then try images array
          else if (restaurant.images && restaurant.images.length > 0) {
            const primaryImage = restaurant.images.find(img => img.is_primary) || restaurant.images[0];
            imageUrl = primaryImage.image_url;
          }
          
          // If no image found, return null
          if (!imageUrl) {
            return null;
          }
          
          // If it's already a full URL, return as is
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
          }
          
          // If it's a relative path, add API base URL
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000";
          if (imageUrl.startsWith('/')) {
            return `${API_BASE_URL}${imageUrl}`;
          }
          
          return imageUrl;
        };

        // Create marker element exactly like your example
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-restaurant-marker';
        markerElement.style.cssText = `
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
          background-size: cover;
          background-position: center;
          background-color: #ea580c;
        `;

        const imageSrc = getImageSrc();
        console.log(`Restaurant ${name} image:`, imageSrc);

        // Set background image if available
        if (imageSrc) {
          markerElement.style.backgroundImage = `url(${imageSrc})`;
          console.log(`Set background image for ${name}:`, imageSrc);
        } else {
          // Create a colored marker with restaurant initial (fallback)
          const colors = [
            '#ea580c', '#ef4444', '#f97316', '#eab308', 
            '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'
          ];
          const color = colors[restaurant.id.length % colors.length];
          markerElement.style.backgroundColor = color;
          markerElement.innerHTML = `
            <div style="
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">
              ${name.charAt(0)}
            </div>
          `;
          console.log(`Created fallback marker for ${name} with color:`, color);
        }

        // Add hover effect
        markerElement.addEventListener('mouseenter', () => {
          markerElement.style.transform = 'scale(1.1)';
        });

        markerElement.addEventListener('mouseleave', () => {
          markerElement.style.transform = 'scale(1)';
        });

        // Create popup content for restaurants
        const popupContent = `
          <div style="text-align: ${locale === 'ar' ? 'right' : 'left'}; direction: ${locale === 'ar' ? 'rtl' : 'ltr'}; min-width: 200px; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
              ${name}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #ea580c; font-weight: 500;">
              🍽️ ${cuisineType}
            </p>
            ${locationText ? `
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">
                📍 ${locationText}
              </p>
            ` : ''}
            ${restaurant.rating ? `
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">
                ⭐ ${restaurant.rating.toFixed(1)} ${locale === 'ar' ? 'تقييم' : 'rating'}
              </p>
            ` : ''}
            ${restaurant.phone ? `
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">
                📞 ${restaurant.phone}
              </p>
            ` : ''}
            <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0;">
              ${t('coordinates')}: ${restaurant.lat.toFixed(4)}, ${restaurant.lng.toFixed(4)}
            </p>
          </div>
        `;

        // Create popup
        const popup = new window.mapboxgl.Popup({
          offset: 25,
          closeOnClick: true
        }).setHTML(popupContent);

        // Create marker
        const marker = new window.mapboxgl.Marker(markerElement)
          .setLngLat([restaurant.lng, restaurant.lat])
          .setPopup(popup)
          .addTo(map.current);

        // Add click handler
        markerElement.addEventListener('click', () => {
          setActiveRestaurant(restaurant.id);
          
          // Center map on clicked marker
          map.current.flyTo({
            center: [restaurant.lng, restaurant.lat],
            zoom: 12,
            duration: 1000
          });

          // Notify parent component about marker click
          if (onMarkerClick) {
            onMarkerClick(restaurant.id);
          }
        });

        markers.current.push(marker);
      }
    });

    // Fit map to show all markers if we have multiple restaurants
    if (restaurants.length > 1) {
      const coordinates = restaurants.map(r => [r.lng, r.lat]);

      const bounds = new window.mapboxgl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord));

      map.current.fitBounds(bounds, {
        padding: 50,
        duration: 1000
      });
    } else if (restaurants.length === 1) {
      // Center on single restaurant
      map.current.flyTo({
        center: [restaurants[0].lng, restaurants[0].lat],
        zoom: 12,
        duration: 1000
      });
    }

    // Cleanup markers on unmount
    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
    };
  }, [restaurants, mapLoaded, locale, t, onMarkerClick]);

  // Loading state
  if (loading || !scriptsLoaded || !mapLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <div className="text-gray-600">
            {loading 
              ? t('loadingMap') 
              : !scriptsLoaded 
                ? t('scriptsLoading') 
                : t('loadingMap')
            }
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
          <div className="text-red-500 text-lg mb-2">{t('errorLoadingMap')}</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  // No restaurants state
  if (restaurants.length === 0 && !loading) {
    const message = error === t('errors.noValidCoordinates')
      ? t('errors.noValidCoordinates')
      : t('noResults');
      
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-lg">{message}</div>
          {error === t('errors.noValidCoordinates') && (
            <div className="text-sm mt-2 text-gray-400">
              {t('errors.addCoordinatesMessage')}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Load Mapbox GL JS CSS */}
      <link
        href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
        rel="stylesheet"
      />
      
      {/* Load Mapbox GL JS Script */}
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
        onLoad={() => {
          console.log('Mapbox script loaded');
          setScriptsLoaded(true);
        }}
        onError={(e) => {
          console.error('Failed to load Mapbox GL JS:', e);
          setError('Failed to load map scripts');
        }}
      />
                        
      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />

      {/* Loading overlay - only show when actually loading */}
      {(!scriptsLoaded || !mapLoaded) && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">
              {!scriptsLoaded 
                ? t('scriptsLoading') 
                : t('loadingMap')
              }
            </p>
          </div>
        </div>
      )}

      {/* Map info overlay */}
      {mapLoaded && restaurants.length > 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
          <div className={`text-sm ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            <p className="font-semibold text-gray-800">
              {locale === 'ar' ? 'مطاعم عمان' : 'Oman Restaurants'}
            </p>
            <p className="text-gray-600">
              {locale === 'ar' 
                ? `${restaurants.length} مطعم` 
                : `${restaurants.length} restaurants`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}