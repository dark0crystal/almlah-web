// dtos/place_dto.go
package dto

type CreatePlaceRequest struct {
	Name        string   `json:"name" validate:"required"`
	Description string   `json:"description"`
	Address     string   `json:"address" validate:"required"`
	City        string   `json:"city" validate:"required"`
	Country     string   `json:"country" validate:"required"`
	Latitude    float64  `json:"latitude"`
	Longitude   float64  `json:"longitude"`
	Phone       string   `json:"phone"`
	Email       string   `json:"email"`
	Website     string   `json:"website"`
	PriceRange  string   `json:"price_range"`
	CategoryNames []string `json:"category_names"`
	PropertyIDs []uint   `json:"property_ids"`
}

type PlaceResponse struct {
	ID          uint                `json:"id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Address     string              `json:"address"`
	City        string              `json:"city"`
	Country     string              `json:"country"`
	Latitude    float64             `json:"latitude"`
	Longitude   float64             `json:"longitude"`
	Phone       string              `json:"phone"`
	Email       string              `json:"email"`
	Website     string              `json:"website"`
	PriceRange  string              `json:"price_range"`
	Rating      float64             `json:"rating"`
	ReviewCount int                 `json:"review_count"`
	Categories  []CategoryResponse  `json:"categories"`
	Properties  []PropertyResponse  `json:"properties"`
	Images      []ImageResponse     `json:"images"`
}

type CategoryResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Icon string `json:"icon"`
}

type PropertyResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Value string `json:"value,omitempty"`
	Icon  string `json:"icon"`
}

type ImageResponse struct {
	ID          uint   `json:"id"`
	URL         string `json:"url"`
	AltText     string `json:"alt_text"`
	IsPrimary   bool   `json:"is_primary"`
	DisplayOrder int   `json:"display_order"`
}
