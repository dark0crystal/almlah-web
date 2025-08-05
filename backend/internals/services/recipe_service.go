package services

import (
	"almlah/config"
	"almlah/internals/dto"
	"almlah/internals/domain"
)

func CreateRecipe(req dto.CreateRecipeRequest, userID uint) (*dto.RecipeResponse, error) {
	recipe := domain.Recipe{
		Title:        req.Title,
		Description:  req.Description,
		CuisineType:  req.CuisineType,
		Difficulty:   req.Difficulty,
		PrepTime:     req.PrepTime,
		CookTime:     req.CookTime,
		Servings:     req.Servings,
		Ingredients:  req.Ingredients,
		Instructions: req.Instructions,
		CreatedBy:    userID,
		IsPublished:  true,
		ViewCount:    0,
	}

	if err := config.DB.Create(&recipe).Error; err != nil {
		return nil, err
	}

	return GetRecipeByID(recipe.ID)
}

func GetRecipes() ([]dto.RecipeResponse, error) {
	var recipes []domain.Recipe

	if err := config.DB.Where("is_published = ?", true).Preload("Creator").Preload("Images").Find(&recipes).Error; err != nil {
		return nil, err
	}

	var response []dto.RecipeResponse
	for _, recipe := range recipes {
		response = append(response, mapRecipeToResponse(recipe))
	}

	return response, nil
}

func GetRecipeByID(id uint) (*dto.RecipeResponse, error) {
	var recipe domain.Recipe

	if err := config.DB.Preload("Creator").Preload("Images").First(&recipe, id).Error; err != nil {
		return nil, err
	}

	// Increment view count
	config.DB.Model(&recipe).Update("view_count", recipe.ViewCount+1)

	response := mapRecipeToResponse(recipe)
	return &response, nil
}

func mapRecipeToResponse(recipe domain.Recipe) dto.RecipeResponse {
	var images []dto.ImageResponse
	for _, img := range recipe.Images {
		images = append(images, dto.ImageResponse{
			ID:           img.ID,
			URL:          img.ImageURL,
			AltText:      img.AltText,
			DisplayOrder: img.DisplayOrder,
		})
	}

	return dto.RecipeResponse{
		ID:           recipe.ID,
		Title:        recipe.Title,
		Description:  recipe.Description,
		CuisineType:  recipe.CuisineType,
		Difficulty:   recipe.Difficulty,
		PrepTime:     recipe.PrepTime,
		CookTime:     recipe.CookTime,
		Servings:     recipe.Servings,
		Ingredients:  recipe.Ingredients,
		Instructions: recipe.Instructions,
		ViewCount:    recipe.ViewCount,
		CreatedAt:    recipe.CreatedAt,
		Author: dto.UserInfo{
			ID:        recipe.Creator.ID,
			Username:  recipe.Creator.Username,
			FirstName: recipe.Creator.FirstName,
			LastName:  recipe.Creator.LastName,
		},
		Images: images,
	}
}
