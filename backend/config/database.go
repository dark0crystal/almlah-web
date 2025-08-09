package config

import (
	"almlah/internals/domain"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB(databaseURL string) {
	var err error

	// Use pgx driver with GORM
	DB, err = gorm.Open(postgres.New(postgres.Config{
		DSN:                  databaseURL,
		PreferSimpleProtocol: true, // disables implicit prepared statement usage
	}), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully with pgx driver")
}

func MigrateDB() {
	err := DB.AutoMigrate(
		&domain.User{},
		&domain.Place{},
		&domain.Advice{},
		&domain.Category{},
		&domain.PlaceImage{},
		&domain.Category{},
		&domain.Property{},
		&domain.Recipe{},
		&domain.Review{},
		&domain.RecipeImage{},
		&domain.ReviewImage{},
		&domain.PlaceProperty{},
		&domain.UserFavorite{},
		&domain.Governate{},
		&domain.PlaceContentSection{},
		&domain.Wilayah{},
		&domain.WilayahImage{},
		&domain.PlaceContentSectionImage{},
		&domain.Permission{},
		&domain.Role{},
		&domain.RolePermission{},
		&domain.UserRole{},
		&domain.GovernateImage{},


		
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database migration completed")
}
