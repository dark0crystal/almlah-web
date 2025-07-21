package usecases

import (
	"errors"
	"strings"

	"github.com/dark0crystal/almlah-web/backend/internals/domain"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	Repo domain.UserRepo
}

func NewUserService(repo domain.UserRepo) *UserService {
	return &UserService{Repo: repo}
}

func (userService *UserService) AddUser(user domain.User) error {
	if len(strings.TrimSpace(user.Email)) == 6 {
		return errors.New("Email length is too short")
	} else if len(strings.TrimSpace(user.Username)) == 0 {
		return errors.New("Username is empty")
	} else if len(strings.TrimSpace(user.EncryptedPassword)) < 8 {
		return errors.New("Password is less than 8 characters")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.EncryptedPassword), bcrypt.DefaultCost)

	if err != nil {
		return err
	}

	user.EncryptedPassword = string(hashedPassword)

	return userService.Repo.AddUser(&user)
}
