package dto

import (
	"time"
	"github.com/google/uuid"
)

type AddFavoriteRequest struct {
	PlaceID uuid.UUID `json:"place_id" validate:"required"`
}

type FavoriteResponse struct {
	ID      uuid.UUID `json:"id"`
	UserID  uuid.UUID `json:"user_id"`
	PlaceID uuid.UUID `json:"place_id"`
	AddedAt time.Time `json:"added_at"`
	Place   PlaceListResponse `json:"place"`
}