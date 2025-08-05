package dto

import "time"
type CreateReviewRequest struct {
    PlaceID    uint       `json:"place_id" validate:"required"`
    Rating     int        `json:"rating" validate:"required,min=1,max=5"`
    Title      string     `json:"title"`
    ReviewText string     `json:"review_text"`
    VisitDate  *time.Time `json:"visit_date"`
}

type ReviewResponse struct {
    ID           uint            `json:"id"`
    PlaceID      uint            `json:"place_id"`
    Rating       int             `json:"rating"`
    Title        string          `json:"title"`
    ReviewText   string          `json:"review_text"`
    VisitDate    *time.Time      `json:"visit_date"`
    IsVerified   bool            `json:"is_verified"`
    HelpfulCount int             `json:"helpful_count"`
    CreatedAt    time.Time       `json:"created_at"`
    Author       UserInfo        `json:"author"`
    Images       []ImageResponse `json:"images"`
}