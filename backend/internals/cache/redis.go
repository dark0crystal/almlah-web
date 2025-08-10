package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/sony/gobreaker"
)

var (
	Client    *redis.Client
	ctx       = context.Background()
	redisOnce sync.Once

	// Prometheus metrics
	cacheHits = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "cache_hits_total",
		Help: "Total number of cache hits",
	})
	cacheMisses = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "cache_misses_total",
		Help: "Total number of cache misses",
	})
	cacheErrors = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "cache_errors_total",
		Help: "Total number of cache errors",
	})

	// Circuit breaker
	cb = gobreaker.NewCircuitBreaker(gobreaker.Settings{
		Name:        "Redis",
		MaxRequests: 5,
		Interval:    30 * time.Second,
		Timeout:     10 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures > 5
		},
		OnStateChange: func(name string, from, to gobreaker.State) {
			log.Printf("CircuitBreaker '%s' changed from %s to %s", name, from, to)
		},
	})

	// TTL constants
	ShortTTL   = 5 * time.Minute
	MediumTTL  = 30 * time.Minute
	LongTTL    = 2 * time.Hour
	VeryLongTTL = 24 * time.Hour
)

func init() {
	prometheus.MustRegister(cacheHits, cacheMisses, cacheErrors)
}

// InitializeRedis sets up the Redis connection with thread-safe initialization
func InitializeRedis(redisURL string) error {
	var initErr error
	redisOnce.Do(func() {
		opts, err := redis.ParseURL(redisURL)
		if err != nil {
			initErr = fmt.Errorf("failed to parse Redis URL: %v", err)
			return
		}

		Client = redis.NewClient(opts)
		_, err = Client.Ping(ctx).Result()
		if err != nil {
			initErr = fmt.Errorf("failed to connect to Redis: %v", err)
			return
		}
		log.Println("✅ Redis connection established successfully")
	})
	return initErr
}

// Get retrieves a value from cache with context timeout
func Get(key string, dest interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	if Client == nil {
		return fmt.Errorf("redis client not initialized")
	}

	val, err := Client.Get(ctx, key).Result()
	switch {
	case err == redis.Nil:
		cacheMisses.Inc()
		return fmt.Errorf("cache miss for key: %s", key)
	case err != nil:
		cacheErrors.Inc()
		return fmt.Errorf("cache error for key %s: %v", key, err)
	default:
		cacheHits.Inc()
	}

	if err := json.Unmarshal([]byte(val), dest); err != nil {
		cacheErrors.Inc()
		return fmt.Errorf("failed to unmarshal cache value for key %s: %v", key, err)
	}

	return nil
}

// Set stores a value in cache with context timeout
func Set(key string, value interface{}, ttl time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	if Client == nil {
		log.Printf("⚠️ Redis client not initialized, skipping cache set for key: %s", key)
		return nil
	}

	jsonValue, err := json.Marshal(value)
	if err != nil {
		cacheErrors.Inc()
		return fmt.Errorf("failed to marshal value for key %s: %v", key, err)
	}

	if err := Client.Set(ctx, key, jsonValue, ttl).Err(); err != nil {
		cacheErrors.Inc()
		return fmt.Errorf("failed to set cache for key %s: %v", key, err)
	}

	return nil
}

// Delete removes a key from cache with context timeout
func Delete(key string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	if Client == nil {
		log.Printf("⚠️ Redis client not initialized, skipping cache delete for key: %s", key)
		return nil
	}

	if err := Client.Del(ctx, key).Err(); err != nil {
		cacheErrors.Inc()
		return fmt.Errorf("failed to delete cache key %s: %v", key, err)
	}

	return nil
}

// DeletePattern removes all keys matching a pattern with SCAN iterator
func DeletePattern(pattern string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if Client == nil {
		log.Printf("⚠️ Redis client not initialized, skipping pattern delete: %s", pattern)
		return nil
	}

	iter := Client.Scan(ctx, 0, pattern, 0).Iterator()
	var keys []string
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}

	if err := iter.Err(); err != nil {
		cacheErrors.Inc()
		return fmt.Errorf("failed to scan keys with pattern %s: %v", pattern, err)
	}

	if len(keys) == 0 {
		return nil
	}

	if err := Client.Del(ctx, keys...).Err(); err != nil {
		cacheErrors.Inc()
		return fmt.Errorf("failed to delete keys with pattern %s: %v", pattern, err)
	}

	log.Printf("🗑️ Deleted %d keys matching pattern: %s", len(keys), pattern)
	return nil
}

// Close safely closes the Redis connection
func Close() error {
	if Client == nil {
		return nil
	}

	if err := Client.Close(); err != nil {
		return fmt.Errorf("failed to close Redis connection: %v", err)
	}

	log.Println("🔌 Redis connection closed")
	return nil
}

// GetOrSet provides atomic cache get-or-set operation
func GetOrSet(key string, dest interface{}, ttl time.Duration, fetchFunc func() (interface{}, error)) error {
	_, err := cb.Execute(func() (interface{}, error) {
		if err := Get(key, dest); err == nil {
			return nil, nil
		}

		value, err := fetchFunc()
		if err != nil {
			return nil, fmt.Errorf("failed to fetch data for key %s: %v", key, err)
		}

		if err := Set(key, value, ttl); err != nil {
			log.Printf("⚠️ Failed to cache value for key %s: %v", key, err)
		}

		jsonValue, err := json.Marshal(value)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal fetched value: %v", err)
		}

		return nil, json.Unmarshal(jsonValue, dest)
	})
	return err
}

// IsAvailable checks if Redis is responsive
func IsAvailable() bool {
	if Client == nil {
		return false
	}
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()
	_, err := Client.Ping(ctx).Result()
	return err == nil
}

// Exists checks if a key exists in cache
func Exists(key string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	if Client == nil {
		return false, fmt.Errorf("redis client not initialized")
	}

	count, err := Client.Exists(ctx, key).Result()
	if err != nil {
		cacheErrors.Inc()
		return false, fmt.Errorf("failed to check existence of key %s: %v", key, err)
	}

	return count > 0, nil
}

// GetTTL returns the remaining TTL for a key
func GetTTL(key string) (time.Duration, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	if Client == nil {
		return 0, fmt.Errorf("redis client not initialized")
	}

	ttl, err := Client.TTL(ctx, key).Result()
	if err != nil {
		cacheErrors.Inc()
		return 0, fmt.Errorf("failed to get TTL for key %s: %v", key, err)
	}

	return ttl, nil
}

// FlushAll clears all cache (use with caution!)
func FlushAll() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if Client == nil {
		return fmt.Errorf("redis client not initialized")
	}

	if err := Client.FlushAll(ctx).Err(); err != nil {
		cacheErrors.Inc()
		return fmt.Errorf("failed to flush cache: %v", err)
	}

	log.Println("🧹 Cache flushed successfully")
	return nil
}

// GetStats returns Redis server statistics
func GetStats() (map[string]interface{}, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	if Client == nil {
		return nil, fmt.Errorf("redis client not initialized")
	}

	info, err := Client.Info(ctx).Result()
	if err != nil {
		cacheErrors.Inc()
		return nil, fmt.Errorf("failed to get Redis info: %v", err)
	}

	stats := make(map[string]interface{})
	lines := strings.Split(info, "\r\n")
	
	for _, line := range lines {
		if strings.Contains(line, ":") && !strings.HasPrefix(line, "#") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				stats[key] = value
			}
		}
	}

	return stats, nil
}

// GetCacheInfo returns information about cached keys
func GetCacheInfo() (map[string]interface{}, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if Client == nil {
		return nil, fmt.Errorf("redis client not initialized")
	}

	info := make(map[string]interface{})
	
	iter := Client.Scan(ctx, 0, "*", 0).Iterator()
	prefixCounts := make(map[string]int)
	total := 0

	for iter.Next(ctx) {
		total++
		key := iter.Val()
		parts := strings.SplitN(key, "_", 2)
		if len(parts) > 0 {
			prefix := parts[0]
			prefixCounts[prefix]++
		}
	}

	if err := iter.Err(); err != nil {
		cacheErrors.Inc()
		return nil, fmt.Errorf("failed to scan keys: %v", err)
	}
	
	info["total_keys"] = total
	info["keys_by_prefix"] = prefixCounts
	
	return info, nil
}

// InvalidatePattern safely invalidates cache patterns in background
func InvalidatePattern(pattern string) {
	go func() {
		_, err := cb.Execute(func() (interface{}, error) {
			return nil, DeletePattern(pattern)
		})
		if err != nil {
			log.Printf("❌ Failed to invalidate pattern %s: %v", pattern, err)
		}
	}()
}

// InvalidateKeys safely invalidates multiple keys in background
func InvalidateKeys(keys ...string) {
	go func() {
		for _, key := range keys {
			_, err := cb.Execute(func() (interface{}, error) {
				return nil, Delete(key)
			})
			if err != nil {
				log.Printf("❌ Failed to invalidate key %s: %v", key, err)
			}
		}
	}()
}