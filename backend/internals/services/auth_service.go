package services

import (
	"almlah/config"
	"almlah/internals/dto"
	"almlah/internals/domain"
	"almlah/internals/utils"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

func Register(req dto.RegisterRequest) (*dto.AuthResponse, error) {
	// Check if user exists
	var existingUser domain.User
	if err := config.DB.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser).Error; err == nil {
		return nil, errors.New("user already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := domain.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		UserType:     "regular",
		IsActive:     true,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	// Generate JWT - pass UUID directly
	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User: dto.UserInfo{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			UserType:  user.UserType,
		},
	}, nil
}

func Login(req dto.LoginRequest) (*dto.AuthResponse, error) {
	var user domain.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Generate JWT - pass UUID directly
	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User: dto.UserInfo{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			UserType:  user.UserType,
		},
	}, nil
}