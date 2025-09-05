'use client'
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
  onMarkerClick?: (placeId: string) => void;
  selectedPlaceId?: string | null;
}

// Helper function to safely get coordinates
const getSafeCoordinates = (place: Place): { lat: number; lng: number } | null => {
  if (place.lat !== undefined && place.lng !== undefined && 
      !isNaN(place.lat) && !isNaN(place.lng) && 
      place.lat !== 0 && place.lng !== 0) {
    return { lat: place.lat, lng: place.lng };
  }
  return null;
};

export default function RestaurantsMap({ 
  selectedGovernateId, 
  categoryId, 
  locale = 'en',
  onMarkerClick,
  selectedPlaceId
}: RestaurantsMapProps) {
  const t = useTranslations('places');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch places with category ID
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading places for categoryId:', categoryId, 'governateId:', selectedGovernateId);
        
        if (!categoryId) {
          throw new Error('Category ID is required');
        }
        
        const data = await fetchPlaces(categoryId, selectedGovernateId);
        console.log('Places loaded:', data.length, 'items');
        
        // Filter places with valid coordinates
        const validPlaces = data.filter(place => {
          const coordinates = getSafeCoordinates(place);
          const isValid = coordinates !== null;
          
          console.log(`Place ${place.name_en}: lat=${place.lat}, lng=${place.lng}, valid=${isValid}`);
          
          return isValid;
        });
        
        console.log('Valid places with coordinates:', validPlaces);
        
        if (validPlaces.length === 0 && data.length > 0) {
          console.warn('No places have valid coordinates. All places have lat/lng = 0');
          setError(t('errors.noValidCoordinates'));
        }
        
        setPlaces(validPlaces);
      } catch (err) {
        console.error('Failed to load places:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      loadPlaces();
    }
  }, [selectedGovernateId, categoryId, t]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    // Fit map to show all places if we have multiple
    if (places.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      let hasValidBounds = false;
      
      places.forEach(place => {
        const coordinates = getSafeCoordinates(place);
        if (coordinates) {
          bounds.extend(coordinates);
          hasValidBounds = true;
        }
      });
      
      if (hasValidBounds) {
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    }
  }, [places]);

  const handleMarkerClick = useCallback((place: Place) => {
    setSelectedMarker(place);
    
    // Notify parent component about marker click
    if (onMarkerClick) {
      onMarkerClick(place.id);
    }
  }, [onMarkerClick]);

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

  if (places.length === 0 && !loading) {
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
        {places.map((place) => {
          const coordinates = getSafeCoordinates(place);
          if (coordinates) {
            return (
              <RestaurantMarker
                key={place.id}
                restaurant={place}
                locale={locale}
                isSelected={selectedPlaceId === place.id}
                onClick={() => handleMarkerClick(place)}
              />
            );
          }
          return null;
        })}

        {selectedMarker && (() => {
          const coordinates = getSafeCoordinates(selectedMarker);
          return coordinates ? (
            <InfoWindow
              position={coordinates}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <RestaurantInfoContent restaurant={selectedMarker} locale={locale} />
            </InfoWindow>
          ) : null;
        })()}
      </GoogleMap>

      {/* Map info overlay */}
      {isLoaded && places.length > 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
          <div className={`text-sm ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            <p className="font-semibold text-gray-800">
              {locale === 'ar' ? 'مطاعم عمان' : 'Oman Restaurants'}
            </p>
            <p className="text-gray-600">
              {locale === 'ar' 
                ? `${places.length} مطعم` 
                : `${places.length} restaurants`
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
  isSelected = false,
  onClick 
}: { 
  restaurant: Place; 
  locale: string; 
  isSelected?: boolean;
  onClick: () => void; 
}) {
  const [iconUrl, setIconUrl] = useState<string>('');
  const coordinates = getSafeCoordinates(restaurant);

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

  if (!iconUrl || !coordinates) return null;

  return (
    <Marker
      position={coordinates}
      icon={{
        url: iconUrl,
        scaledSize: new google.maps.Size(isSelected ? 56 : 48, isSelected ? 56 : 48),
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
      {restaurant.lat !== undefined && restaurant.lng !== undefined && (
        <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
          {locale === 'ar' ? 'الإحداثيات' : 'Coordinates'}: {restaurant.lat.toFixed(4)}, {restaurant.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
}