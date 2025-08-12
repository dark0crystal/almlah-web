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
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);

  // Localized text
  const text = {
    loading: locale === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...',
    mapboxLoading: locale === 'ar' ? 'جاري تحميل Mapbox...' : 'Loading Mapbox...',
    noPlaces: locale === 'ar' ? 'لم يتم العثور على أماكن' : 'No places found',
    mapTitle: locale === 'ar' ? 'الأماكن السياحية' : 'Tourism Places',
    placesCount: (count: number) => 
      locale === 'ar' ? `${count} مكان على الخريطة` : `${count} places on map`,
    coordinates: locale === 'ar' ? 'الإحداثيات' : 'Coordinates'
  };

  // Load Mapbox
  useEffect(() => {
    const loadMapbox = () => {
      if (window.mapboxgl) {
        setMapboxLoaded(true);
        return;
      }

      // Load CSS
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => setMapboxLoaded(true);
      script.onerror = () => console.error('Failed to load Mapbox');
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
        const data = await fetchPlaces(selectedGovernateId);
        // Filter places with valid coordinates
        setPlaces(data.filter(place => 
          place.lat && place.lng && 
          !isNaN(place.lat) && !isNaN(place.lng) &&
          place.lat !== 0 && place.lng !== 0
        ));
      } catch (err) {
        console.error('Failed to load places:', err);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [selectedGovernateId]);

  // Initialize map
  useEffect(() => {
    if (!mapboxLoaded || loading || !mapContainer.current) return;

    const mapboxgl = (window as any).mapboxgl;
    const accessToken = 'pk.eyJ1IjoiYWxtbGFoIiwiYSI6ImNtZGo1YXUxMDBoaGQyanF5amUybzNueW4ifQ.URYquetQ0MFz1bPJ_5lLaA';
    
    if (!mapboxgl || !accessToken) {
      console.error('Mapbox initialization failed');
      return;
    }

    // Calculate center
    const center = places.length === 0 
      ? [58.4, 23.6] // Oman center
      : places.length === 1 
        ? [places[0].lng!, places[0].lat!]
        : [
            places.reduce((sum, place) => sum + place.lng!, 0) / places.length,
            places.reduce((sum, place) => sum + place.lat!, 0) / places.length
          ];

    const zoom = places.length === 0 ? 6 : places.length === 1 ? 12 : 8;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: zoom
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add markers
      map.current.on('load', () => {
        places.forEach(place => {
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
            <div style="font-family: system-ui, -apple-system, sans-serif;">
              <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px; color: #1f2937;">
                ${name}
              </h3>
              ${locationText ? `
                <p style="font-size: 14px; margin-bottom: 4px; color: #6b7280;">
                  📍 ${locationText}
                </p>
              ` : ''}
              <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                ${text.coordinates}: ${place.lat!.toFixed(4)}, ${place.lng!.toFixed(4)}
              </p>
            </div>
          `;

          new mapboxgl.Marker({ color: '#3b82f6' })
            .setLngLat([place.lng!, place.lat!])
            .setPopup(new mapboxgl.Popup({
              offset: 25,
              closeButton: true,
              closeOnClick: false
            }).setHTML(popupContent))
            .addTo(map.current);
        });
      });

      map.current.on('error', console.error);

    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, [mapboxLoaded, loading, places, locale, text.coordinates]);

  if (loading || !mapboxLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div>{loading ? text.loading : text.mapboxLoading}</div>
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg">{text.noPlaces}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div
        ref={mapContainer}
        className="w-full h-full rounded-3xl"
        style={{ minHeight: '400px' }}
      />
      
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="text-sm font-medium text-gray-700">{text.mapTitle}</div>
        <div className="text-xs text-gray-500">{text.placesCount(places.length)}</div>
      </div>
    </div>
  );
}