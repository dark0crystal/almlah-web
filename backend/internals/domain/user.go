package domain

type User struct {
	ID                int
	Username          string
	Email             string
	EncryptedPassword string
	Verified          bool
}

type UserRepo interface {
	FindUserById(id int) (*User, error)
	AddUser(newUser *User) error
	DeleteUserById(id int) error
	UpdateUserById(id int, user *User) error
	PatchUserById(id int, fields []string, user *User) error // only selected fields will be patched
}
