package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuthHandler struct{}

func SetupAuthRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := AuthHandler{}

	// Public auth routes
	auth := app.Group("/api/v1/auth")
	
	// Email/Password authentication
	auth.Post("/register", handler.Register)
	auth.Post("/login", handler.Login)
	auth.Post("/forgot-password", handler.ForgotPassword)
	auth.Post("/reset-password", handler.ResetPassword)
	auth.Post("/verify-email", handler.VerifyEmail)
	auth.Post("/resend-verification", handler.ResendVerification)
	
	// OAuth authentication
	auth.Post("/google", handler.GoogleAuth)
	auth.Get("/google/callback", handler.GoogleCallback) // For web flow
	
	// Protected routes (require authentication)
	auth.Get("/me", middleware.AuthRequired, handler.GetProfile)
	auth.Put("/me", middleware.AuthRequired, handler.UpdateProfile)
	auth.Post("/change-password", middleware.AuthRequired, handler.ChangePassword)
	auth.Post("/logout", middleware.AuthRequired, handler.Logout)
	auth.Delete("/account", middleware.AuthRequired, handler.DeleteAccount)
}

// Email/Password Authentication
func (h *AuthHandler) Register(ctx *fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	response, err := services.Register(req)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("User registered successfully. Please check your email for verification.", response))
}

func (h *AuthHandler) Login(ctx *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	response, err := services.Login(req)
	if err != nil {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Login successful", response))
}

func (h *AuthHandler) ForgotPassword(ctx *fiber.Ctx) error {
	var req dto.ForgotPasswordRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	err := services.ForgotPassword(req.Email)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Password reset email sent", nil))
}

func (h *AuthHandler) ResetPassword(ctx *fiber.Ctx) error {
	var req dto.ResetPasswordRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	err := services.ResetPassword(req.Token, req.Password)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Password reset successful", nil))
}

func (h *AuthHandler) VerifyEmail(ctx *fiber.Ctx) error {
	var req dto.VerifyEmailRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	err := services.VerifyEmail(req.Token)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Email verified successfully", nil))
}

func (h *AuthHandler) ResendVerification(ctx *fiber.Ctx) error {
	var req dto.ForgotPasswordRequest // Reuse same structure (just email)
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	err := services.ResendVerification(req.Email)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Verification email sent", nil))
}

// OAuth Authentication
func (h *AuthHandler) GoogleAuth(ctx *fiber.Ctx) error {
	var req dto.GoogleAuthRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	response, err := services.GoogleAuth(req.Token)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Google authentication successful", response))
}

func (h *AuthHandler) GoogleCallback(ctx *fiber.Ctx) error {
	// This endpoint handles the callback from Google OAuth flow
	code := ctx.Query("code")
	if code == "" {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Authorization code required"))
	}

	response, err := services.GoogleCallback(code)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// For web applications, you might want to redirect with the token
	// For API, return the response
	return ctx.JSON(utils.SuccessResponse("Google authentication successful", response))
}

// Protected Routes
func (h *AuthHandler) GetProfile(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID").(uuid.UUID)
	
	profile, err := services.GetUserProfile(userID)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Profile retrieved successfully", profile))
}

func (h *AuthHandler) UpdateProfile(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID").(uuid.UUID)
	
	var req dto.UpdateProfileRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	profile, err := services.UpdateUserProfile(userID, req)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Profile updated successfully", profile))
}

func (h *AuthHandler) ChangePassword(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID").(uuid.UUID)
	
	var req dto.ChangePasswordRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	err := services.ChangePassword(userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Password changed successfully", nil))
}

func (h *AuthHandler) Logout(ctx *fiber.Ctx) error {
	// For JWT-based auth, logout is typically handled client-side
	// But you can implement token blacklisting here if needed
	return ctx.JSON(utils.SuccessResponse("Logged out successfully", nil))
}

func (h *AuthHandler) DeleteAccount(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID").(uuid.UUID)
	
	err := services.DeleteUserAccount(userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Account deleted successfully", nil))
}