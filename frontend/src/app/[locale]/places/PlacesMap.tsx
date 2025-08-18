"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchPlaces } from '@/services/placesApi'
import { Place } from '@/types'

interface PlacesMapProps {
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

export default function PlacesMap({ selectedGovernateId, categoryId }: PlacesMapProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [places, setPlaces] = useState<Place[]>([]);
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
    noPlaces: locale === 'ar' ? 'لم يتم العثور على أماكن' : 'No places found',
    mapTitle: locale === 'ar' ? 'الأماكن' : 'Places',
    placesCount: (count: number) => 
      locale === 'ar' ? `${count} مكان على الخريطة` : `${count} places on map`,
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

  // Fetch places with category ID
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading places for categoryId:', categoryId, 'governateId:', selectedGovernateId);
        
        // Use the updated fetchPlaces function with category ID
        const data = await fetchPlaces(categoryId, selectedGovernateId);
        console.log('Places loaded:', data);
        
        // Filter places with valid coordinates
        const validPlaces = data.filter(place => {
          const hasValidLat = place.lat && !isNaN(place.lat) && place.lat !== 0 && Math.abs(place.lat) <= 90;
          const hasValidLng = place.lng && !isNaN(place.lng) && place.lng !== 0 && Math.abs(place.lng) <= 180;
          
          console.log(`Place ${place.name_en}: lat=${place.lat}, lng=${place.lng}, valid=${hasValidLat && hasValidLng}`);
          
          return hasValidLat && hasValidLng;
        });
        
        console.log('Valid places with coordinates:', validPlaces);
        
        if (validPlaces.length === 0 && data.length > 0) {
          console.warn('No places have valid coordinates. All places have lat/lng = 0');
          setError('No places have valid coordinates');
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

    // Only load if we have a valid categoryId
    if (categoryId) {
      loadPlaces();
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

  // Add markers when places change
  useEffect(() => {
    if (!map.current || !googleMapsLoaded || loading || !places.length) return;

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
    places.forEach(place => {
      try {
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

        const position = { lat: place.lat, lng: place.lng };

        // Create a custom marker element
        const markerElement = document.createElement('div');
        markerElement.innerHTML = `
          <div style="
            width: 32px;
            height: 40px;
            background: #3b82f6;
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
                  <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24c0-8.8-7.2-16-16-16z" fill="#3b82f6"/>
                  <circle cx="16" cy="16" r="6" fill="white"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 40),
              anchor: new google.maps.Point(16, 40)
            }
          });
        }

        const infoContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px; color: #1f2937; margin-top: 0;">
              ${name}
            </h3>
            ${locationText ? `
              <p style="font-size: 14px; margin-bottom: 4px; color: #6b7280; margin: 4px 0;">
                📍 ${locationText}
              </p>
            ` : ''}
            <p style="font-size: 12px; color: #9ca3af; margin: 8px 0 0 0;">
              ${text.coordinates}: ${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}
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
        console.error('Error adding marker for place:', place.name_en, error);
      }
    });

    // Fit map to bounds or center on single place
    if (hasValidBounds) {
      if (places.length === 1) {
        map.current.setCenter({ lat: places[0].lat, lng: places[0].lng });
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

  }, [places, loading, locale, text.coordinates, googleMapsLoaded]);

  // Loading state
  if (loading || !googleMapsLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
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
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {text.retry}
          </button>
        </div>
      </div>
    );
  }

  // No places state
  if (places.length === 0 && !loading) {
    const message = error === 'No places have valid coordinates' 
      ? (locale === 'ar' ? 'الأماكن المحملة لا تحتوي على إحداثيات صالحة' : 'Loaded places do not have valid coordinates')
      : text.noPlaces;
      
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-lg">{message}</div>
          {error === 'No places have valid coordinates' && (
            <div className="text-sm mt-2 text-gray-400">
              {locale === 'ar' ? 'يرجى إضافة إحداثيات للأماكن في قاعدة البيانات' : 'Please add coordinates to places in database'}
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
        <div className="text-xs text-gray-500">{text.placesCount(places.length)}</div>
      </div>
    </div>
  );
}