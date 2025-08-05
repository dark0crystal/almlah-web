package services

import (
	"almlah/config"
	"almlah/internals/dto"
	"almlah/internals/domain"
)

func CreateReview(req dto.CreateReviewRequest, userID uint) (*dto.ReviewResponse, error) {
	review := domain.Review{
		PlaceID:      req.PlaceID,
		UserID:       userID,
		Rating:       req.Rating,
		Title:        req.Title,
		ReviewText:   req.ReviewText,
		IsVerified:   false,
		HelpfulCount: 0,
	}

	if err := config.DB.Create(&review).Error; err != nil {
		return nil, err
	}

	return GetReviewByID(review.ID)
}

func GetReviewsByPlaceID(placeID uint) ([]dto.ReviewResponse, error) {
	var reviews []domain.Review

	if err := config.DB.Where("place_id = ?", placeID).Preload("User").Preload("Images").Find(&reviews).Error; err != nil {
		return nil, err
	}

	var response []dto.ReviewResponse
	for _, review := range reviews {
		response = append(response, mapReviewToResponse(review))
	}

	return response, nil
}

func GetReviewByID(id uint) (*dto.ReviewResponse, error) {
	var review domain.Review

	if err := config.DB.Preload("User").Preload("Images").First(&review, id).Error; err != nil {
		return nil, err
	}

	response := mapReviewToResponse(review)
	return &response, nil
}

func mapReviewToResponse(review domain.Review) dto.ReviewResponse {
	var images []dto.ImageResponse
	for _, img := range review.Images {
		images = append(images, dto.ImageResponse{
			ID:  img.ID,
			URL: img.ImageURL,
		})
	}

	return dto.ReviewResponse{
		ID:           review.ID,
		PlaceID:      review.PlaceID,
		Rating:       review.Rating,
		Title:        review.Title,
		ReviewText:   review.ReviewText,
		VisitDate:    review.VisitDate,
		IsVerified:   review.IsVerified,
		HelpfulCount: review.HelpfulCount,
		CreatedAt:    review.CreatedAt,
		Author: dto.UserInfo{
			ID:        review.User.ID,
			Username:  review.User.Username,
			FirstName: review.User.FirstName,
			LastName:  review.User.LastName,
		},
		Images: images,
	}
}