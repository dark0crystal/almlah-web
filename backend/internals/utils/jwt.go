package utils

import (
	"almlah/config"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID uuid.UUID) (string, time.Time, error) {
	cfg, _ := config.SetupEnv()

	expirationTime := time.Now().Add(24 * time.Hour) // 24 hours
	
	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "almlah-api",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

func ValidateJWT(tokenString string) (uuid.UUID, error) {
	cfg, _ := config.SetupEnv()

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return uuid.Nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		// Check if token is expired
		if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
			return uuid.Nil, errors.New("token expired")
		}
		return claims.UserID, nil
	}

	return uuid.Nil, errors.New("invalid token")
}

// GenerateRefreshToken generates a longer-lived refresh token
func GenerateRefreshToken(userID uuid.UUID) (string, time.Time, error) {
	cfg, _ := config.SetupEnv()

	expirationTime := time.Now().Add(7 * 24 * time.Hour) // 7 days
	
	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "almlah-api-refresh",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

// ValidateRefreshToken validates a refresh token
func ValidateRefreshToken(tokenString string) (uuid.UUID, error) {
	cfg, _ := config.SetupEnv()

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return uuid.Nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		// Check if this is a refresh token
		if claims.Issuer != "almlah-api-refresh" {
			return uuid.Nil, errors.New("not a refresh token")
		}
		
		if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
			return uuid.Nil, errors.New("refresh token expired")
		}
		return claims.UserID, nil
	}

	return uuid.Nil, errors.New("invalid refresh token")
}