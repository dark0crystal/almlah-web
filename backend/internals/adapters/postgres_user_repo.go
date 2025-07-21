package adapters

import (
	"context"
	"log"

	"github.com/dark0crystal/almlah-web/backend/internals/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgreUserRepo struct {
	DB *pgxpool.Pool
}

func NewPostgresUserRepo(db *pgxpool.Pool) *PostgreUserRepo {
	return &PostgreUserRepo{DB: db}
}

func (repo *PostgreUserRepo) FindUserById(id int) (*domain.User, error) {
	var user domain.User
	row := repo.DB.QueryRow(
		context.Background(),
		`SELECT id, username, email, encrypted_password, verified 
		FROM users 
		WHERE id = $1;`,
		id,
	)

	if err := row.Scan(&user.ID, &user.Username, &user.Email, &user.EncryptedPassword, &user.Verified); err != nil {
		log.Printf("module=adapters method=FindUserById err=scan_failed_for_id_%d err=", err)
		return nil, err
	}

	return &user, nil
}

func (repo *PostgreUserRepo) AddUser(newUser domain.User) error {
	_, err := repo.DB.Exec(
		context.Background(),
		`SELECT username, email, encrypted_password, verified 
		FROM users;`,
		newUser.Username, newUser.Email, newUser.EncryptedPassword, false,
	)

	if err != nil {
		log.Printf("module=adapters method=AddUser err=db_exec_failed err=", err)
		return err
	}

	return nil
}
