"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { fetchPlaces } from '@/services/placesApi'
import { Place } from '@/types'
import { createPlaceMarker, createPlacePopupContent } from '@/components/places/PlaceMarker'

interface PlacesMapProps {
  selectedGovernateId?: string | null;
  searchQuery?: string;
  categoryId: string; // Required category ID prop
  onMarkerClick?: (placeId: string) => void;
  selectedPlaceId?: string | null;
}

// Extend Window interface for Mapbox
declare global {
  interface Window {
    mapboxgl: any;
  }
}

export default function PlacesMap({ selectedGovernateId, categoryId, onMarkerClick, selectedPlaceId }: PlacesMapProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('places');
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Mapbox access token
  const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYWxtbGFoIiwiYSI6ImNtZGo1YXUxMDBoaGQyanF5amUybzNueW4ifQ.URYquetQ0MFz1bPJ_5lLaA';

  // Oman's geographic bounds
  const OMAN_BOUNDS = {
    center: [58.4059, 23.5859] as [number, number], // Muscat coordinates as center
    bounds: [
      [51.9999, 16.6333], // Southwest coordinates
      [60.0000, 26.3959]  // Northeast coordinates
    ] as [[number, number], [number, number]]
  };

  // Fetch places with category ID
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading places for categoryId:', categoryId, 'governateId:', selectedGovernateId);
        
        const data = await fetchPlaces(categoryId, selectedGovernateId);
        console.log('Places loaded:', data);
        
        // Filter places with valid coordinates
        const validPlaces = data.filter(place => {
          const hasValidLat = place.lat != null && !isNaN(place.lat) && Math.abs(place.lat) <= 90;
          const hasValidLng = place.lng != null && !isNaN(place.lng) && Math.abs(place.lng) <= 180;
          
          console.log(`Place ${place.name_en}: lat=${place.lat}, lng=${place.lng}, valid=${hasValidLat && hasValidLng}`);
          
          return hasValidLat && hasValidLng;
        });
        
        console.log('Valid places with coordinates:', validPlaces);
        
        if (validPlaces.length === 0 && data.length > 0) {
          console.warn('No places have valid coordinates.');
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

    if (categoryId) {
      loadPlaces();
    }
  }, [selectedGovernateId, categoryId]);

  // Initialize map when scripts are loaded
  useEffect(() => {
    if (!scriptsLoaded || map.current || !mapContainer.current) return;

    const mapboxgl = window.mapboxgl;
    
    if (!mapboxgl) {
      console.error('Mapbox GL JS not loaded');
      return;
    }

    // Set access token
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token not found');
      return;
    }

    try {
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
        setMapLoaded(true);
      });

      // Cleanup function
      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [scriptsLoaded]);

  // Add markers when places change
  useEffect(() => {
    console.log('Marker effect conditions:', { 
      hasMap: !!map.current, 
      mapLoaded, 
      placesLength: places.length,
      placesWithCoords: places.filter(p => p.lat != null && p.lng != null).length
    });
    
    if (!map.current || !mapLoaded || !places.length) {
      console.log('Skipping marker creation - conditions not met');
      return;
    }

    const mapboxgl = window.mapboxgl;
    if (!mapboxgl) {
      console.error('Mapbox GL not available');
      return;
    }

    console.log('Clearing existing markers:', markers.current.length);
    // Clear existing markers
    markers.current.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    markers.current = [];

    let markersCreated = 0;
    
    // Add new markers for each place
    places.forEach((place, index) => {
      if (place.lat != null && place.lng != null) {
        console.log(`Creating marker ${index + 1} for ${place.name_en} at [${place.lng}, ${place.lat}]`);
        
        try {
          const { markerElement, name } = createPlaceMarker(
            place, 
            locale, 
            t('coordinates'),
            onMarkerClick,
            selectedPlaceId
          );
          
          const popupContent = createPlacePopupContent(place, locale, t('coordinates'));

          // Create popup
          const popup = new mapboxgl.Popup({
            offset: 30,
            closeOnClick: true
          }).setHTML(popupContent);

          // Create marker with proper coordinates
          const coordinates = [place.lng, place.lat];
          console.log(`Setting marker at coordinates:`, coordinates);
          
          const marker = new mapboxgl.Marker(markerElement)
            .setLngLat(coordinates)
            .setPopup(popup)
            .addTo(map.current);

          markers.current.push(marker);
          markersCreated++;
          
          console.log(`Marker ${index + 1} created successfully`);
        } catch (error) {
          console.error(`Error creating marker ${index + 1}:`, error);
        }
      } else {
        console.log(`Skipping place ${place.name_en} - no valid coordinates (lat: ${place.lat}, lng: ${place.lng})`);
      }
    });
    
    console.log(`Total markers created: ${markersCreated} out of ${places.length} places`);

    // Fit map to show all markers
    if (markersCreated > 0) {
      const validPlaces = places.filter(p => 
        p.lat != null && p.lng != null
      );

      if (validPlaces.length > 1) {
        console.log('Fitting map to show all markers');
        const coordinates = validPlaces.map(p => [p.lng!, p.lat!]);
        console.log('Marker coordinates:', coordinates);

        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord));

        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        });
      } else if (validPlaces.length === 1) {
        console.log('Centering map on single place');
        const center = [validPlaces[0].lng!, validPlaces[0].lat!];
        console.log('Center coordinates:', center);
        
        map.current.flyTo({
          center: center,
          zoom: 12,
          duration: 1000
        });
      }
    } else {
      console.warn('No markers created - cannot fit map bounds');
    }
  }, [places, mapLoaded, locale, t, onMarkerClick, selectedPlaceId]);

  return (
    <div className="w-full h-full relative flex justify-center items-center">
      {/* Load Mapbox GL JS CSS */}
      <link
        href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
        rel="stylesheet"
      />
      
      {/* Load Mapbox GL JS Script */}
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
        onLoad={() => setScriptsLoaded(true)}
        onError={(e) => console.error('Failed to load Mapbox GL JS:', e)}
      />
      
      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-full min-h-[400px] rounded-lg"
        style={{ minHeight: '400px' }}
      />

      {/* Loading overlay */}
      {(!scriptsLoaded || !mapLoaded || loading) && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">
              {loading 
                ? t('loadingPlaces')
                : !scriptsLoaded 
                ? t('scriptsLoading') 
                : t('loadingMap')
              }
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
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
      )}

      {/* No places state */}
      {!loading && !error && places.length === 0 && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg">{t('noPlaces')}</div>
          </div>
        </div>
      )}

      {/* Map info overlay */}
      {mapLoaded && places.length > 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
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