"use client"
import React, { useEffect, useRef } from 'react'

export default function RestaurantsMap() {
    const mapContainer = useRef(null)
    const map = useRef(null)

    useEffect(() => {
        // Only initialize map once
        if (map.current) return

        // Initialize Mapbox map
        const mapboxgl = window.mapboxgl
        
        if (!mapboxgl) {
            console.error('Mapbox GL JS not loaded')
            return
        }

        // Set your Mapbox access token here
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOCKEN

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12', // Map style
            center: [-74.5, 40], // Starting position [lng, lat]
            zoom: 9 // Starting zoom level
        })

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

        // Add a marker example
        new mapboxgl.Marker()
            .setLngLat([-74.5, 40])
            .setPopup(new mapboxgl.Popup().setHTML('<h3>Welcome!</h3><p>This is your map marker.</p>'))
            .addTo(map.current)

        // Cleanup function
        return () => {
            if (map.current) {
                map.current.remove()
            }
        }
    }, [])

    return (
        <div className="w-full h-full relative p-8 flex justify-center items-center">
            {/* Load Mapbox GL JS and CSS */}
            <link
                href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
                rel="stylesheet"
            />
            <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
            
            {/* Map container */}
            <div
                ref={mapContainer}
                className="w-full h-full min-h-[400px] rounded-3xl absolute"
                style={{ minHeight: '400px' }}
            />
        </div>
    )
}