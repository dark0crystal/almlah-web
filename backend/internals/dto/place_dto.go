// dtos/place_dto.go
package dto

type CreatePlaceRequest struct {
    Name         string   `json:"name" validate:"required"`
    Description  string   `json:"description"`
    Address      string   `json:"address" validate:"required"`
    City         string   `json:"city" validate:"required"`
    Country      string   `json:"country" validate:"required"`
    Latitude     float64  `json:"latitude"`
    Longitude    float64  `json:"longitude"`
    Phone        string   `json:"phone"`
    Email        string   `json:"email"`
    Website      string   `json:"website"`
    PriceRange   string   `json:"price_range"`
    CategoryIDs  []uint   `json:"category_ids"`  // Changed from CategoryNames to IDs
    PropertyIDs  []uint   `json:"property_ids"`
}

type UpdatePlaceRequest struct {
    Name        string   `json:"name" validate:"omitempty"`
    Description string   `json:"description"`
    Address     string   `json:"address" validate:"omitempty"`
    City        string   `json:"city" validate:"omitempty"`
    Country     string   `json:"country" validate:"omitempty"`
    Latitude    float64  `json:"latitude"`
    Longitude   float64  `json:"longitude"`
    Phone       string   `json:"phone"`
    Email       string   `json:"email"`
    Website     string   `json:"website"`
    PriceRange  string   `json:"price_range"`
    CategoryIDs []uint   `json:"category_ids"`
    PropertyIDs []uint   `json:"property_ids"`
    IsActive    *bool    `json:"is_active"`
}

type PlaceResponse struct {
    ID          uint                      `json:"id"`
    Name        string                    `json:"name"`
    Description string                    `json:"description"`
    Address     string                    `json:"address"`
    City        string                    `json:"city"`
    Country     string                    `json:"country"`
    Latitude    float64                   `json:"latitude"`
    Longitude   float64                   `json:"longitude"`
    Phone       string                    `json:"phone"`
    Email       string                    `json:"email"`
    Website     string                    `json:"website"`
    PriceRange  string                    `json:"price_range"`
    Rating      float64                   `json:"rating"`
    ReviewCount int                       `json:"review_count"`
    IsActive    bool                      `json:"is_active"`
    Categories  []SimpleCategoryResponse  `json:"categories"`  // Use SimpleCategoryResponse
    Properties  []PropertyResponse        `json:"properties"`
    Images      []ImageResponse           `json:"images"`
    CreatedAt   string                    `json:"created_at"`
    UpdatedAt   string                    `json:"updated_at"`
}

type PropertyResponse struct {
    ID    uint   `json:"id"`
    Name  string `json:"name"`
    Value string `json:"value,omitempty"`
    Icon  string `json:"icon"`
    Type  string `json:"property_type"`
}

type ImageResponse struct {
    ID           uint   `json:"id"`
    URL          string `json:"url"`
    AltText      string `json:"alt_text"`
    IsPrimary    bool   `json:"is_primary"`
    DisplayOrder int    `json:"display_order"`
}

// Place listing response (simplified)
type PlaceListResponse struct {
    ID          uint                     `json:"id"`
    Name        string                   `json:"name"`
    Description string                   `json:"description"`
    City        string                   `json:"city"`
    Country     string                   `json:"country"`
    PriceRange  string                   `json:"price_range"`
    Rating      float64                  `json:"rating"`
    ReviewCount int                      `json:"review_count"`
    Categories  []SimpleCategoryResponse `json:"categories"`
    PrimaryImage *ImageResponse          `json:"primary_image"`
}