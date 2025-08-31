"use client"
import React, { useCallback, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { fetchPlaces } from '@/services/placesApi'
import { Place } from '@/types'

const libraries: ("places" | "geometry")[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '12px'
};

interface PlacesMapProps {
  selectedGovernateId?: string | null;
  searchQuery?: string;
  categoryId: string; // Required category ID prop
  onMarkerClick?: (placeId: string) => void;
  selectedPlaceId?: string | null;
}

// Oman's geographic center and bounds
const OMAN_CENTER = { lat: 23.5859, lng: 58.4059 }; // Muscat coordinates

export default function PlacesMap({ selectedGovernateId, categoryId, onMarkerClick, selectedPlaceId }: PlacesMapProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('places');
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

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
          const hasValidLat = place.lat && !isNaN(place.lat) && place.lat !== 0 && Math.abs(place.lat) <= 90;
          const hasValidLng = place.lng && !isNaN(place.lng) && place.lng !== 0 && Math.abs(place.lng) <= 180;
          
          console.log(`Place ${place.name_en}: lat=${place.lat}, lng=${place.lng}, valid=${hasValidLat && hasValidLng}`);
          
          return hasValidLat && hasValidLng;
        });
        
        console.log('Valid places with coordinates:', validPlaces);
        
        if (validPlaces.length === 0 && data.length > 0) {
          console.warn('No places have valid coordinates.');
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
      const validPlaces = places.filter(p => p.lat && p.lng);

      if (validPlaces.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        validPlaces.forEach(place => {
          bounds.extend({
            lat: place.lat!,
            lng: place.lng!
          });
        });
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    }
  }, [places]);

  const handleMarkerClick = useCallback((place: Place) => {
    setSelectedPlace(place);
    
    // Notify parent component about marker click
    if (onMarkerClick) {
      onMarkerClick(place.id);
    }
  }, [onMarkerClick]);

  const createCustomMarkerIcon = (place: Place) => {
    const canvas = document.createElement('canvas');
    const size = selectedPlaceId === place.id ? 56 : 48;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Get place image
    const getImageSrc = () => {
      return place.primary_image || place.images?.[0]?.image_url || null;
    };

    // Generate a consistent color based on place ID
    const getMarkerColor = () => {
      const colors = [
        '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', 
        '#f59e0b', '#6366f1', '#ec4899', '#14b8a6',
        '#f97316', '#06b6d4', '#059669'
      ];
      const hash = place.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return colors[Math.abs(hash) % colors.length];
    };

    // Draw circle background
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
    ctx.fillStyle = getImageSrc() ? '#3B82F6' : getMarkerColor();
    ctx.fill();
    
    // Draw white border (thicker if selected)
    ctx.strokeStyle = selectedPlaceId === place.id ? '#3b82f6' : 'white';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Add text if no image
    const imageSrc = getImageSrc();
    if (!imageSrc) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const name = locale === 'ar' ? place.name_ar : place.name_en;
      ctx.fillText(name.charAt(0), size / 2, size / 2);
    }

    return canvas.toDataURL();
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
      <div className="w-full h-full min-h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
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
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('retry')}
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
          if (place.lat && place.lng) {
            return (
              <PlaceMarker
                key={place.id}
                place={place}
                locale={locale}
                isSelected={selectedPlaceId === place.id}
                onClick={() => handleMarkerClick(place)}
              />
            );
          }
          return null;
        })}

        {selectedPlace && (
          <InfoWindow
            position={{
              lat: selectedPlace.lat!,
              lng: selectedPlace.lng!
            }}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <PlaceInfoContent place={selectedPlace} locale={locale} />
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map info overlay */}
      {isLoaded && places.length > 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
          <div className={`text-sm ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            <p className="font-semibold text-gray-800">
              {t('mapTitle')}
            </p>
            <p className="text-gray-600">
              {t('placesCount', { count: places.length })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Place Marker Component
function PlaceMarker({ 
  place, 
  locale, 
  isSelected,
  onClick 
}: { 
  place: Place; 
  locale: string; 
  isSelected: boolean;
  onClick: () => void; 
}) {
  const [iconUrl, setIconUrl] = useState<string>('');

  useEffect(() => {
    const createIcon = async () => {
      const canvas = document.createElement('canvas');
      const size = isSelected ? 56 : 48;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Get place image
      const getImageSrc = () => {
        return place.primary_image || place.images?.[0]?.image_url || null;
      };

      // Generate a consistent color based on place ID
      const getMarkerColor = () => {
        const colors = [
          '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', 
          '#f59e0b', '#6366f1', '#ec4899', '#14b8a6',
          '#f97316', '#06b6d4', '#059669'
        ];
        const hash = place.id.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        return colors[Math.abs(hash) % colors.length];
      };

      const imageSrc = getImageSrc();

      if (imageSrc) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          // Draw circle background
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
          ctx.fillStyle = getMarkerColor();
          ctx.fill();
          
          // Draw border (thicker if selected)
          ctx.strokeStyle = isSelected ? '#3b82f6' : 'white';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Clip to circle for image
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
          ctx.clip();

          // Draw the place image
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
        ctx.fillStyle = getMarkerColor();
        ctx.fill();
        
        // Draw border (thicker if selected)
        ctx.strokeStyle = isSelected ? '#3b82f6' : 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Add place name initial
        const name = locale === 'ar' ? place.name_ar : place.name_en;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.charAt(0), size / 2, size / 2);

        setIconUrl(canvas.toDataURL());
      }
    };

    createIcon();
  }, [place, locale, isSelected]);

  if (!iconUrl) return null;

  return (
    <Marker
      position={{
        lat: place.lat!,
        lng: place.lng!
      }}
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

// Place Info Window Content Component
function PlaceInfoContent({ place, locale }: { place: Place; locale: string }) {
  const t = useTranslations('places');
  const name = locale === 'ar' ? place.name_ar : place.name_en;
  const governateName = locale === 'ar' 
    ? place.governate?.name_ar 
    : place.governate?.name_en;
  const wilayahName = locale === 'ar' 
    ? place.wilayah?.name_ar 
    : place.wilayah?.name_en;

  const locationText = [governateName, wilayahName]
    .filter(Boolean)
    .join(' | ');

  return (
    <div style={{ 
      textAlign: locale === 'ar' ? 'right' : 'left', 
      direction: locale === 'ar' ? 'rtl' : 'ltr',
      maxWidth: '250px'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
        {name}
      </h3>
      {locationText && (
        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>
          📍 {locationText}
        </p>
      )}
    </div>
  );
}