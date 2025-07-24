package models

type User struct {
	ID                int
	Username          string
	Email             string
	EncryptedPassword string
	Verified          bool
}
