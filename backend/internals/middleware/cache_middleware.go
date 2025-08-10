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

// CachedResponse represents a cached HTTP response
type CachedResponse struct {
	Body        []byte            `json:"body"`
	ContentType string            `json:"content_type"`
	StatusCode  int               `json:"status_code"`
	Headers     map[string]string `json:"headers,omitempty"`
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
		if !cache.IsAvailable() {
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
			
			// Set cached headers if any
			for headerKey, headerValue := range cachedResponse.Headers {
				c.Set(headerKey, headerValue)
			}
			
			if cachedResponse.StatusCode != 0 {
				c.Status(cachedResponse.StatusCode)
			}
			
			return c.Send(cachedResponse.Body)
		}

		// Cache miss - continue with request
		c.Set("X-Cache", "MISS")

		// Execute the handler
		err := c.Next()
		if err != nil {
			return err
		}

		// Cache successful responses (status < 400)
		if c.Response().StatusCode() < 400 {
			// Get the response body
			body := c.Response().Body()
			
			// Prepare cached response
			cachedResp := CachedResponse{
				Body:        make([]byte, len(body)),
				ContentType: string(c.Response().Header.ContentType()),
				StatusCode:  c.Response().StatusCode(),
				Headers:     make(map[string]string),
			}
			
			// Copy body to avoid reference issues
			copy(cachedResp.Body, body)
			
			// Cache important headers (optional)
			c.Response().Header.VisitAll(func(key, value []byte) {
				headerKey := string(key)
				headerValue := string(value)
				
				// Cache only specific headers to avoid bloating cache
				switch strings.ToLower(headerKey) {
				case "content-type", "content-encoding", "cache-control", "etag":
					cachedResp.Headers[headerKey] = headerValue
				}
			})

			// Cache in background to avoid blocking
			go func() {
				cache.Set(key, cachedResp, cfg.TTL)
			}()
		}

		return nil
	}
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

// CacheWithCustomKey creates cache middleware with custom key generation
func CacheWithCustomKey(ttl time.Duration, keyFunc func(c *fiber.Ctx) string) fiber.Handler {
	config := CacheConfig{
		TTL:          ttl,
		KeyGenerator: keyFunc,
	}
	return CacheMiddleware(config)
}

// CacheHeaders creates middleware that only caches specific headers
func CacheHeaders(ttl time.Duration, headers []string) fiber.Handler {
	headerMap := make(map[string]bool)
	for _, h := range headers {
		headerMap[strings.ToLower(h)] = true
	}
	
	return func(c *fiber.Ctx) error {
		if c.Method() != "GET" || !cache.IsAvailable() {
			return c.Next()
		}

		key := fmt.Sprintf("header_cache:%s", c.OriginalURL())
		
		var cachedResponse CachedResponse
		if err := cache.Get(key, &cachedResponse); err == nil {
			c.Set("X-Cache", "HIT")
			for headerKey, headerValue := range cachedResponse.Headers {
				c.Set(headerKey, headerValue)
			}
			return c.Next()
		}

		c.Set("X-Cache", "MISS")
		err := c.Next()
		if err != nil {
			return err
		}

		if c.Response().StatusCode() < 400 {
			cachedResp := CachedResponse{
				Headers: make(map[string]string),
			}
			
			c.Response().Header.VisitAll(func(key, value []byte) {
				headerKey := strings.ToLower(string(key))
				if headerMap[headerKey] {
					cachedResp.Headers[string(key)] = string(value)
				}
			})

			go func() {
				cache.Set(key, cachedResp, ttl)
			}()
		}

		return nil
	}
}