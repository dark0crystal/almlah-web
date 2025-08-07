package dto

import (
	"time"
	"github.com/google/uuid"
)

type CreateAdviceRequest struct {
	Title              string `json:"title" validate:"required"`
	Content            string `json:"content" validate:"required"`
	AdviceType         string `json:"advice_type"`
	DestinationCity    string `json:"destination_city"`
	DestinationCountry string `json:"destination_country"`
}

type UpdateAdviceRequest struct {
	Title              string `json:"title"`
	Content            string `json:"content"`
	AdviceType         string `json:"advice_type"`
	DestinationCity    string `json:"destination_city"`
	DestinationCountry string `json:"destination_country"`
	IsFeatured         *bool  `json:"is_featured"`
	IsPublished        *bool  `json:"is_published"`
}

type AdviceResponse struct {
	ID                 uuid.UUID `json:"id"`
	Title              string    `json:"title"`
	Content            string    `json:"content"`
	AdviceType         string    `json:"advice_type"`
	DestinationCity    string    `json:"destination_city"`
	DestinationCountry string    `json:"destination_country"`
	IsFeatured         bool      `json:"is_featured"`
	ViewCount          int       `json:"view_count"`
	IsPublished        bool      `json:"is_published"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
	Creator            UserInfo  `json:"creator"`
}