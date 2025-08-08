package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"almlah/internals/utils"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// Initialize auth configuration (called from StartServer)
func InitAuthConfig() error {
	// Just verify we can load config - no need to store it globally
	_, err := config.SetupEnv()
	return err
}

// Helper function to get environment variables with defaults
func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Email/Password Authentication
func Register(req dto.RegisterRequest) (*dto.AuthResponse, error) {
	// Check if user exists
	var existingUser domain.User
	if err := config.DB.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser).Error; err == nil {
		if existingUser.Email == req.Email {
			return nil, errors.New("email already exists")
		}
		return nil, errors.New("username already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	// Generate verification token
	verificationToken, err := generateRandomToken()
	if err != nil {
		return nil, errors.New("failed to generate verification token")
	}

	passwordHashStr := string(hashedPassword)

	// Create user
	user := domain.User{
		Username:          req.Username,
		Email:             req.Email,
		PasswordHash:      &passwordHashStr,
		FirstName:         req.FirstName,
		LastName:          req.LastName,
		UserType:          "regular",
		Provider:          "email",
		IsActive:          true,
		IsVerified:        false,
		VerificationToken: &verificationToken,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		return nil, errors.New("failed to create user")
	}

	// Send verification email
	if err := sendVerificationEmail(user.Email, verificationToken); err != nil {
		fmt.Printf("Failed to send verification email: %v\n", err)
	}

	// Generate JWT
	token, expiresAt, err := utils.GenerateJWT(user.ID)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &dto.AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      mapUserToUserInfo(user),
	}, nil
}

func Login(req dto.LoginRequest) (*dto.AuthResponse, error) {
	var user domain.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	// Check if user has a password (OAuth users might not)
	if !user.HasPassword() {
		return nil, errors.New("please login with your social account")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Generate JWT
	token, expiresAt, err := utils.GenerateJWT(user.ID)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &dto.AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      mapUserToUserInfo(user),
	}, nil
}

func ForgotPassword(email string) error {
	var user domain.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		// Don't reveal if email exists or not
		return nil
	}

	if !user.HasPassword() {
		return errors.New("please login with your social account")
	}

	// Generate reset token
	resetToken, err := generateRandomToken()
	if err != nil {
		return errors.New("failed to generate reset token")
	}

	// Set reset token and expiry (24 hours)
	expiryTime := time.Now().Add(24 * time.Hour)
	user.ResetToken = &resetToken
	user.ResetTokenExpiry = &expiryTime

	if err := config.DB.Save(&user).Error; err != nil {
		return errors.New("failed to save reset token")
	}

	// Send reset email
	if err := sendPasswordResetEmail(user.Email, resetToken); err != nil {
		return errors.New("failed to send reset email")
	}

	return nil
}

func ResetPassword(token, newPassword string) error {
	var user domain.User
	if err := config.DB.Where("reset_token = ? AND reset_token_expiry > ?", token, time.Now()).First(&user).Error; err != nil {
		return errors.New("invalid or expired reset token")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	passwordHashStr := string(hashedPassword)
	user.PasswordHash = &passwordHashStr
	user.ResetToken = nil
	user.ResetTokenExpiry = nil

	if err := config.DB.Save(&user).Error; err != nil {
		return errors.New("failed to update password")
	}

	return nil
}

func VerifyEmail(token string) error {
	var user domain.User
	if err := config.DB.Where("verification_token = ?", token).First(&user).Error; err != nil {
		return errors.New("invalid verification token")
	}

	user.IsVerified = true
	user.VerificationToken = nil

	if err := config.DB.Save(&user).Error; err != nil {
		return errors.New("failed to verify email")
	}

	return nil
}

func ResendVerification(email string) error {
	var user domain.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return errors.New("user not found")
	}

	if user.IsVerified {
		return errors.New("email already verified")
	}

	// Generate new verification token
	verificationToken, err := generateRandomToken()
	if err != nil {
		return errors.New("failed to generate verification token")
	}

	user.VerificationToken = &verificationToken

	if err := config.DB.Save(&user).Error; err != nil {
		return errors.New("failed to update verification token")
	}

	// Send verification email
	if err := sendVerificationEmail(user.Email, verificationToken); err != nil {
		return errors.New("failed to send verification email")
	}

	return nil
}

// Google OAuth Authentication

func GoogleAuth(idToken string) (*dto.AuthResponse, error) {
	// For now, we'll accept either an ID token or an authorization code
	// Check if it looks like an authorization code (shorter, no dots)
	if len(idToken) < 100 && !strings.Contains(idToken, ".") {
		// It's an authorization code, exchange it for tokens
		return GoogleCallback(idToken)
	}

	// Verify the Google ID token
	googleUser, err := verifyGoogleIDToken(idToken)
	if err != nil {
		return nil, errors.New("failed to verify Google ID token: " + err.Error())
	}

	// Check if user exists
	var user domain.User
	err = config.DB.Where("email = ?", googleUser.Email).First(&user).Error
	
	if err != nil {
		// User doesn't exist, create new user
		user = domain.User{
			Username:    generateUsernameFromEmail(googleUser.Email),
			Email:       googleUser.Email,
			FirstName:   googleUser.GivenName,
			LastName:    googleUser.FamilyName,
			ProfilePic:  googleUser.Picture,
			UserType:    "regular",
			Provider:    "google",
			GoogleID:    &googleUser.ID,
			IsActive:    true,
			IsVerified:  googleUser.VerifiedEmail,
		}

		if err := config.DB.Create(&user).Error; err != nil {
			return nil, errors.New("failed to create user")
		}
	} else {
		// User exists, update Google info if needed
		updated := false
		if user.GoogleID == nil {
			user.GoogleID = &googleUser.ID
			user.Provider = "google"
			updated = true
		}
		if user.ProfilePic == "" && googleUser.Picture != "" {
			user.ProfilePic = googleUser.Picture
			updated = true
		}
		if !user.IsVerified && googleUser.VerifiedEmail {
			user.IsVerified = true
			updated = true
		}
		
		if updated {
			if err := config.DB.Save(&user).Error; err != nil {
				return nil, errors.New("failed to update user")
			}
		}
	}

	// Generate JWT
	token, expiresAt, err := utils.GenerateJWT(user.ID)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &dto.AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      mapUserToUserInfo(user),
	}, nil
}

// Add this new function to verify Google ID tokens
func verifyGoogleIDToken(idToken string) (*dto.GoogleUserInfo, error) {
	// Use Google's tokeninfo endpoint to verify the ID token
	url := fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", idToken)
	
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("invalid Google ID token")
	}

	var tokenInfo struct {
		Sub           string `json:"sub"`           // Google user ID
		Email         string `json:"email"`
		EmailVerified string `json:"email_verified"`
		Name          string `json:"name"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Picture       string `json:"picture"`
		Locale        string `json:"locale"`
		Aud           string `json:"aud"`           // Should match your client ID
	}

	if err := json.NewDecoder(resp.Body).Decode(&tokenInfo); err != nil {
		return nil, err
	}

	// Verify the audience (client ID)
	oauthConfig := config.GetOAuthConfig()
	if oauthConfig.GoogleClientID == "" {
		return nil, errors.New("Google Client ID not configured")
	}
	if tokenInfo.Aud != oauthConfig.GoogleClientID {
		return nil, errors.New("invalid token audience")
	}

	// Convert to our format
	emailVerified := tokenInfo.EmailVerified == "true"
	
	return &dto.GoogleUserInfo{
		ID:            tokenInfo.Sub,
		Email:         tokenInfo.Email,
		VerifiedEmail: emailVerified,
		Name:          tokenInfo.Name,
		GivenName:     tokenInfo.GivenName,
		FamilyName:    tokenInfo.FamilyName,
		Picture:       tokenInfo.Picture,
		Locale:        tokenInfo.Locale,
	}, nil
}

func GoogleCallback(code string) (*dto.AuthResponse, error) {
	// Exchange code for token
	cfg := getGoogleOAuthConfig()
	oauthToken, err := cfg.Exchange(oauth2.NoContext, code)
	if err != nil {
		return nil, errors.New("failed to exchange code for token")
	}

	// Use the access token to get user info
	googleUser, err := getGoogleUserInfo(oauthToken.AccessToken)
	if err != nil {
		return nil, errors.New("failed to get user info from Google")
	}

	// Check if user exists
	var user domain.User
	err = config.DB.Where("email = ?", googleUser.Email).First(&user).Error
	
	if err != nil {
		// User doesn't exist, create new user
		user = domain.User{
			Username:    generateUsernameFromEmail(googleUser.Email),
			Email:       googleUser.Email,
			FirstName:   googleUser.GivenName,
			LastName:    googleUser.FamilyName,
			ProfilePic:  googleUser.Picture,
			UserType:    "regular",
			Provider:    "google",
			GoogleID:    &googleUser.ID,
			IsActive:    true,
			IsVerified:  googleUser.VerifiedEmail,
		}

		if err := config.DB.Create(&user).Error; err != nil {
			return nil, errors.New("failed to create user")
		}
	} else {
		// User exists, update Google info if needed
		updated := false
		if user.GoogleID == nil {
			user.GoogleID = &googleUser.ID
			user.Provider = "google"
			updated = true
		}
		if user.ProfilePic == "" && googleUser.Picture != "" {
			user.ProfilePic = googleUser.Picture
			updated = true
		}
		if !user.IsVerified && googleUser.VerifiedEmail {
			user.IsVerified = true
			updated = true
		}
		
		if updated {
			if err := config.DB.Save(&user).Error; err != nil {
				return nil, errors.New("failed to update user")
			}
		}
	}

	// Generate JWT
	jwtToken, expiresAt, err := utils.GenerateJWT(user.ID)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &dto.AuthResponse{
		Token:     jwtToken,
		ExpiresAt: expiresAt,
		User:      mapUserToUserInfo(user),
	}, nil
}

// Protected User Operations
func GetUserProfile(userID uuid.UUID) (*dto.ProfileResponse, error) {
	var user domain.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	return &dto.ProfileResponse{
		User: mapUserToUserInfo(user),
	}, nil
}

func UpdateUserProfile(userID uuid.UUID, req dto.UpdateProfileRequest) (*dto.ProfileResponse, error) {
	var user domain.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	// Check if username is being changed and if it's available
	if req.Username != "" && req.Username != user.Username {
		var existingUser domain.User
		if err := config.DB.Where("username = ? AND id != ?", req.Username, userID).First(&existingUser).Error; err == nil {
			return nil, errors.New("username already exists")
		}
		user.Username = req.Username
	}

	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}

	if err := config.DB.Save(&user).Error; err != nil {
		return nil, errors.New("failed to update profile")
	}

	return &dto.ProfileResponse{
		User: mapUserToUserInfo(user),
	}, nil
}

func ChangePassword(userID uuid.UUID, currentPassword, newPassword string) error {
	var user domain.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return errors.New("user not found")
	}

	if !user.HasPassword() {
		return errors.New("cannot change password for OAuth account")
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(currentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}

	passwordHashStr := string(hashedPassword)
	user.PasswordHash = &passwordHashStr

	if err := config.DB.Save(&user).Error; err != nil {
		return errors.New("failed to update password")
	}

	return nil
}

func DeleteUserAccount(userID uuid.UUID) error {
	var user domain.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return errors.New("user not found")
	}

	// Soft delete user
	if err := config.DB.Delete(&user).Error; err != nil {
		return errors.New("failed to delete account")
	}

	return nil
}

// Helper functions
func mapUserToUserInfo(user domain.User) dto.UserInfo {
	return dto.UserInfo{
		ID:         user.ID,
		Username:   user.Username,
		Email:      user.Email,
		FirstName:  user.FirstName,
		LastName:   user.LastName,
		FullName:   user.GetFullName(),
		ProfilePic: user.ProfilePic,
		UserType:   user.UserType,
		Provider:   user.Provider,
		IsVerified: user.IsVerified,
		CreatedAt:  user.CreatedAt,
	}
}

func generateRandomToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func generateUsernameFromEmail(email string) string {
	parts := strings.Split(email, "@")
	username := parts[0]

	// Check if username exists, if so append random number
	var user domain.User
	if err := config.DB.Where("username = ?", username).First(&user).Error; err == nil {
		// Username exists, append timestamp
		timestamp := time.Now().Unix()
		username = fmt.Sprintf("%s%d", username, timestamp)
	}

	return username
}

func getGoogleUserInfo(accessToken string) (*dto.GoogleUserInfo, error) {
	url := fmt.Sprintf("https://www.googleapis.com/oauth2/v2/userinfo?access_token=%s", accessToken)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("failed to get user info from Google")
	}

	var googleUser dto.GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		return nil, err
	}

	return &googleUser, nil
}

func getGoogleOAuthConfig() *oauth2.Config {
	oauthConfig := config.GetOAuthConfig()
	return &oauth2.Config{
		ClientID:     oauthConfig.GoogleClientID,
		ClientSecret: oauthConfig.GoogleClientSecret,
		RedirectURL:  oauthConfig.GoogleRedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

// Email service functions
func sendVerificationEmail(email, token string) error {
	frontendURL := getEnvWithDefault("FRONTEND_URL", "http://localhost:3000")
	verificationLink := fmt.Sprintf("%s/verify-email?token=%s", frontendURL, token)

	fmt.Printf("📧 Verification email for %s: %s\n", email, verificationLink)

	// TODO: Implement actual email sending

	return nil
}

func sendPasswordResetEmail(email, token string) error {
	frontendURL := getEnvWithDefault("FRONTEND_URL", "http://localhost:3000")
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, token)

	fmt.Printf("🔐 Password reset email for %s: %s\n", email, resetLink)

	// TODO: Implement actual email sending

	return nil
}

