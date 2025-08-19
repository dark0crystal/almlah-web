package main

import (
	"fmt"
	"log"
	"os"

	"almlah/internals/services"
)

func main() {
	// Get API key from environment
	apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
	if apiKey == "" {
		log.Fatal("GOOGLE_MAPS_API_KEY environment variable is required")
	}

	// Create Google Maps service
	gmService, err := services.NewGoogleMapsService(apiKey)
	if err != nil {
		log.Fatalf("Failed to create Google Maps service: %v", err)
	}

	// Test geocoding
	fmt.Println("🌍 Testing Geocoding...")
	location, err := gmService.GeocodeLocation("Salalah, Oman")
	if err != nil {
		log.Printf("❌ Geocoding failed: %v", err)
	} else {
		fmt.Printf("✅ Geocoded 'Salalah, Oman' to: %f, %f\n", 
			location.Geometry.Location.Lat, location.Geometry.Location.Lng)
	}

	// Test restaurant search
	fmt.Println("\n🍽️ Testing Restaurant Search...")
	if location != nil {
		places, err := gmService.SearchRestaurants(
			location.Geometry.Location.Lat,
			location.Geometry.Location.Lng,
			"arabic",
			5000, // 5km radius
		)
		if err != nil {
			log.Printf("❌ Restaurant search failed: %v", err)
		} else {
			fmt.Printf("✅ Found %d restaurants\n", len(places))
			
			// Show first few results
			for i, place := range places {
				if i >= 3 { // Show only first 3
					break
				}
				
				distance := gmService.CalculateDistance(
					location.Geometry.Location.Lat, location.Geometry.Location.Lng,
					place.Lat, place.Lng,
				)
				
				fmt.Printf("  🏪 %s\n", place.Name)
				fmt.Printf("     📍 %s\n", place.Address)
				fmt.Printf("     ⭐ %.1f rating\n", place.Rating)
				fmt.Printf("     📏 %.1f km away\n", distance)
				fmt.Printf("     💰 %s\n", gmService.FormatPriceLevel(place.PriceLevel))
				
				if place.PhotoRef != "" {
					photoURL := gmService.GetPhotoURL(place.PhotoRef, 400)
					fmt.Printf("     📸 Photo: %s\n", photoURL)
				}
				
				fmt.Println()
			}
		}
	}

	fmt.Println("✅ Google Maps API integration test completed!")
}