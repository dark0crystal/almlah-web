// internals/cache/redis.go
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	RedisClient *redis.Client
	ctx         = context.Background()
)

// InitRedis initializes the Redis client
func InitRedis() error {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}

	redisPort := os.Getenv("REDIS_PORT")
	if redisPort == "" {
		redisPort = "6379"
	}

	redisPassword := os.Getenv("REDIS_PASSWORD")
	redisDB := os.Getenv("REDIS_DB")
	
	db := 0
	if redisDB != "" {
		if parsed, err := strconv.Atoi(redisDB); err == nil {
			db = parsed
		}
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password:     redisPassword,
		DB:           db,
		PoolSize:     10,
		PoolTimeout:  30 * time.Second,
		IdleTimeout:  5 * time.Minute,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	// Test connection
	_, err := RedisClient.Ping(ctx).Result()
	if err != nil {
		log.Printf("✅ Cached category: %s (%s)", category.NameEn, category.ID)
	}
	return err
}

func (s *MetaCacheService) GetCategory(categoryID uuid.UUID) (*dto.CategoryResponse, error) {
	var category dto.CategoryResponse
	key := cache.CategoryKey(categoryID)
	
	err := cache.Get(key, &category)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Category %s", categoryID)
	return &category, nil
}

func (s *MetaCacheService) CacheCategoryList(categories interface{}, lang string) error {
	if categories == nil {
		return fmt.Errorf("categories list is nil")
	}

	key := cache.CategoryListKey(lang)
	err := cache.Set(key, categories, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache category list (lang: %s): %v", lang, err)
	} else {
		log.Printf("✅ Cached category list (lang: %s)", lang)
	}
	return err
}

func (s *MetaCacheService) GetCategoryList(lang string) (interface{}, error) {
	var categories interface{}
	key := cache.CategoryListKey(lang)
	
	err := cache.Get(key, &categories)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Category list (lang: %s)", lang)
	return categories, nil
}

func (s *MetaCacheService) CacheCategoryHierarchy(hierarchy *dto.CategoryHierarchyResponse, lang string) error {
	if hierarchy == nil {
		return fmt.Errorf("hierarchy is nil")
	}

	key := cache.CategoryHierarchyKey(lang)
	err := cache.Set(key, hierarchy, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache category hierarchy (lang: %s): %v", lang, err)
	} else {
		log.Printf("✅ Cached category hierarchy (lang: %s)", lang)
	}
	return err
}

func (s *MetaCacheService) GetCategoryHierarchy(lang string) (*dto.CategoryHierarchyResponse, error) {
	var hierarchy dto.CategoryHierarchyResponse
	key := cache.CategoryHierarchyKey(lang)
	
	err := cache.Get(key, &hierarchy)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Category hierarchy (lang: %s)", lang)
	return &hierarchy, nil
}

func (s *MetaCacheService) CachePrimaryCategories(categories interface{}, lang string) error {
	if categories == nil {
		return fmt.Errorf("primary categories list is nil")
	}

	key := cache.PrimaryCategoriesKey(lang)
	err := cache.Set(key, categories, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache primary categories (lang: %s): %v", lang, err)
	} else {
		log.Printf("✅ Cached primary categories (lang: %s)", lang)
	}
	return err
}

func (s *MetaCacheService) GetPrimaryCategories(lang string) (interface{}, error) {
	var categories interface{}
	key := cache.PrimaryCategoriesKey(lang)
	
	err := cache.Get(key, &categories)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Primary categories (lang: %s)", lang)
	return categories, nil
}

func (s *MetaCacheService) CacheSecondaryCategories(parentID uuid.UUID, categories []dto.CategoryResponse) error {
	if categories == nil {
		return fmt.Errorf("secondary categories list is nil")
	}

	key := cache.SecondaryCategoriesKey(parentID)
	err := cache.Set(key, categories, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache secondary categories for %s: %v", parentID, err)
	} else {
		log.Printf("✅ Cached secondary categories for %s (%d categories)", parentID, len(categories))
	}
	return err
}

func (s *MetaCacheService) GetSecondaryCategories(parentID uuid.UUID) ([]dto.CategoryResponse, error) {
	var categories []dto.CategoryResponse
	key := cache.SecondaryCategoriesKey(parentID)
	
	err := cache.Get(key, &categories)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Secondary categories for %s (%d categories)", parentID, len(categories))
	return categories, nil
}

func (s *MetaCacheService) InvalidateCategory(categoryID uuid.UUID) error {
	// Delete specific category
	cache.Delete(cache.CategoryKey(categoryID))
	
	// Delete related cached data
	cache.DeletePattern(cache.CategoryPattern(categoryID))
	
	// Invalidate category lists
	s.InvalidateCategoryLists()
	
	log.Printf("🗑️ Invalidated cache for category: %s", categoryID)
	return nil
}

func (s *MetaCacheService) InvalidateCategoryLists() error {
	// Delete all category lists
	cache.DeletePattern(cache.CategoryListPrefix + "*")
	cache.DeletePattern(cache.CategoryHierarchyPrefix + "*")
	cache.DeletePattern(cache.PrimaryCategoriesPrefix + "*")
	cache.DeletePattern(cache.SecondaryCategoriesPrefix + "*")
	
	log.Printf("🗑️ Invalidated all category list caches")
	return nil
}

// Governates
func (s *MetaCacheService) CacheGovernate(governate *dto.GovernateResponse) error {
	if governate == nil {
		return fmt.Errorf("governate is nil")
	}

	key := cache.GovernateKey(governate.ID)
	err := cache.Set(key, governate, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache governate %s: %v", governate.ID, err)
	} else {
		log.Printf("✅ Cached governate: %s (%s)", governate.NameEn, governate.ID)
	}
	return err
}

func (s *MetaCacheService) GetGovernate(governateID uuid.UUID) (*dto.GovernateResponse, error) {
	var governate dto.GovernateResponse
	key := cache.GovernateKey(governateID)
	
	err := cache.Get(key, &governate)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Governate %s", governateID)
	return &governate, nil
}

func (s *MetaCacheService) CacheGovernateList(governates []dto.GovernateResponse) error {
	if governates == nil {
		return fmt.Errorf("governates list is nil")
	}

	key := cache.GovernateListKey()
	err := cache.Set(key, governates, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache governate list: %v", err)
	} else {
		log.Printf("✅ Cached governate list: %d governates", len(governates))
	}
	return err
}

func (s *MetaCacheService) GetGovernateList() ([]dto.GovernateResponse, error) {
	var governates []dto.GovernateResponse
	key := cache.GovernateListKey()
	
	err := cache.Get(key, &governates)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Governate list (%d governates)", len(governates))
	return governates, nil
}

func (s *MetaCacheService) CacheGovernateWilayahs(governateID uuid.UUID, wilayahs []dto.WilayahResponse) error {
	if wilayahs == nil {
		return fmt.Errorf("wilayahs list is nil")
	}

	key := cache.GovernateWilayahsKey(governateID)
	err := cache.Set(key, wilayahs, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache governate wilayahs %s: %v", governateID, err)
	} else {
		log.Printf("✅ Cached governate wilayahs: %s (%d wilayahs)", governateID, len(wilayahs))
	}
	return err
}

func (s *MetaCacheService) GetGovernateWilayahs(governateID uuid.UUID) ([]dto.WilayahResponse, error) {
	var wilayahs []dto.WilayahResponse
	key := cache.GovernateWilayahsKey(governateID)
	
	err := cache.Get(key, &wilayahs)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Governate wilayahs %s (%d wilayahs)", governateID, len(wilayahs))
	return wilayahs, nil
}

func (s *MetaCacheService) InvalidateGovernate(governateID uuid.UUID) error {
	// Delete specific governate
	cache.Delete(cache.GovernateKey(governateID))
	
	// Delete related cached data
	cache.DeletePattern(cache.GovernatePattern(governateID))
	
	// Invalidate governate lists
	s.InvalidateGovernateLists()
	
	log.Printf("🗑️ Invalidated cache for governate: %s", governateID)
	return nil
}

func (s *MetaCacheService) InvalidateGovernateLists() error {
	// Delete governate list
	cache.Delete(cache.GovernateListKey())
	
	// Delete governate wilayahs
	cache.DeletePattern(cache.GovernateWilayahsPrefix + "*")
	
	log.Printf("🗑️ Invalidated all governate list caches")
	return nil
}

// Wilayahs
func (s *MetaCacheService) CacheWilayah(wilayah *dto.WilayahResponse) error {
	if wilayah == nil {
		return fmt.Errorf("wilayah is nil")
	}

	key := cache.WilayahKey(wilayah.ID)
	err := cache.Set(key, wilayah, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache wilayah %s: %v", wilayah.ID, err)
	} else {
		log.Printf("✅ Cached wilayah: %s (%s)", wilayah.NameEn, wilayah.ID)
	}
	return err
}

func (s *MetaCacheService) GetWilayah(wilayahID uuid.UUID) (*dto.WilayahResponse, error) {
	var wilayah dto.WilayahResponse
	key := cache.WilayahKey(wilayahID)
	
	err := cache.Get(key, &wilayah)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Wilayah %s", wilayahID)
	return &wilayah, nil
}

func (s *MetaCacheService) CacheWilayahList(wilayahs []dto.WilayahResponse) error {
	if wilayahs == nil {
		return fmt.Errorf("wilayahs list is nil")
	}

	key := cache.WilayahListKey()
	err := cache.Set(key, wilayahs, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache wilayah list: %v", err)
	} else {
		log.Printf("✅ Cached wilayah list: %d wilayahs", len(wilayahs))
	}
	return err
}

func (s *MetaCacheService) GetWilayahList() ([]dto.WilayahResponse, error) {
	var wilayahs []dto.WilayahResponse
	key := cache.WilayahListKey()
	
	err := cache.Get(key, &wilayahs)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Wilayah list (%d wilayahs)", len(wilayahs))
	return wilayahs, nil
}

func (s *MetaCacheService) CacheWilayahSearchResults(query string, wilayahs []dto.WilayahResponse) error {
	key := cache.WilayahSearchKey(query)
	err := cache.Set(key, wilayahs, cache.ShortTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache wilayah search results for '%s': %v", query, err)
	} else {
		log.Printf("✅ Cached wilayah search results for '%s': %d wilayahs", query, len(wilayahs))
	}
	return err
}

func (s *MetaCacheService) GetWilayahSearchResults(query string) ([]dto.WilayahResponse, error) {
	var wilayahs []dto.WilayahResponse
	key := cache.WilayahSearchKey(query)
	
	err := cache.Get(key, &wilayahs)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Wilayah search results for '%s' (%d wilayahs)", query, len(wilayahs))
	return wilayahs, nil
}

func (s *MetaCacheService) InvalidateWilayah(wilayahID uuid.UUID) error {
	// Delete specific wilayah
	cache.Delete(cache.WilayahKey(wilayahID))
	
	// Delete related cached data
	cache.DeletePattern(cache.WilayahPattern(wilayahID))
	
	// Invalidate wilayah lists
	s.InvalidateWilayahLists()
	
	log.Printf("🗑️ Invalidated cache for wilayah: %s", wilayahID)
	return nil
}

func (s *MetaCacheService) InvalidateWilayahLists() error {
	// Delete wilayah list
	cache.Delete(cache.WilayahListKey())
	
	// Delete search results
	cache.DeletePattern(cache.WilayahSearchPrefix + "*")
	
	log.Printf("🗑️ Invalidated all wilayah list caches")
	return nil
}

// Properties
func (s *MetaCacheService) CacheProperty(property *dto.DetailedPropertyResponse) error {
	if property == nil {
		return fmt.Errorf("property is nil")
	}

	key := cache.PropertyKey(property.ID)
	err := cache.Set(key, property, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache property %s: %v", property.ID, err)
	} else {
		log.Printf("✅ Cached property: %s (%s)", property.NameEn, property.ID)
	}
	return err
}

func (s *MetaCacheService) GetProperty(propertyID uuid.UUID) (*dto.DetailedPropertyResponse, error) {
	var property dto.DetailedPropertyResponse
	key := cache.PropertyKey(propertyID)
	
	err := cache.Get(key, &property)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Property %s", propertyID)
	return &property, nil
}

func (s *MetaCacheService) CachePropertyList(properties []dto.PropertyListResponse) error {
	if properties == nil {
		return fmt.Errorf("properties list is nil")
	}

	key := cache.PropertyListKey()
	err := cache.Set(key, properties, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache property list: %v", err)
	} else {
		log.Printf("✅ Cached property list: %d properties", len(properties))
	}
	return err
}

func (s *MetaCacheService) GetPropertyList() ([]dto.PropertyListResponse, error) {
	var properties []dto.PropertyListResponse
	key := cache.PropertyListKey()
	
	err := cache.Get(key, &properties)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Property list (%d properties)", len(properties))
	return properties, nil
}

func (s *MetaCacheService) CachePropertiesByCategory(categoryID uuid.UUID, properties []dto.PropertyListResponse) error {
	key := cache.PropertyByCategoryKey(categoryID)
	err := cache.Set(key, properties, cache.LongTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache properties by category %s: %v", categoryID, err)
	} else {
		log.Printf("✅ Cached properties by category %s: %d properties", categoryID, len(properties))
	}
	return err
}

func (s *MetaCacheService) GetPropertiesByCategory(categoryID uuid.UUID) ([]dto.PropertyListResponse, error) {
	var properties []dto.PropertyListResponse
	key := cache.PropertyByCategoryKey(categoryID)
	
	err := cache.Get(key, &properties)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Properties by category %s (%d properties)", categoryID, len(properties))
	return properties, nil
}

func (s *MetaCacheService) CachePlaceProperties(placeID uuid.UUID, properties []dto.PlacePropertyResponse) error {
	key := cache.PlacePropertiesKey(placeID)
	err := cache.Set(key, properties, cache.MediumTTL)
	if err != nil {
		log.Printf("⚠️ Failed to cache place properties %s: %v", placeID, err)
	} else {
		log.Printf("✅ Cached place properties: %s (%d properties)", placeID, len(properties))
	}
	return err
}

func (s *MetaCacheService) GetPlaceProperties(placeID uuid.UUID) ([]dto.PlacePropertyResponse, error) {
	var properties []dto.PlacePropertyResponse
	key := cache.PlacePropertiesKey(placeID)
	
	err := cache.Get(key, &properties)
	if err != nil {
		return nil, err
	}

	log.Printf("🎯 Cache HIT: Place properties %s (%d properties)", placeID, len(properties))
	return properties, nil
}

func (s *MetaCacheService) InvalidateProperty(propertyID uuid.UUID) error {
	// Delete specific property
	cache.Delete(cache.PropertyKey(propertyID))
	
	// Delete related cached data
	cache.DeletePattern(cache.PropertyPattern(propertyID))
	
	// Invalidate property lists
	s.InvalidatePropertyLists()
	
	log.Printf("🗑️ Invalidated cache for property: %s", propertyID)
	return nil
}

func (s *MetaCacheService) InvalidatePropertyLists() error {
	// Delete property list
	cache.Delete(cache.PropertyListKey())
	
	// Delete category-filtered lists
	cache.DeletePattern(cache.PropertyByCategoryPrefix + "*")
	
	// Delete place properties
	cache.DeletePattern(cache.PlacePropertiesPrefix + "*")
	
	log.Printf("🗑️ Invalidated all property list caches")
	return nil
}