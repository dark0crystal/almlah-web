"use client"
import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { DestinationsMapProps, Destination } from './types';

const libraries: ("places" | "geometry")[] = ['places'];

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '400px',
    borderRadius: '24px'
};

// Oman's geographic center and bounds
const OMAN_CENTER = { lat: 23.5859, lng: 58.4059 }; // Muscat coordinates

export default function DestinationsMap({ destinations = [], language = 'ar', onMarkerClick }: DestinationsMapProps) {
    const [, setActiveDestination] = useState<number | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<Destination | null>(null);
    const [markerIcons, setMarkerIcons] = useState<Record<number, string>>({});

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries,
    });

    // Load marker icons when destinations change
    useEffect(() => {
        if (!destinations.length) return;

        const loadIcons = async () => {
            const icons: Record<number, string> = {};
            for (const destination of destinations) {
                try {
                    const icon = await createCustomMarkerIcon(destination);
                    icons[destination.id] = icon;
                } catch (error) {
                    console.error('Failed to create marker icon for', destination.name, error);
                }
            }
            setMarkerIcons(icons);
        };

        loadIcons();
    }, [destinations]);

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

    const onMapLoad = useCallback((map: google.maps.Map) => {
        // Fit map to show all destinations if we have multiple
        if (destinations.length > 1) {
            const validDestinations = destinations.filter(d => 
                d.governorateData?.latitude && d.governorateData?.longitude
            );

            if (validDestinations.length > 1) {
                const bounds = new google.maps.LatLngBounds();
                validDestinations.forEach(destination => {
                    bounds.extend({
                        lat: destination.governorateData.latitude,
                        lng: destination.governorateData.longitude
                    });
                });
                map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
            }
        }
    }, [destinations]);

    const handleMarkerClick = useCallback((destination: Destination) => {
        setActiveDestination(destination.id);
        setSelectedMarker(destination);
        
        // Notify parent component about marker click
        if (onMarkerClick) {
            onMarkerClick(destination.id);
        }
    }, [onMarkerClick]);

    const createCustomMarkerIcon = (destination: Destination): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const size = 40;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                // Fallback if canvas context is not available
                resolve('');
                return;
            }

            if (destination.image) {
                // Load and draw the image
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    // Create circular clipping path
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
                    ctx.clip();
                    
                    // Draw image to fill the circle
                    ctx.drawImage(img, 3, 3, size - 6, size - 6);
                    ctx.restore();
                    
                    // Draw white border
                    ctx.beginPath();
                    ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    
                    resolve(canvas.toDataURL());
                };
                img.onerror = () => {
                    // Fallback to color marker if image fails
                    drawFallbackMarker();
                };
                img.src = destination.image;
            } else {
                drawFallbackMarker();
            }

            function drawFallbackMarker() {
                if (!ctx) {
                    resolve('');
                    return;
                }
                
                // Draw circle background
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2 - 3, 0, 2 * Math.PI);
                ctx.fillStyle = `hsl(${destination.id * 137.5 % 360}, 70%, 50%)`;
                ctx.fill();
                
                // Draw white border
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Add text
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(destination.name.charAt(0), size / 2, size / 2);
                
                resolve(canvas.toDataURL());
            }
        });
    };

    if (loadError) {
        return (
            <div className="w-full h-full min-h-[400px] rounded-3xl bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-sm">
                        {language === 'ar' ? 'خطأ في تحميل الخريطة' : 'Error loading map'}
                    </p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full min-h-[400px] rounded-3xl bg-gray-100 flex items-center justify-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">
                        {language === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}
                    </p>
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
                {destinations.map((destination) => {
                    if (destination.governorateData?.latitude && destination.governorateData?.longitude && markerIcons[destination.id]) {
                        return (
                            <Marker
                                key={destination.id}
                                position={{
                                    lat: destination.governorateData.latitude,
                                    lng: destination.governorateData.longitude
                                }}
                                icon={{
                                    url: markerIcons[destination.id],
                                    scaledSize: new google.maps.Size(40, 40),
                                }}
                                onClick={() => handleMarkerClick(destination)}
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
                    return null;
                })}

                {selectedMarker && selectedMarker.governorateData.latitude && selectedMarker.governorateData.longitude && (
                    <InfoWindow
                        position={{
                            lat: selectedMarker.governorateData.latitude!,
                            lng: selectedMarker.governorateData.longitude!
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div style={{ 
                            textAlign: language === 'ar' ? 'right' : 'left', 
                            direction: language === 'ar' ? 'rtl' : 'ltr',
                            maxWidth: '200px'
                        }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                {selectedMarker.name}
                            </h3>
                            {selectedMarker.category && (
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                                    {selectedMarker.category}
                                </p>
                            )}
                            <div style={{ fontSize: '12px', color: '#888' }}>
                                {selectedMarker.governorateData?.wilayah_count && (
                                    <div>
                                        {language === 'ar' ? 'الولايات' : 'Wilayahs'}: {selectedMarker.governorateData.wilayah_count}
                                    </div>
                                )}
                                {selectedMarker.governorateData?.place_count && (
                                    <div>
                                        {language === 'ar' ? 'الأماكن' : 'Places'}: {selectedMarker.governorateData.place_count}
                                    </div>
                                )}
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Map info overlay */}
            {isLoaded && destinations.length > 0 && (
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