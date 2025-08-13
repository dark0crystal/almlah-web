"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchPlaces } from '@/services/placesApi'
import { Place } from '@/types'

interface PlacesMapProps {
  selectedGovernateId?: string | null;
  searchQuery?: string;
}

export default function PlacesMap({ selectedGovernateId }: PlacesMapProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  // Localized text
  const text = {
    loading: locale === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...',
    mapboxLoading: locale === 'ar' ? 'جاري تحميل Mapbox...' : 'Loading Mapbox...',
    error: locale === 'ar' ? 'خطأ في تحميل الخريطة' : 'Error loading map',
    noPlaces: locale === 'ar' ? 'لم يتم العثور على أماكن' : 'No places found',
    mapTitle: locale === 'ar' ? 'الأماكن السياحية' : 'Tourism Places',
    placesCount: (count: number) => 
      locale === 'ar' ? `${count} مكان على الخريطة` : `${count} places on map`,
    coordinates: locale === 'ar' ? 'الإحداثيات' : 'Coordinates',
    retry: locale === 'ar' ? 'حاول مرة أخرى' : 'Try Again'
  };

  // Load Mapbox GL JS dynamically
  useEffect(() => {
    const loadMapbox = () => {
      // Check if already loaded
      if (window.mapboxgl) {
        setMapboxLoaded(true);
        return;
      }

      // Load CSS
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.js';
      script.onload = () => {
        console.log('Mapbox GL JS loaded successfully');
        setMapboxLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Mapbox GL JS');
        setError('Failed to load map library');
      };
      document.head.appendChild(script);
    };

    loadMapbox();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Fetch places
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading places for governate:', selectedGovernateId);
        
        const data = await fetchPlaces(selectedGovernateId);
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

    loadPlaces();
  }, [selectedGovernateId]);

  // Initialize map when Mapbox is loaded
  useEffect(() => {
    if (!mapboxLoaded || !mapContainer.current || map.current) return;

    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) {
      setError('Mapbox GL not available');
      return;
    }

    try {
      // Set access token
      mapboxgl.accessToken = 'pk.eyJ1IjoiYWxtbGFoIiwiYSI6ImNtZGo1YXUxMDBoaGQyanF5amUybzNueW4ifQ.URYquetQ0MFz1bPJ_5lLaA';
      
      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [58.4, 23.6], // Oman center
        zoom: 6,
        attributionControl: false
      });

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('Map loaded successfully');
      });

      map.current.on('error', (e: any) => {
        console.error('Map error:', e);
        setError('Map failed to load');
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      setError('Failed to initialize map');
    }
  }, [mapboxLoaded]);

  // Add markers when places change
  useEffect(() => {
    if (!map.current || !mapboxLoaded || loading || !places.length) return;

    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Calculate bounds for multiple places
    if (places.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      places.forEach(place => {
        bounds.extend([place.lng, place.lat]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12
      });
    } else if (places.length === 1) {
      map.current.flyTo({
        center: [places[0].lng, places[0].lat],
        zoom: 12
      });
    }

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

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; padding: 4px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px; color: #1f2937;">
              ${name}
            </h3>
            ${locationText ? `
              <p style="font-size: 14px; margin-bottom: 4px; color: #6b7280;">
                📍 ${locationText}
              </p>
            ` : ''}
            <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
              ${text.coordinates}: ${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}
            </p>
          </div>
        `;

        const marker = new mapboxgl.Marker({ 
          color: '#3b82f6',
          scale: 0.8
        })
          .setLngLat([place.lng, place.lat])
          .setPopup(new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false
          }).setHTML(popupContent))
          .addTo(map.current);

        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error adding marker for place:', place.name_en, error);
      }
    });

  }, [places, loading, locale, text.coordinates, mapboxLoaded]);

  // Loading state
  if (loading || !mapboxLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-600">
            {loading ? text.loading : text.mapboxLoading}
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