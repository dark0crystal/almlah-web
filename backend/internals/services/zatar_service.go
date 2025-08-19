package services

import (
	"almlah/config"
	"almlah/internals/dto"
	"database/sql"
	"fmt"
	"math/rand"
	"time"

	"gorm.io/gorm"
)

type ZatarService struct {
	db               *gorm.DB
	googleMapsService *GoogleMapsService
}

func NewZatarService(db *gorm.DB) *ZatarService {
	// Get Google Maps API key from config
	cfg, err := config.SetupEnv()
	var googleMapsService *GoogleMapsService
	if err != nil || cfg.GoogleMapsAPIKey == "" {
		fmt.Printf("Warning: Google Maps API key not found, using fallback data\n")
		googleMapsService = nil
	} else {
		googleMapsService, err = NewGoogleMapsService(cfg.GoogleMapsAPIKey)
		if err != nil {
			fmt.Printf("Warning: Failed to initialize Google Maps service: %v\n", err)
			googleMapsService = nil
		}
	}
	
	return &ZatarService{
		db:               db,
		googleMapsService: googleMapsService,
	}
}

func (s *ZatarService) GetRandomRecommendation(req dto.ZatarRecommendationRequest) (*dto.ZatarRecommendationResponse, error) {
	// Try Google Maps first if available
	if s.googleMapsService != nil {
		googleRecommendations, err := s.getGoogleMapsRecommendations(req.PlaceName, req.FoodType)
		if err == nil && len(googleRecommendations) > 0 {
			// Return random Google Maps restaurant
			randomIndex := rand.Intn(len(googleRecommendations))
			return &googleRecommendations[randomIndex], nil
		}
		fmt.Printf("Google Maps search failed or no results: %v\n", err)
	}

	// Fallback to database restaurants
	realRecommendations, err := s.getRealRestaurants(req.PlaceName, req.FoodType)
	if err == nil && len(realRecommendations) > 0 {
		// Return random real restaurant
		randomIndex := rand.Intn(len(realRecommendations))
		return &realRecommendations[randomIndex], nil
	}

	// Final fallback to mock data
	mockRecommendations := s.generateMockRecommendations(req.PlaceName, req.FoodType, req.Locale)
	if len(mockRecommendations) == 0 {
		return nil, fmt.Errorf("no recommendations found for the given criteria")
	}

	randomIndex := rand.Intn(len(mockRecommendations))
	return &mockRecommendations[randomIndex], nil
}

func (s *ZatarService) GetMultipleRecommendations(req dto.ZatarRecommendationRequest, count int) (*dto.ZatarRecommendationsListResponse, error) {
	if count <= 0 {
		count = 3 // default
	}
	if count > 10 {
		count = 10 // limit
	}

	var recommendations []dto.ZatarRecommendationResponse

	// Try Google Maps first if available
	if s.googleMapsService != nil {
		googleRecs, err := s.getGoogleMapsRecommendations(req.PlaceName, req.FoodType)
		if err == nil {
			recommendations = append(recommendations, googleRecs...)
		}
	}

	// If we don't have enough Google Maps results, try database
	if len(recommendations) < count {
		realRecs, err := s.getRealRestaurants(req.PlaceName, req.FoodType)
		if err == nil {
			recommendations = append(recommendations, realRecs...)
		}
	}

	// If we still don't have enough, add mock ones
	if len(recommendations) < count {
		mockRecs := s.generateMockRecommendations(req.PlaceName, req.FoodType, req.Locale)
		needed := count - len(recommendations)
		if needed > len(mockRecs) {
			needed = len(mockRecs)
		}
		
		// Shuffle mock recommendations and take needed amount
		rand.Shuffle(len(mockRecs), func(i, j int) {
			mockRecs[i], mockRecs[j] = mockRecs[j], mockRecs[i]
		})
		
		recommendations = append(recommendations, mockRecs[:needed]...)
	}

	// Shuffle all recommendations for variety
	rand.Shuffle(len(recommendations), func(i, j int) {
		recommendations[i], recommendations[j] = recommendations[j], recommendations[i]
	})

	// Limit to requested count
	if len(recommendations) > count {
		recommendations = recommendations[:count]
	}

	response := &dto.ZatarRecommendationsListResponse{
		Success:        true,
		Message:        "Recommendations generated successfully",
		Recommendations: recommendations,
		Count:          len(recommendations),
		GeneratedAt:    time.Now(),
		SearchCriteria: dto.ZatarSearchCriteria{
			PlaceName: req.PlaceName,
			FoodType:  req.FoodType,
			Locale:    req.Locale,
		},
	}

	return response, nil
}

// getGoogleMapsRecommendations fetches restaurants from Google Maps API using HTTP calls
func (s *ZatarService) getGoogleMapsRecommendations(placeName, foodType string) ([]dto.ZatarRecommendationResponse, error) {
	// Add timeout and retry logic for Google Maps API calls
	maxRetries := 2
	var location *GeocodeResult
	var err error

	// First, geocode the location with retry
	for i := 0; i < maxRetries; i++ {
		location, err = s.googleMapsService.GeocodeLocation(placeName)
		if err == nil {
			break
		}
		if i < maxRetries-1 {
			time.Sleep(time.Duration(i+1) * time.Second) // Progressive backoff
		}
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to geocode location after %d retries: %v", maxRetries, err)
	}

	// Search for restaurants near the location with retry
	radius := 5000 // 5km radius
	var places []PlaceInfo
	
	for i := 0; i < maxRetries; i++ {
		places, err = s.googleMapsService.SearchRestaurants(
			location.Geometry.Location.Lat,
			location.Geometry.Location.Lng,
			foodType,
			radius,
		)
		if err == nil {
			break
		}
		if i < maxRetries-1 {
			time.Sleep(time.Duration(i+1) * time.Second) // Progressive backoff
		}
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to search restaurants after %d retries: %v", maxRetries, err)
	}

	var recommendations []dto.ZatarRecommendationResponse
	for _, place := range places {
		// Calculate distance from the geocoded location
		distance := s.googleMapsService.CalculateDistance(
			location.Geometry.Location.Lat, location.Geometry.Location.Lng,
			place.Lat, place.Lng,
		)

		recommendation := dto.ZatarRecommendationResponse{
			ID:          place.PlaceID,
			Name:        place.Name,
			Type:        s.googleMapsService.GetPlaceType(place.Types),
			Address:     place.Address,
			Rating:      place.Rating,
			Distance:    fmt.Sprintf("%.1f km", distance),
			Cuisine:     s.getFoodTypeName(foodType, "en"),
			PlaceID:     place.PlaceID,
			Phone:       place.Phone,
			Website:     place.Website,
			OpeningTime: place.OpeningTime,
			ClosingTime: place.ClosingTime,
			PriceRange:  s.googleMapsService.FormatPriceLevel(place.PriceLevel),
		}

		// Add photo URLs if available
		if place.PhotoRef != "" {
			recommendation.ImageURL = s.googleMapsService.GetPhotoURL(place.PhotoRef, 400)
		}
		
		// Add multiple photo URLs
		if len(place.PhotoRefs) > 0 {
			var imageURLs []string
			for _, photoRef := range place.PhotoRefs {
				imageURL := s.googleMapsService.GetPhotoURL(photoRef, 400)
				imageURLs = append(imageURLs, imageURL)
			}
			recommendation.ImageURLs = imageURLs
		}

		recommendations = append(recommendations, recommendation)
	}

	return recommendations, nil
}

func (s *ZatarService) getRealRestaurants(placeName, foodType string) ([]dto.ZatarRecommendationResponse, error) {
	// Query real restaurants from the places table
	var places []struct {
		ID          string         `gorm:"column:id"`
		NameAr      string         `gorm:"column:name_ar"`
		NameEn      string         `gorm:"column:name_en"`
		Lat         sql.NullFloat64 `gorm:"column:lat"`
		Lng         sql.NullFloat64 `gorm:"column:lng"`
		Phone       sql.NullString `gorm:"column:phone"`
		Website     sql.NullString `gorm:"column:website"`
		Rating      sql.NullFloat64 `gorm:"column:rating"`
		PrimaryImage sql.NullString `gorm:"column:primary_image"`
		GovernateNameAr string `gorm:"column:governate_name_ar"`
		GovernateNameEn string `gorm:"column:governate_name_en"`
	}

	query := `
		SELECT 
			p.id, p.name_ar, p.name_en, p.lat, p.lng, p.phone, p.website, p.rating, p.primary_image,
			g.name_ar as governate_name_ar, g.name_en as governate_name_en
		FROM places p
		JOIN governates g ON p.governate_id = g.id
		JOIN categories c ON p.category_id = c.id
		WHERE p.is_active = true 
		AND (c.slug = 'restaurants' OR c.slug = 'cafes')
		AND (LOWER(g.name_en) LIKE ? OR LOWER(g.name_ar) LIKE ? OR LOWER(p.name_en) LIKE ? OR LOWER(p.name_ar) LIKE ?)
		ORDER BY RANDOM()
		LIMIT 20
	`

	searchTerm := "%" + placeName + "%"
	err := s.db.Raw(query, searchTerm, searchTerm, searchTerm, searchTerm).Scan(&places).Error
	if err != nil {
		return nil, err
	}

	var recommendations []dto.ZatarRecommendationResponse
	for _, place := range places {
		// Determine restaurant type based on food type preference
		recType := "Restaurant"
		if foodType == "coffee" {
			recType = "Cafe"
		}

		// Calculate distance (mock for now)
		distance := fmt.Sprintf("%.1f km", rand.Float64()*5+0.5)

		// Get appropriate name based on language
		name := place.NameEn
		governateName := place.GovernateNameEn
		if place.NameAr != "" {
			name = place.NameAr
		}
		if place.GovernateNameAr != "" {
			governateName = place.GovernateNameAr
		}

		recommendation := dto.ZatarRecommendationResponse{
			ID:       place.ID,
			Name:     name,
			Type:     recType,
			Address:  governateName,
			Distance: distance,
			Cuisine:  s.getFoodTypeName(foodType, "en"),
			PlaceID:  place.ID,
		}

		if place.Rating.Valid {
			recommendation.Rating = place.Rating.Float64
		}
		if place.Phone.Valid {
			recommendation.Phone = place.Phone.String
		}
		if place.Website.Valid {
			recommendation.Website = place.Website.String
		}
		if place.PrimaryImage.Valid {
			recommendation.ImageURL = place.PrimaryImage.String
		}

		recommendations = append(recommendations, recommendation)
	}

	return recommendations, nil
}

func (s *ZatarService) generateMockRecommendations(placeName, foodType, locale string) []dto.ZatarRecommendationResponse {
	mockData := map[string][]dto.ZatarRecommendationResponse{
		"arabic": {
			{ID: "mock-1", Name: "مطعم الأصالة العربية", Type: "Restaurant", Address: placeName, Rating: 4.5, Distance: "2.3 km", Cuisine: "Arabic", PriceRange: "$$"},
			{ID: "mock-2", Name: "بيت الكبسة", Type: "Restaurant", Address: placeName, Rating: 4.2, Distance: "1.8 km", Cuisine: "Arabic", PriceRange: "$"},
			{ID: "mock-3", Name: "مطعم الشام", Type: "Restaurant", Address: placeName, Rating: 4.7, Distance: "3.1 km", Cuisine: "Levantine", PriceRange: "$$$"},
		},
		"seafood": {
			{ID: "mock-4", Name: "مطعم البحر الأزرق", Type: "Restaurant", Address: placeName, Rating: 4.3, Distance: "2.1 km", Cuisine: "Seafood", PriceRange: "$$$"},
			{ID: "mock-5", Name: "كوخ الصياد", Type: "Restaurant", Address: placeName, Rating: 4.6, Distance: "1.5 km", Cuisine: "Fresh Seafood", PriceRange: "$$"},
			{ID: "mock-6", Name: "مشويات البحر", Type: "Restaurant", Address: placeName, Rating: 4.1, Distance: "2.8 km", Cuisine: "Grilled Seafood", PriceRange: "$$"},
		},
		"grilled": {
			{ID: "mock-7", Name: "مشاوي الخليج", Type: "Grill House", Address: placeName, Rating: 4.4, Distance: "1.9 km", Cuisine: "Grilled", PriceRange: "$$"},
			{ID: "mock-8", Name: "فحم وتنور", Type: "BBQ Restaurant", Address: placeName, Rating: 4.8, Distance: "2.5 km", Cuisine: "Barbecue", PriceRange: "$$$"},
			{ID: "mock-9", Name: "مطعم الفحم", Type: "Grill", Address: placeName, Rating: 4.2, Distance: "1.7 km", Cuisine: "Charcoal Grill", PriceRange: "$$"},
		},
		"desserts": {
			{ID: "mock-10", Name: "حلويات الشرق", Type: "Dessert Shop", Address: placeName, Rating: 4.6, Distance: "1.2 km", Cuisine: "Desserts", PriceRange: "$"},
			{ID: "mock-11", Name: "كنافة ومهلبية", Type: "Sweet Shop", Address: placeName, Rating: 4.3, Distance: "0.8 km", Cuisine: "Traditional Sweets", PriceRange: "$"},
			{ID: "mock-12", Name: "حلويات باريس", Type: "Patisserie", Address: placeName, Rating: 4.7, Distance: "2.2 km", Cuisine: "French Pastry", PriceRange: "$$"},
		},
		"coffee": {
			{ID: "mock-13", Name: "كافيه البحر", Type: "Cafe", Address: placeName, Rating: 4.2, Distance: "1.8 km", Cuisine: "Coffee & Light Meals", PriceRange: "$$"},
			{ID: "mock-14", Name: "قهوة الصباح", Type: "Coffee House", Address: placeName, Rating: 4.5, Distance: "0.9 km", Cuisine: "Specialty Coffee", PriceRange: "$"},
			{ID: "mock-15", Name: "ستarbucks مقلد", Type: "Cafe", Address: placeName, Rating: 4.1, Distance: "1.4 km", Cuisine: "International Coffee", PriceRange: "$$"},
		},
		"fastfood": {
			{ID: "mock-16", Name: "برجر المدينة", Type: "Fast Food", Address: placeName, Rating: 4.0, Distance: "1.1 km", Cuisine: "Burgers", PriceRange: "$"},
			{ID: "mock-17", Name: "فرايد تشكن", Type: "Fast Food", Address: placeName, Rating: 3.8, Distance: "2.0 km", Cuisine: "Fried Chicken", PriceRange: "$"},
			{ID: "mock-18", Name: "بيتزا السرعة", Type: "Fast Food", Address: placeName, Rating: 4.2, Distance: "1.6 km", Cuisine: "Pizza", PriceRange: "$"},
		},
	}

	recommendations, exists := mockData[foodType]
	if !exists {
		// Return a default set if food type not found
		return mockData["arabic"]
	}

	// Add opening/closing times to mock data
	for i := range recommendations {
		recommendations[i].OpeningTime = "10:00 AM"
		recommendations[i].ClosingTime = "11:00 PM"
		
		// Translate names if Arabic locale
		if locale == "ar" && recommendations[i].Name == "" {
			// Names are already in Arabic in mock data
		}
	}

	return recommendations
}

func (s *ZatarService) getFoodTypeName(foodType, locale string) string {
	names := map[string]map[string]string{
		"arabic":   {"en": "Arabic Cuisine", "ar": "المأكولات العربية"},
		"seafood":  {"en": "Seafood", "ar": "المأكولات البحرية"},
		"grilled":  {"en": "Grilled Food", "ar": "المشاوي"},
		"desserts": {"en": "Desserts & Sweets", "ar": "الحلويات"},
		"coffee":   {"en": "Coffee & Beverages", "ar": "القهوة والمشروبات"},
		"fastfood": {"en": "Fast Food", "ar": "الوجبات السريعة"},
	}

	if typeNames, exists := names[foodType]; exists {
		if name, exists := typeNames[locale]; exists {
			return name
		}
	}
	return "Restaurant"
}

func (s *ZatarService) GetGameStats() (*dto.ZatarGameStats, error) {
	// This could be implemented to track actual usage statistics
	return &dto.ZatarGameStats{
		TotalRolls:      rand.Intn(10000) + 1000,
		UniqueUsers:     rand.Intn(1000) + 100,
		PopularFoodType: "arabic",
		PopularLocation: "صلالة",
		LastUpdated:     time.Now(),
	}, nil
}