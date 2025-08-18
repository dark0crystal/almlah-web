"use client"
import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function DestinationsMap({ destinations = [], language = 'ar', onMarkerClick }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markers = useRef([]);
    const [activeDestination, setActiveDestination] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    // Oman's geographic bounds for better map centering
    const OMAN_BOUNDS = {
        center: [58.4059, 23.5859], // Muscat coordinates as center
        bounds: [
            [51.9999, 16.6333], // Southwest coordinates
            [60.0000, 26.3959]  // Northeast coordinates
        ]
    };

    // Your Mapbox access token (hardcoded as in original)
    const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYWxtbGFoIiwiYSI6ImNtZGo1YXUxMDBoaGQyanF5amUybzNueW4ifQ.URYquetQ0MFz1bPJ_5lLaA';

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

    // Add markers when destinations change
    useEffect(() => {
        if (!map.current || !mapLoaded || !destinations.length) return;

        // Clear existing markers
        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        // Add new markers for each destination
        destinations.forEach(destination => {
            if (destination.governorateData?.latitude && destination.governorateData?.longitude) {
                // Create marker element
                const markerElement = document.createElement('div');
                markerElement.className = 'custom-marker';
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
                    background-color: #3B82F6;
                `;

                // Set background image if available
                if (destination.image) {
                    markerElement.style.backgroundImage = `url(${destination.image})`;
                } else {
                    // Create a colored marker with initials
                    markerElement.style.backgroundColor = `hsl(${destination.id * 137.5 % 360}, 70%, 50%)`;
                    markerElement.innerHTML = `
                        <div style="
                            width: 100%;
                            height: 100%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            font-size: 12px;
                        ">
                            ${destination.name.charAt(0)}
                        </div>
                    `;
                }

                // Add hover effect
                markerElement.addEventListener('mouseenter', () => {
                    markerElement.style.transform = 'scale(1.1)';
                });

                markerElement.addEventListener('mouseleave', () => {
                    markerElement.style.transform = 'scale(1)';
                });

                // Create popup content
                const popupContent = `
                    <div style="text-align: ${language === 'ar' ? 'right' : 'left'}; direction: ${language === 'ar' ? 'rtl' : 'ltr'};">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
                            ${destination.name}
                        </h3>
                        ${destination.category ? `
                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                                ${destination.category}
                            </p>
                        ` : ''}
                        <div style="font-size: 12px; color: #888;">
                            ${destination.governorateData.wilayah_count ? `
                                <div>${language === 'ar' ? 'الولايات' : 'Wilayahs'}: ${destination.governorateData.wilayah_count}</div>
                            ` : ''}
                            ${destination.governorateData.place_count ? `
                                <div>${language === 'ar' ? 'الأماكن' : 'Places'}: ${destination.governorateData.place_count}</div>
                            ` : ''}
                        </div>
                    </div>
                `;

                // Create popup
                const popup = new window.mapboxgl.Popup({
                    offset: 25,
                    closeOnClick: true
                }).setHTML(popupContent);

                // Create marker
                const marker = new window.mapboxgl.Marker(markerElement)
                    .setLngLat([destination.governorateData.longitude, destination.governorateData.latitude])
                    .setPopup(popup)
                    .addTo(map.current);

                // Add click handler
                markerElement.addEventListener('click', () => {
                    setActiveDestination(destination.id);
                    
                    // Center map on clicked marker
                    map.current.flyTo({
                        center: [destination.governorateData.longitude, destination.governorateData.latitude],
                        zoom: 8,
                        duration: 1000
                    });

                    // Notify parent component about marker click
                    if (onMarkerClick) {
                        onMarkerClick(destination.id);
                    }
                });

                markers.current.push(marker);
            }
        });

        // Fit map to show all markers if we have multiple destinations
        if (destinations.length > 1) {
            const validDestinations = destinations.filter(d => 
                d.governorateData?.latitude && d.governorateData?.longitude
            );

            if (validDestinations.length > 1) {
                const coordinates = validDestinations.map(d => [
                    d.governorateData.longitude,
                    d.governorateData.latitude
                ]);

                const bounds = new window.mapboxgl.LngLatBounds();
                coordinates.forEach(coord => bounds.extend(coord));

                map.current.fitBounds(bounds, {
                    padding: 50,
                    duration: 1000
                });
            }
        }
    }, [destinations, mapLoaded, language, onMarkerClick]);

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
                className="w-full h-full min-h-[400px] rounded-3xl"
                style={{ minHeight: '400px' }}
            />

            {/* Loading overlay */}
            {(!scriptsLoaded || !mapLoaded) && (
                <div className="absolute inset-0 bg-gray-100 rounded-3xl flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">
                            {!scriptsLoaded 
                                ? (language === 'ar' ? 'جاري تحميل المكتبات...' : 'Loading libraries...') 
                                : (language === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...')
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Map info overlay */}
            {mapLoaded && destinations.length > 0 && (
                <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <div className={`text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <p className="font-semibold text-gray-800">
                            {language === 'ar' ? 'محافظات عمان' : 'Oman Governorates'}
                        </p>
                        <p className="text-gray-600">
                            {language === 'ar' 
                                ? `${destinations.length} محافظة` 
                                : `${destinations.length} governorates`
                            }
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}