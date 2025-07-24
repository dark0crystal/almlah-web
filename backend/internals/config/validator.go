package config

import (
	"regexp"

	"github.com/go-playground/validator/v10"
)

var Validate *validator.Validate

func RegisterNewValidator() {
	Validate = validator.New(validator.WithRequiredStructEnabled())

	Validate.RegisterValidation("password", func(fl validator.FieldLevel) bool {
		password := fl.Field().String()
		var (
			hasMinLen  = len(password) >= 8
			hasUpper   = regexp.MustCompile(`[A-Z]`).MatchString(password)
			hasLower   = regexp.MustCompile(`[a-z]`).MatchString(password)
			hasNumber  = regexp.MustCompile(`[0-9]`).MatchString(password)
			hasSpecial = regexp.MustCompile(`[!@#~$%^&*()+|_.,<>?/\\-]`).MatchString(password)
		)
		return hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial
	})

}
