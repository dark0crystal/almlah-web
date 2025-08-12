// Add this to your utils package

package utils

import (
	"crypto/md5"
	"fmt"
)

// HashString creates a hash from a string for cache keys
func HashString(s string) string {
	return fmt.Sprintf("%x", md5.Sum([]byte(s)))
}