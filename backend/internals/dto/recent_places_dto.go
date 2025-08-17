// dto/recent_places_dto.go
package dto


// PlaceWithNewStatusResponse extends PlaceListResponse with new status
type PlaceWithNewStatusResponse struct {
	PlaceListResponse
	IsNew bool `json:"is_new"`
}

// RecentPlacesRequest represents query parameters for recent places
type RecentPlacesRequest struct {
	Limit    int  `query:"limit" validate:"omitempty,min=1,max=50"`
	MinCount int  `query:"min_count" validate:"omitempty,min=1,max=20"`
	Fallback bool `query:"fallback" validate:"omitempty"`
}

// PlacesStatsResponse provides statistics about places
type PlacesStatsResponse struct {
	TotalPlaces   int    `json:"total_places"`
	NewThisWeek   int    `json:"new_this_week"`
	NewThisMonth  int    `json:"new_this_month"`
	LastUpdated   string `json:"last_updated"`
}

// RecentPlacesResponse wraps the recent places with metadata
type RecentPlacesResponse struct {
	Places      []PlaceWithNewStatusResponse `json:"places"`
	TotalCount  int                          `json:"total_count"`
	NewCount    int                          `json:"new_count"`
	HasFallback bool                         `json:"has_fallback"` // Indicates if older places were included
	Stats       *PlacesStatsResponse         `json:"stats,omitempty"`
}