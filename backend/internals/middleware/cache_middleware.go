package middleware

import (
	"almlah/internals/cache"
	"crypto/md5"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// CacheConfig defines cache middleware configuration
type CacheConfig struct {
	TTL          time.Duration
	SkipQuery    bool
	KeyGenerator func(c *fiber.Ctx) string
}

// DefaultCacheConfig provides default cache settings
func DefaultCacheConfig() CacheConfig {
	return CacheConfig{
		TTL:       cache.ShortTTL,
		SkipQuery: false,
		KeyGenerator: func(c *fiber.Ctx) string {
			url := c.OriginalURL()
			if len(url) > 100 {
				// Hash long URLs
				hash := md5.Sum([]byte(url))
				url = fmt.Sprintf("%x", hash)
			}
			return fmt.Sprintf("http_cache:%s", url)
		},
	}
}

// CacheMiddleware creates HTTP response caching middleware
func CacheMiddleware(config ...CacheConfig) fiber.Handler {
	cfg := DefaultCacheConfig()
	if len(config) > 0 {
		cfg = config[0]
	}

	return func(c *fiber.Ctx) error {
		// Skip caching for non-GET requests
		if c.Method() != "GET" {
			return c.Next()
		}

		// Skip if Redis is not available
		if !cache.IsRedisAvailable() {
			return c.Next()
		}

		// Generate cache key
		key := cfg.KeyGenerator(c)

		// Try to get from cache
		var cachedResponse CachedResponse
		if err := cache.Get(key, &cachedResponse); err == nil {
			// Cache hit
			c.Set("X-Cache", "HIT")
			c.Set("Content-Type", cachedResponse.ContentType)
			
			if cachedResponse.StatusCode != 0 {
				c.Status(cachedResponse.StatusCode)
			}
			
			return c.Send(cachedResponse.Body)
		}

		// Cache miss - continue with request
		c.Set("X-Cache", "MISS")

		// Capture response
		originalWrite := c.Response().BodyWriter()
		responseBuffer := &responseWriter{
			original: originalWrite,
			body:     make([]byte, 0),
		}
		c.Response().SetBodyWriter(responseBuffer)

		// Continue with the request
		err := c.Next()

		// Cache successful responses
		if err == nil && c.Response().StatusCode() < 400 {
			cachedResp := CachedResponse{
				Body:        responseBuffer.body,
				ContentType: string(c.Response().Header.ContentType()),
				StatusCode:  c.Response().StatusCode(),
			}

			// Cache in background to avoid blocking
			go cache.Set(key, cachedResp, cfg.TTL)
		}

		return err
	}
}

// CachedResponse represents a cached HTTP response
type CachedResponse struct {
	Body        []byte `json:"body"`
	ContentType string `json:"content_type"`
	StatusCode  int    `json:"status_code"`
}

// responseWriter captures the response body for caching
type responseWriter struct {
	original []byte
	body     []byte
}

func (w *responseWriter) Write(p []byte) (int, error) {
	w.body = append(w.body, p...)
	return len(p), nil
}

// CacheForRoute creates route-specific cache middleware
func CacheForRoute(ttl time.Duration, keyPrefix string) fiber.Handler {
	config := CacheConfig{
		TTL: ttl,
		KeyGenerator: func(c *fiber.Ctx) string {
			url := c.OriginalURL()
			// Remove query parameters for more consistent caching
			if idx := strings.Index(url, "?"); idx != -1 {
				url = url[:idx]
			}
			return fmt.Sprintf("%s:%s", keyPrefix, url)
		},
	}
	return CacheMiddleware(config)
}

// InvalidateCache removes cached responses for a pattern
func InvalidateCache(pattern string) {
	cache.DeletePattern(pattern)
}


