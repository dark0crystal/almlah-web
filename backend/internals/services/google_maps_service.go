package services

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"time"
)

type GoogleMapsService struct {
	apiKey string
	client *http.Client
}

// GoogleMaps API Response structures
type GeocodeResponse struct {
	Results []GeocodeResult `json:"results"`
	Status  string          `json:"status"`
}

type GeocodeResult struct {
	Geometry struct {
		Location struct {
			Lat float64 `json:"lat"`
			Lng float64 `json:"lng"`
		} `json:"location"`
	} `json:"geometry"`
	FormattedAddress string `json:"formatted_address"`
}

type PlacesResponse struct {
	Results []PlaceResult `json:"results"`
	Status  string        `json:"status"`
	NextPageToken string  `json:"next_page_token,omitempty"`
}

type PlaceResult struct {
	PlaceID          string   `json:"place_id"`
	Name             string   `json:"name"`
	Vicinity         string   `json:"vicinity"`
	Rating           float64  `json:"rating"`
	PriceLevel       int      `json:"price_level"`
	Types            []string `json:"types"`
	Geometry         struct {
		Location struct {
			Lat float64 `json:"lat"`
			Lng float64 `json:"lng"`
		} `json:"location"`
	} `json:"geometry"`
	Photos []struct {
		PhotoReference string `json:"photo_reference"`
		Width          int    `json:"width"`
		Height         int    `json:"height"`
	} `json:"photos"`
	OpeningHours *struct {
		OpenNow bool `json:"open_now"`
	} `json:"opening_hours"`
}

type PlaceDetailsResponse struct {
	Result PlaceDetailsResult `json:"result"`
	Status string             `json:"status"`
}

type PlaceDetailsResult struct {
	PlaceID               string   `json:"place_id"`
	Name                  string   `json:"name"`
	FormattedAddress      string   `json:"formatted_address"`
	Rating                float64  `json:"rating"`
	PriceLevel            int      `json:"price_level"`
	Types                 []string `json:"types"`
	FormattedPhoneNumber  string   `json:"formatted_phone_number"`
	Website               string   `json:"website"`
	Photos []struct {
		PhotoReference string `json:"photo_reference"`
		Width          int    `json:"width"`
		Height         int    `json:"height"`
	} `json:"photos"`
	OpeningHours *struct {
		OpenNow bool     `json:"open_now"`
		Periods []struct {
			Open struct {
				Day  int    `json:"day"`
				Time string `json:"time"`
			} `json:"open"`
			Close struct {
				Day  int    `json:"day"`
				Time string `json:"time"`
			} `json:"close"`
		} `json:"periods"`
	} `json:"opening_hours"`
}

type PlaceInfo struct {
	PlaceID     string
	Name        string
	Address     string
	Rating      float64
	PriceLevel  int
	Types       []string
	Lat         float64
	Lng         float64
	Phone       string
	Website     string
	PhotoRef    string
	PhotoRefs   []string  // Multiple photo references
	OpeningTime string
	ClosingTime string
	IsOpenNow   bool
}

func NewGoogleMapsService(apiKey string) (*GoogleMapsService, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("Google Maps API key is required")
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	return &GoogleMapsService{
		apiKey: apiKey,
		client: client,
	}, nil
}

// GeocodeLocation converts a location name to coordinates using HTTP API
func (s *GoogleMapsService) GeocodeLocation(locationName string) (*GeocodeResult, error) {
	encodedLocation := url.QueryEscape(locationName)
	apiURL := fmt.Sprintf("https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s", 
		encodedLocation, s.apiKey)

	resp, err := s.client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("geocoding request failed: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read geocoding response: %v", err)
	}

	var geocodeResp GeocodeResponse
	if err := json.Unmarshal(body, &geocodeResp); err != nil {
		return nil, fmt.Errorf("failed to parse geocoding response: %v", err)
	}

	if geocodeResp.Status != "OK" {
		return nil, fmt.Errorf("geocoding failed with status: %s", geocodeResp.Status)
	}

	if len(geocodeResp.Results) == 0 {
		return nil, fmt.Errorf("no geocoding results found for: %s", locationName)
	}

	return &geocodeResp.Results[0], nil
}

// SearchRestaurants finds restaurants near a location using HTTP API
func (s *GoogleMapsService) SearchRestaurants(lat, lng float64, foodType string, radius int) ([]PlaceInfo, error) {
	keyword := s.getFoodTypeKeyword(foodType)
	encodedKeyword := url.QueryEscape(keyword)
	
	apiURL := fmt.Sprintf("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=%f,%f&radius=%d&type=restaurant&keyword=%s&key=%s",
		lat, lng, radius, encodedKeyword, s.apiKey)

	resp, err := s.client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("nearby search request failed: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read nearby search response: %v", err)
	}

	var placesResp PlacesResponse
	if err := json.Unmarshal(body, &placesResp); err != nil {
		return nil, fmt.Errorf("failed to parse nearby search response: %v", err)
	}

	if placesResp.Status != "OK" && placesResp.Status != "ZERO_RESULTS" {
		return nil, fmt.Errorf("nearby search failed with status: %s", placesResp.Status)
	}

	var places []PlaceInfo
	for _, result := range placesResp.Results {
		place := s.convertToPlaceInfo(result)
		places = append(places, place)
	}

	return places, nil
}

// GetPlaceDetails retrieves detailed information about a specific place
func (s *GoogleMapsService) GetPlaceDetails(placeID string) (*PlaceInfo, error) {
	fields := "place_id,name,formatted_address,rating,price_level,types,formatted_phone_number,website,photos,opening_hours"
	apiURL := fmt.Sprintf("https://maps.googleapis.com/maps/api/place/details/json?place_id=%s&fields=%s&key=%s",
		placeID, fields, s.apiKey)

	resp, err := s.client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("place details request failed: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read place details response: %v", err)
	}

	var detailsResp PlaceDetailsResponse
	if err := json.Unmarshal(body, &detailsResp); err != nil {
		return nil, fmt.Errorf("failed to parse place details response: %v", err)
	}

	if detailsResp.Status != "OK" {
		return nil, fmt.Errorf("place details failed with status: %s", detailsResp.Status)
	}

	place := s.convertDetailsToPlaceInfo(detailsResp.Result)
	return &place, nil
}

// Helper functions

func (s *GoogleMapsService) getFoodTypeKeyword(foodType string) string {
	keywords := map[string]string{
		"arabic":   "arabic middle eastern",
		"seafood":  "seafood fish",
		"grilled":  "grill barbecue bbq",
		"desserts": "dessert bakery sweets",
		"coffee":   "cafe coffee",
		"fastfood": "fast food burger",
	}
	
	if keyword, exists := keywords[foodType]; exists {
		return keyword
	}
	return "restaurant"
}

func (s *GoogleMapsService) convertToPlaceInfo(result PlaceResult) PlaceInfo {
	place := PlaceInfo{
		PlaceID:    result.PlaceID,
		Name:       result.Name,
		Address:    result.Vicinity,
		Rating:     result.Rating,
		PriceLevel: result.PriceLevel,
		Types:      result.Types,
		Lat:        result.Geometry.Location.Lat,
		Lng:        result.Geometry.Location.Lng,
	}

	// Handle multiple photos
	if len(result.Photos) > 0 {
		place.PhotoRef = result.Photos[0].PhotoReference
		
		// Get up to 5 photos
		maxPhotos := len(result.Photos)
		if maxPhotos > 5 {
			maxPhotos = 5
		}
		
		for i := 0; i < maxPhotos; i++ {
			place.PhotoRefs = append(place.PhotoRefs, result.Photos[i].PhotoReference)
		}
	}

	if result.OpeningHours != nil {
		place.IsOpenNow = result.OpeningHours.OpenNow
	}

	return place
}

func (s *GoogleMapsService) convertDetailsToPlaceInfo(result PlaceDetailsResult) PlaceInfo {
	place := PlaceInfo{
		PlaceID:    result.PlaceID,
		Name:       result.Name,
		Address:    result.FormattedAddress,
		Rating:     result.Rating,
		PriceLevel: result.PriceLevel,
		Types:      result.Types,
		Phone:      result.FormattedPhoneNumber,
		Website:    result.Website,
	}

	// Handle multiple photos
	if len(result.Photos) > 0 {
		place.PhotoRef = result.Photos[0].PhotoReference
		
		// Get up to 5 photos
		maxPhotos := len(result.Photos)
		if maxPhotos > 5 {
			maxPhotos = 5
		}
		
		for i := 0; i < maxPhotos; i++ {
			place.PhotoRefs = append(place.PhotoRefs, result.Photos[i].PhotoReference)
		}
	}

	// Extract opening hours
	if result.OpeningHours != nil {
		place.IsOpenNow = result.OpeningHours.OpenNow
		if len(result.OpeningHours.Periods) > 0 {
			// Get today's hours (simplified - using first period)
			period := result.OpeningHours.Periods[0]
			place.OpeningTime = period.Open.Time
			place.ClosingTime = period.Close.Time
		}
	}

	return place
}

// CalculateDistance calculates distance between two points in kilometers
func (s *GoogleMapsService) CalculateDistance(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadius = 6371 // Earth radius in kilometers

	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	distance := earthRadius * c

	return distance
}

// FormatPriceLevel converts Google's price level to readable format
func (s *GoogleMapsService) FormatPriceLevel(level int) string {
	switch level {
	case 0:
		return "$"
	case 1:
		return "$"
	case 2:
		return "$$"
	case 3:
		return "$$$"
	case 4:
		return "$$$$"
	default:
		return "$$"
	}
}

// GetPhotoURL generates a photo URL from photo reference
func (s *GoogleMapsService) GetPhotoURL(photoRef string, maxWidth int) string {
	if photoRef == "" {
		return ""
	}
	return fmt.Sprintf("https://maps.googleapis.com/maps/api/place/photo?maxwidth=%d&photo_reference=%s&key=%s",
		maxWidth, photoRef, s.apiKey)
}

// GetPlaceType determines the place type from Google's types array
func (s *GoogleMapsService) GetPlaceType(types []string) string {
	for _, placeType := range types {
		switch placeType {
		case "restaurant":
			return "Restaurant"
		case "cafe":
			return "Cafe"
		case "bar":
			return "Bar"
		case "bakery":
			return "Bakery"
		case "meal_takeaway":
			return "Takeaway"
		case "food":
			return "Food Place"
		}
	}
	return "Restaurant" // Default
}