package config

import (
	"almlah/internals/cache"
	"log"
)

// InitializeRedis sets up Redis connection
func InitializeRedis() {
	if err := cache.InitRedis(); err != nil {
		log.Printf("⚠️ Redis initialization failed: %v", err)
		log.Printf("🔄 Application will continue without Redis caching")
	} else {
		log.Printf("✅ Redis caching is enabled")
	}
}