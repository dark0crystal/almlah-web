"use client"
import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useTranslations } from 'next-intl';
import { fetchPlaces } from '@/services/placesApi';
import { Place } from '@/types';

const libraries: ("places" | "geometry")[] = ['places'];

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '400px',
    borderRadius: '12px'
};

// Oman's geographic center and bounds
const OMAN_CENTER = { lat: 23.5859, lng: 58.4059 }; // Muscat coordinates

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
  const [restaurants, setRestaurants] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRestaurant, setActiveRestaurant] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Place | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const mapOptions = {
    center: OMAN_CENTER,
    zoom: 6,
    restriction: {
      latLngBounds: {
        north: 26.3959,
        south: 16.6333,
        east: 60.0000,
        west: 51.9999,
      },
    },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    // Fit map to show all restaurants if we have multiple
    if (restaurants.length > 1) {
      const validRestaurants = restaurants.filter(r => 
        r.lat && r.lng
      );

      if (validRestaurants.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        validRestaurants.forEach(restaurant => {
          bounds.extend({
            lat: restaurant.lat,
            lng: restaurant.lng
          });
        });
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    }
  }, [restaurants]);

  const handleMarkerClick = useCallback((restaurant: Place) => {
    setActiveRestaurant(restaurant.id);
    setSelectedMarker(restaurant);
    
    // Notify parent component about marker click
    if (onMarkerClick) {
      onMarkerClick(restaurant.id);
    }
  }, [onMarkerClick]);

  const createCustomRestaurantMarker = (restaurant: Place) => {
    const canvas = document.createElement('canvas');
    const size = 48;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

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

    const imageSrc = getImageSrc();

    if (imageSrc) {
      // Try to load and draw the restaurant image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          // Draw circle background
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#ea580c'; // Orange background for restaurants
          ctx.fill();
          
          // Draw white border
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Clip to circle for image
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
          ctx.clip();

          // Draw the restaurant image
          ctx.drawImage(img, 3, 3, size - 6, size - 6);
          ctx.restore();

          resolve(canvas.toDataURL());
        };

        img.onerror = () => {
          // Fallback: create colored marker with initial
          createFallbackMarker();
          resolve(canvas.toDataURL());
        };

        img.src = imageSrc;
      });
    } else {
      // No image, create fallback marker
      createFallbackMarker();
      return Promise.resolve(canvas.toDataURL());
    }

    function createFallbackMarker() {
      // Draw circle background
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ea580c'; // Orange for restaurants
      ctx.fill();
      
      // Draw white border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Add restaurant name initial
      const name = locale === 'ar' ? restaurant.name_ar : restaurant.name_en;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.charAt(0), size / 2, size / 2);
    }
  };

  if (loadError) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-sm">
            {t('errorLoadingMap')}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-lg bg-gray-100 flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">
            {loading ? t('loadingPlaces') : t('loadingMap')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
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

  if (restaurants.length === 0 && !loading) {
    const message = error === t('errors.noValidCoordinates')
      ? t('errors.noValidCoordinates')
      : t('noResults');
      
    return (
      <div className="w-full h-full min-h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
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
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={6}
        center={OMAN_CENTER}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {restaurants.map((restaurant) => {
          if (restaurant.lat && restaurant.lng) {
            return (
              <RestaurantMarker
                key={restaurant.id}
                restaurant={restaurant}
                locale={locale}
                onClick={() => handleMarkerClick(restaurant)}
              />
            );
          }
          return null;
        })}

        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.lat,
              lng: selectedMarker.lng
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <RestaurantInfoContent restaurant={selectedMarker} locale={locale} />
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map info overlay */}
      {isLoaded && restaurants.length > 0 && (
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

// Restaurant Marker Component
function RestaurantMarker({ 
  restaurant, 
  locale, 
  onClick 
}: { 
  restaurant: Place; 
  locale: string; 
  onClick: () => void; 
}) {
  const [iconUrl, setIconUrl] = useState<string>('');

  useEffect(() => {
    const createIcon = async () => {
      // Get restaurant image source with proper URL handling
      const getImageSrc = () => {
        let imageUrl = '';
        
        if (restaurant.primary_image) {
          imageUrl = restaurant.primary_image;
        } else if (restaurant.images && restaurant.images.length > 0) {
          const primaryImage = restaurant.images.find(img => img.is_primary) || restaurant.images[0];
          imageUrl = primaryImage.image_url;
        }
        
        if (!imageUrl) return null;
        
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          return imageUrl;
        }
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000";
        if (imageUrl.startsWith('/')) {
          return `${API_BASE_URL}${imageUrl}`;
        }
        
        return imageUrl;
      };

      const canvas = document.createElement('canvas');
      const size = 48;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const imageSrc = getImageSrc();

      if (imageSrc) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          // Draw circle background
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#ea580c';
          ctx.fill();
          
          // Draw white border
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Clip to circle for image
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
          ctx.clip();

          // Draw the restaurant image
          ctx.drawImage(img, 3, 3, size - 6, size - 6);
          ctx.restore();

          setIconUrl(canvas.toDataURL());
        };

        img.onerror = () => {
          createFallbackIcon();
        };

        img.src = imageSrc;
      } else {
        createFallbackIcon();
      }

      function createFallbackIcon() {
        // Draw circle background
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#ea580c';
        ctx.fill();
        
        // Draw white border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Add restaurant name initial
        const name = locale === 'ar' ? restaurant.name_ar : restaurant.name_en;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.charAt(0), size / 2, size / 2);

        setIconUrl(canvas.toDataURL());
      }
    };

    createIcon();
  }, [restaurant, locale]);

  if (!iconUrl) return null;

  return (
    <Marker
      position={{
        lat: restaurant.lat,
        lng: restaurant.lng
      }}
      icon={{
        url: iconUrl,
        scaledSize: new google.maps.Size(48, 48),
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        if (e.domEvent?.target) {
          (e.domEvent.target as HTMLElement).style.transform = 'scale(1.1)';
        }
      }}
      onMouseOut={(e) => {
        if (e.domEvent?.target) {
          (e.domEvent.target as HTMLElement).style.transform = 'scale(1)';
        }
      }}
    />
  );
}

// Restaurant Info Window Content Component
function RestaurantInfoContent({ restaurant, locale }: { restaurant: Place; locale: string }) {
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

  return (
    <div style={{ 
      textAlign: locale === 'ar' ? 'right' : 'left', 
      direction: locale === 'ar' ? 'rtl' : 'ltr',
      maxWidth: '250px'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
        {name}
      </h3>
      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ea580c', fontWeight: '500' }}>
        🍽️ {cuisineType}
      </p>
      {locationText && (
        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>
          📍 {locationText}
        </p>
      )}
      {restaurant.rating && (
        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>
          ⭐ {restaurant.rating.toFixed(1)} {locale === 'ar' ? 'تقييم' : 'rating'}
        </p>
      )}
      {restaurant.phone && (
        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>
          📞 {restaurant.phone}
        </p>
      )}
      <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
        {locale === 'ar' ? 'الإحداثيات' : 'Coordinates'}: {restaurant.lat.toFixed(4)}, {restaurant.lng.toFixed(4)}
      </div>
    </div>
  );
}