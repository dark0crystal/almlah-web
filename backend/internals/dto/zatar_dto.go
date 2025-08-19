package dto

import "time"

type ZatarRecommendationRequest struct {
	PlaceName string `json:"place_name" binding:"required" validate:"min=2,max=100"`
	FoodType  string `json:"food_type" binding:"required" validate:"oneof=arabic seafood grilled desserts coffee fastfood"`
	Locale    string `json:"locale" binding:"required" validate:"oneof=en ar"`
}

type ZatarRecommendationResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Address     string  `json:"address"`
	Rating      float64 `json:"rating,omitempty"`
	Distance    string  `json:"distance,omitempty"`
	Cuisine     string  `json:"cuisine"`
	PlaceID     string  `json:"place_id,omitempty"`
	Phone       string  `json:"phone,omitempty"`
	Website     string  `json:"website,omitempty"`
	OpeningTime string  `json:"opening_time,omitempty"`
	ClosingTime string  `json:"closing_time,omitempty"`
	PriceRange  string  `json:"price_range,omitempty"`
	ImageURL    string    `json:"image_url,omitempty"`
	ImageURLs   []string  `json:"image_urls,omitempty"`
}

type ZatarRecommendationsListResponse struct {
	Success        bool                          `json:"success"`
	Message        string                        `json:"message"`
	Recommendations []ZatarRecommendationResponse `json:"recommendations"`
	Count          int                           `json:"count"`
	GeneratedAt    time.Time                     `json:"generated_at"`
	SearchCriteria ZatarSearchCriteria           `json:"search_criteria"`
}

type ZatarSearchCriteria struct {
	PlaceName string `json:"place_name"`
	FoodType  string `json:"food_type"`
	Locale    string `json:"locale"`
}

type ZatarErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Message string `json:"message"`
}

type ZatarGameStats struct {
	TotalRolls      int       `json:"total_rolls"`
	UniqueUsers     int       `json:"unique_users"`
	PopularFoodType string    `json:"popular_food_type"`
	PopularLocation string    `json:"popular_location"`
	LastUpdated     time.Time `json:"last_updated"`
}