package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// SetupAuthRoutes sets up authentication routes
func SetupAuthRoutes(rh *rest.RestHandler) {
	// Auth routes
	auth := rh.App.Group("/api/v1/auth")

	// Public routes (no authentication required)
	auth.Post("/register", registerHandler)
	auth.Post("/login", loginHandler)
	auth.Post("/forgot-password", forgotPasswordHandler)
	auth.Post("/reset-password", resetPasswordHandler)
	auth.Post("/verify-email", verifyEmailHandler)
	auth.Post("/resend-verification", resendVerificationHandler)

	// OAuth routes
	auth.Post("/google", googleAuthHandler)
	auth.Get("/google/callback", googleCallbackHandler)

	// Protected routes with RBAC
	auth.Get("/me", middleware.AuthRequiredWithRBAC, getProfileHandler)
	auth.Put("/me", middleware.AuthRequiredWithRBAC, updateProfileHandler)
	auth.Post("/change-password", middleware.AuthRequiredWithRBAC, changePasswordHandler)
	auth.Post("/logout", middleware.AuthRequiredWithRBAC, logoutHandler)
	auth.Delete("/account", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_delete_user"), 
		deleteAccountHandler)
}

// Public Authentication Handlers

func registerHandler(ctx *fiber.Ctx) error {
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

func loginHandler(ctx *fiber.Ctx) error {
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

func forgotPasswordHandler(ctx *fiber.Ctx) error {
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

	return ctx.JSON(utils.SuccessResponse("If the email exists, a password reset link has been sent", nil))
}

func resetPasswordHandler(ctx *fiber.Ctx) error {
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

func verifyEmailHandler(ctx *fiber.Ctx) error {
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

func resendVerificationHandler(ctx *fiber.Ctx) error {
	var req dto.ForgotPasswordRequest // Reusing same structure (just email)
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

// OAuth Handlers

func googleAuthHandler(ctx *fiber.Ctx) error {
	var req dto.GoogleAuthRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// Log the request for debugging
	fmt.Printf("Google OAuth request received with token length: %d\n", len(req.Token))

	response, err := services.GoogleAuth(req.Token)
	if err != nil {
		fmt.Printf("Google OAuth error: %v\n", err)
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	fmt.Printf("Google OAuth successful for user: %s\n", response.User.Email)
	return ctx.JSON(utils.SuccessResponse("Google authentication successful", response))
}

func googleCallbackHandler(ctx *fiber.Ctx) error {
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

// Protected Handlers (require authentication)

func getProfileHandler(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID").(uuid.UUID)

	profile, err := services.GetUserProfile(userID)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Profile retrieved successfully", profile))
}

func updateProfileHandler(ctx *fiber.Ctx) error {
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

func changePasswordHandler(ctx *fiber.Ctx) error {
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

func logoutHandler(ctx *fiber.Ctx) error {
	// For JWT-based auth, logout is typically handled client-side
	// But you can implement token blacklisting here if needed
	return ctx.JSON(utils.SuccessResponse("Logged out successfully", nil))
}

func deleteAccountHandler(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID").(uuid.UUID)

	err := services.DeleteUserAccount(userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Account deleted successfully", nil))
}