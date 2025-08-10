"use client"
import React, { useEffect, useRef, useState } from 'react'
import { fetchPlaces } from '@/services/placesApi'

// Add this type definition if you don't have it in your types file
interface Place {
  id: string
  name: string
  lat: number
  lng: number
  wilayah?: string
  rating?: number
}

export default function PlacesMap() {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<any>(null)
    const [places, setPlaces] = useState<Place[]>([])
    const [loading, setLoading] = useState(true)
    const [mapboxLoaded, setMapboxLoaded] = useState(false)

    // Load Mapbox script
    useEffect(() => {
        const checkMapbox = () => {
            if (window.mapboxgl) {
                setMapboxLoaded(true)
                return
            }
            
            // Check if script is already in the head
            const existingScript = document.querySelector('script[src*="mapbox-gl.js"]')
            if (existingScript) {
                existingScript.addEventListener('load', () => setMapboxLoaded(true))
                return
            }

            // Load CSS
            const link = document.createElement('link')
            link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
            link.rel = 'stylesheet'
            document.head.appendChild(link)

            // Load JavaScript
            const script = document.createElement('script')
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
            script.onload = () => setMapboxLoaded(true)
            script.onerror = () => console.error('Failed to load Mapbox GL JS')
            document.head.appendChild(script)
        }

        checkMapbox()
    }, [])

    // Load places data
    useEffect(() => {
        const loadPlaces = async () => {
            try {
                const data = await fetchPlaces()
                console.log('Raw places data:', data)
                
                // Since your API doesn't include lat/lng coordinates,
                // we'll need to add default coordinates or skip map functionality
                const transformedPlaces = data.map((place: any) => ({
                    ...place,
                    // Create a unified name from the API structure
                    name: {
                        id: place.id,
                        name_ar: place.name_ar || '',
                        name_en: place.name_en || '',
                        slug: place.slug || ''
                    },
                    // Add default coordinates (you'll need to update these with real coordinates)
                    lat: 0, // Default - replace with actual coordinates from your data
                    lng: 0, // Default - replace with actual coordinates from your data
                    // Map other fields
                    wilayah: place.wilayah?.name_en || place.wilayah?.name_ar || '',
                    image: place.primary_image || '/images/default-place.jpg',
                    rating: place.rating || 0
                }))
                
                console.log('Transformed places:', transformedPlaces)
                setPlaces(transformedPlaces)
            } catch (err) {
                console.error('Failed to load places for map:', err)
            } finally {
                setLoading(false)
            }
        }
        loadPlaces()
    }, [])

    // Initialize map when both Mapbox is loaded and places are available
    useEffect(() => {
        if (!mapboxLoaded || !places.length || loading || map.current) return

        const mapboxgl = (window as any).mapboxgl
        if (!mapboxgl) {
            console.error('Mapbox GL JS not available')
            return
        }

        // Check if access token is available
        const accessToken = 'pk.eyJ1IjoiYWxtbGFoIiwiYSI6ImNtZGo1YXUxMDBoaGQyanF5amUybzNueW4ifQ.URYquetQ0MFz1bPJ_5lLaA'
        if (!accessToken) {
            console.error('Mapbox access token is not set')
            return
        }

        mapboxgl.accessToken = accessToken

        // Create map centered on first place or default location
        const firstPlace = places[0]
        let center: [number, number] = [-74.5, 40] // Default to New York
        
        if (firstPlace && !isNaN(firstPlace.lat) && !isNaN(firstPlace.lng)) {
            center = [firstPlace.lng, firstPlace.lat]
        }
        
        console.log('Map center:', center, 'from place:', firstPlace)

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: center,
                zoom: 9
            })

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

            // Wait for map to load before adding markers
            map.current.on('load', () => {
                // Add markers for all places
                places.forEach((place, index) => {
                    const lat = parseFloat(place.lat as any)
                    const lng = parseFloat(place.lng as any)
                    
                    if (!isNaN(lat) && !isNaN(lng)) {
                        console.log(`Adding marker ${index + 1}:`, place.name, { lat, lng })
                        new mapboxgl.Marker()
                            .setLngLat([lng, lat])
                            .setPopup(new mapboxgl.Popup().setHTML(`
                                <div>
                                    <h3 style="font-weight: bold; margin-bottom: 4px;">${place.name}</h3>
                                    ${place.wilayah ? `<p style="font-size: 0.875rem; margin-bottom: 2px;">${place.wilayah}</p>` : ''}
                                    ${place.rating ? `<p style="font-size: 0.875rem;">Rating: ${place.rating}</p>` : ''}
                                    <p style="font-size: 0.75rem; color: #666;">Lat: ${lat}, Lng: ${lng}</p>
                                </div>
                            `))
                            .addTo(map.current)
                    } else {
                        console.error(`Invalid coordinates for place ${place.name}:`, { lat: place.lat, lng: place.lng })
                    }
                })
            })

            map.current.on('error', (e: any) => {
                console.error('Mapbox error:', e)
            })

        } catch (error) {
            console.error('Failed to initialize map:', error)
        }

        return () => {
            if (map.current) {
                map.current.remove()
                map.current = null
            }
        }
    }, [places, loading, mapboxLoaded])

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div>Loading map...</div>
            </div>
        )
    }

    if (!mapboxLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div>Loading Mapbox...</div>
            </div>
        )
    }

    if (!places.length) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div>No places found</div>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative">
            <div
                ref={mapContainer}
                className="w-full h-full rounded-3xl"
                style={{ minHeight: '400px' }}
            />
        </div>
    )
}