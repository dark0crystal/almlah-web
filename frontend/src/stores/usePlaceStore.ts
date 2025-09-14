// stores/usePlaceStore.ts - Updated with correct properties management
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SupabaseStorageService } from '../services/supabaseStorage';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST || 'http://127.0.0.1:9000';

export interface ContentSection {
  id?: string;
  section_type: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  sort_order: number;
  images: ContentSectionImage[];
}

export interface ContentSectionImage {
  id?: string;
  image_url: string;
  alt_text_ar: string;
  alt_text_en: string;
  caption_ar: string;
  caption_en: string;
  sort_order: number;
  file?: File; // For new uploads
}

// Updated PlaceImage interface to handle both file uploads and URLs
export interface PlaceImage {
  id?: string;
  url?: string; // For existing images with URLs
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  file?: File; // For new file uploads
  preview?: string; // For preview during upload
  supabase_path?: string; // Full Supabase storage path
}

export interface PlaceFormData {
  // Step 1: Category Selection
  parent_category_id?: string;
  category_ids: string[];
  
  // Step 2: Basic Info
  name_ar: string;
  name_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  
  // Step 3: Location
  governate_id?: string;
  wilayah_id?: string;
  latitude?: number;
  longitude?: number;
  
  // Step 4: Description & Content
  description_ar: string;
  description_en: string;
  content_sections: ContentSection[];
  
  // Step 5: Images (stored temporarily until form submission)
  images: PlaceImage[];
  
  // Step 6: Properties & Contact
  property_ids: string[];
  phone?: string;
  email?: string;
  website?: string;
}

export interface CreatedPlace {
  id: string;
  name_en: string;
  name_ar: string;
  // Add other fields as needed
}

// Helper functions for authentication (keeping existing)
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return !!token;
};

const getAuthToken = (): string | null => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Keep existing interfaces (Category, Governate, etc.)
export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  name?: string; // For backward compatibility with API responses that only have 'name'
  slug: string;
  icon: string;
  type: 'primary' | 'secondary';
  parent_id?: string;
}

export interface Governate {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

export interface Wilayah {
  id: string;
  governate_id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

// FIXED: Updated Property interface to match API response
export interface Property {
  id: string;
  name_ar: string;
  name_en: string;
  category_id: string;
  icon?: string;
  description_ar?: string;
  description_en?: string;
}

interface PlaceStore {
  // Form state
  currentStep: number;
  formData: PlaceFormData;
  isSubmitting: boolean;
  errors: Record<string, string>;
  
  // Place creation result
  createdPlace: CreatedPlace | null;
  
  // Data from API
  parentCategories: Category[];
  childCategories: Category[];
  governates: Governate[];
  wilayahs: Wilayah[];
  properties: Property[];
  
  // Loading states
  isLoadingCategories: boolean;
  isLoadingGovernorates: boolean;
  isLoadingWilayahs: boolean;
  isLoadingProperties: boolean;
  
  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<PlaceFormData>) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  
  // API actions
  fetchParentCategories: () => Promise<void>;
  fetchChildCategories: (parentId: string) => Promise<void>;
  fetchGovernorates: () => Promise<void>;
  fetchWilayahs: (governateId: string) => Promise<void>;
  
  // FIXED: Updated properties management
  fetchProperties: (categoryId: string) => Promise<void>;
  fetchPropertiesByFilter: (filter?: PropertyFilter) => Promise<void>;
  clearProperties: () => void;
  
  // Image handling (for temporary storage during form)
  addImage: (image: PlaceImage) => void;
  removeImage: (index: number) => void;
  updateImage: (index: number, image: Partial<PlaceImage>) => void;
  setPrimaryImage: (index: number) => void;
  cleanupImagePreviews: () => void;
  
  // Content sections
  addContentSection: (section: ContentSection) => void;
  removeContentSection: (index: number) => void;
  updateContentSection: (index: number, section: Partial<ContentSection>) => void;
  
  // Form submission with proper image uploading
  submitForm: () => Promise<boolean>;
  uploadPlaceImages: (placeId: string, images: PlaceImage[]) => Promise<boolean>;
  resetForm: () => void;
}

// FIXED: Added PropertyFilter interface for flexible fetching
interface PropertyFilter {
  category_id?: string;
  search?: string;
  has_icon?: boolean;
  page?: number;
  limit?: number;
}

const defaultFormData: PlaceFormData = {
  category_ids: [],
  name_ar: '',
  name_en: '',
  subtitle_ar: '',
  subtitle_en: '',
  description_ar: '',
  description_en: '',
  content_sections: [],
  images: [],
  property_ids: [],
};

export const usePlaceStore = create<PlaceStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      formData: defaultFormData,
      isSubmitting: false,
      errors: {},
      createdPlace: null,
      
      parentCategories: [],
      childCategories: [],
      governates: [],
      wilayahs: [],
      properties: [],
      
      isLoadingCategories: false,
      isLoadingGovernorates: false,
      isLoadingWilayahs: false,
      isLoadingProperties: false,
      
      // Step management (keeping existing)
      setCurrentStep: (step) => set({ currentStep: step }),
      
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 8) {
          set({ currentStep: currentStep + 1 });
        }
      },
      
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },
      
      // Form data management (keeping existing)
      updateFormData: (data) => {
        set((state) => ({
          formData: { ...state.formData, ...data }
        }));
      },
      
      setErrors: (errors) => set({ errors }),
      clearErrors: () => set({ errors: {} }),
      
      // API calls (keeping existing implementations)
      fetchParentCategories: async () => {
        set({ isLoadingCategories: true });
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/categories/primary`);
          const result = await response.json();
          if (result.success) {
            set({ parentCategories: result.data || [] });
          }
        } catch (error) {
          console.error('Failed to fetch parent categories:', error);
          set({ parentCategories: [] });
        } finally {
          set({ isLoadingCategories: false });
        }
      },
      
      fetchChildCategories: async (parentId) => {
        set({ isLoadingCategories: true });
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/categories/secondary/${parentId}`);
          const result = await response.json();
          if (result.success) {
            set({ childCategories: result.data || [] });
          }
        } catch (error) {
          console.error('Failed to fetch child categories:', error);
          set({ childCategories: [] });
        } finally {
          set({ isLoadingCategories: false });
        }
      },
      
      fetchGovernorates: async () => {
        set({ isLoadingGovernorates: true });
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/governates`);
          const result = await response.json();
          if (result.success) {
            set({ governates: result.data });
          }
        } catch (error) {
          console.error('Failed to fetch governates:', error);
        } finally {
          set({ isLoadingGovernorates: false });
        }
      },
      
      fetchWilayahs: async (governateId) => {
        set({ isLoadingWilayahs: true });
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/governates/${governateId}/wilayahs`);
          const result = await response.json();
          if (result.success) {
            set({ wilayahs: result.data });
          }
        } catch (error) {
          console.error('Failed to fetch wilayahs:', error);
        } finally {
          set({ isLoadingWilayahs: false });
        }
      },
      
      // FIXED: Updated to use correct endpoint for category-based property fetching
      fetchProperties: async (categoryId: string) => {
        set({ isLoadingProperties: true, properties: [] });
        
        try {
          console.log(`Fetching properties for category: ${categoryId}`);
          
          // FIXED: Use the correct endpoint that matches your Go handler
          const response = await fetch(`${API_BASE_URL}/api/v1/properties/category/${categoryId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Add auth header if your endpoint requires authentication
              // ...getAuthHeaders(),
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.success && Array.isArray(result.data)) {
            console.log(`Fetched ${result.data.length} properties for category ${categoryId}`);
            set({ properties: result.data });
          } else {
            console.warn('Invalid response format:', result);
            set({ properties: [] });
          }
          
        } catch (error) {
          console.error('Failed to fetch properties:', error);
          set({ 
            properties: [],
            errors: { properties: 'Failed to load properties. Please try again.' }
          });
        } finally {
          set({ isLoadingProperties: false });
        }
      },

      // FIXED: Added flexible property fetching with filters
      fetchPropertiesByFilter: async (filter: PropertyFilter = {}) => {
        set({ isLoadingProperties: true, properties: [] });
        
        try {
          // Build query parameters
          const params = new URLSearchParams();
          
          if (filter.category_id) params.append('category_id', filter.category_id);
          if (filter.search) params.append('search', filter.search);
          if (filter.has_icon !== undefined) params.append('has_icon', filter.has_icon.toString());
          if (filter.page) params.append('page', filter.page.toString());
          if (filter.limit) params.append('limit', filter.limit.toString());

          const queryString = params.toString();
          const url = `${API_BASE_URL}/api/v1/properties${queryString ? `?${queryString}` : ''}`;
          
          console.log('Fetching properties with filter:', filter);
          console.log('Request URL:', url);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.success && Array.isArray(result.data)) {
            console.log(`Fetched ${result.data.length} properties with filter`);
            set({ properties: result.data });
          } else {
            console.warn('Invalid response format:', result);
            set({ properties: [] });
          }
          
        } catch (error) {
          console.error('Failed to fetch properties with filter:', error);
          set({ 
            properties: [],
            errors: { properties: 'Failed to load properties. Please try again.' }
          });
        } finally {
          set({ isLoadingProperties: false });
        }
      },

      // FIXED: Added clear properties function
      clearProperties: () => {
        set({ properties: [] });
      },
      
      // Image management (keeping existing)
      addImage: (image) => {
        set((state) => ({
          formData: {
            ...state.formData,
            images: [...state.formData.images, image]
          }
        }));
      },
      
      removeImage: (index) => {
        const { formData } = get();
        const imageToRemove = formData.images[index];
        
        // Clean up preview URL
        if (imageToRemove.preview) {
          URL.revokeObjectURL(imageToRemove.preview);
        }
        
        set((state) => ({
          formData: {
            ...state.formData,
            images: state.formData.images.filter((_, i) => i !== index)
          }
        }));
      },
      
      updateImage: (index, imageUpdate) => {
        set((state) => ({
          formData: {
            ...state.formData,
            images: state.formData.images.map((img, i) => 
              i === index ? { ...img, ...imageUpdate } : img
            )
          }
        }));
      },
      
      setPrimaryImage: (index) => {
        set((state) => ({
          formData: {
            ...state.formData,
            images: state.formData.images.map((img, i) => ({
              ...img,
              is_primary: i === index
            }))
          }
        }));
      },

      cleanupImagePreviews: () => {
        const { formData } = get();
        formData.images.forEach(image => {
          if (image.preview) {
            URL.revokeObjectURL(image.preview);
          }
        });
      },
      
      // Content sections management (keeping existing)
      addContentSection: (section) => {
        set((state) => ({
          formData: {
            ...state.formData,
            content_sections: [...state.formData.content_sections, section]
          }
        }));
      },
      
      removeContentSection: (index) => {
        set((state) => ({
          formData: {
            ...state.formData,
            content_sections: state.formData.content_sections.filter((_, i) => i !== index)
          }
        }));
      },
      
      updateContentSection: (index, sectionUpdate) => {
        set((state) => ({
          formData: {
            ...state.formData,
            content_sections: state.formData.content_sections.map((section, i) => 
              i === index ? { ...section, ...sectionUpdate } : section
            )
          }
        }));
      },
      
      // Form submission with proper image structure
      submitForm: async () => {
        const { formData } = get();
        set({ isSubmitting: true, errors: {} });
        
        try {
          // Check authentication
          if (!isAuthenticated()) {
            set({ errors: { submit: 'Please login to continue.' } });
            return false;
          }

          console.log('Submitting form data:', formData);

          // FIXED: Prepare category_ids to include both parent and child categories
          const allCategoryIds = [...formData.category_ids]; // Start with child categories
          
          // Add parent category if it exists and is not already in the list
          if (formData.parent_category_id && !allCategoryIds.includes(formData.parent_category_id)) {
            allCategoryIds.unshift(formData.parent_category_id); // Add parent at the beginning
          }

          console.log('Final category IDs to submit:', allCategoryIds);

          // Process content sections without uploading images first
          // We'll upload images after place creation with proper place ID
          const processedContentSections = formData.content_sections.map(section => ({
            section_type: section.section_type,
            title_ar: section.title_ar,
            title_en: section.title_en,
            content_ar: section.content_ar,
            content_en: section.content_en,
            sort_order: section.sort_order,
            images: [] // Images will be uploaded after place and sections are created
          }));

          // Prepare the data for place creation
          const requestData = {
            name_ar: formData.name_ar,
            name_en: formData.name_en,
            subtitle_ar: formData.subtitle_ar,
            subtitle_en: formData.subtitle_en,
            description_ar: formData.description_ar,
            description_en: formData.description_en,
            phone: formData.phone || '',
            email: formData.email || '',
            website: formData.website || '',
            latitude: formData.latitude || 0,
            longitude: formData.longitude || 0,
            governate_id: formData.governate_id || null,
            wilayah_id: formData.wilayah_id || null,
            
            // FIXED: Send all category IDs (parent + children)
            category_ids: allCategoryIds,
            property_ids: formData.property_ids,
            
            // Send empty arrays for place images - they'll be uploaded separately
            images: [],
            // Include content sections with their uploaded image URLs
            content_sections: processedContentSections
          };

          console.log('Request data to be sent:', requestData);

          // Create the place with content sections and their images
          const response = await fetch(`${API_BASE_URL}/api/v1/places`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestData)
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
          }

          if (!result.success) {
            throw new Error(result.message || 'Failed to create place');
          }

          console.log('Place created successfully:', result.data);
          
          // Store the created place
          set({ createdPlace: result.data });
          const placeId = result.data.id;

          // Upload place images if any
          if (formData.images.length > 0) {
            console.log('Uploading place images...');
            const imageUploadSuccess = await get().uploadPlaceImages(placeId, formData.images);
            if (!imageUploadSuccess) {
              console.warn('Place created but image upload failed');
            }
          }

          // Upload content section images if any
          // Now we have the real place ID and can get section IDs from the response
          if (result.data.content_sections && result.data.content_sections.length > 0) {
            for (let i = 0; i < formData.content_sections.length; i++) {
              const formSection = formData.content_sections[i];
              const createdSection = result.data.content_sections[i];
              
              if (formSection.images && formSection.images.length > 0 && createdSection?.id) {
                console.log(`Uploading images for content section: ${formSection.title_en}`);
                
                try {
                  // Prepare images for Supabase upload
                  const imagesToUpload = formSection.images
                    .filter(img => img.file) // Only upload images with files
                    .map(img => ({
                      file: img.file!,
                      altTextAr: img.alt_text_ar || '',
                      altTextEn: img.alt_text_en || '',
                      captionAr: img.caption_ar || '',
                      captionEn: img.caption_en || '',
                      sortOrder: img.sort_order
                    }));

                  if (imagesToUpload.length > 0) {
                    // Upload images to Supabase with proper place and section IDs
                    const uploadedImages = await SupabaseStorageService.uploadContentSectionImages(
                      placeId,
                      createdSection.id,
                      imagesToUpload
                    );

                    console.log(`Successfully uploaded ${uploadedImages.length} images for section: ${formSection.title_en}`);

                    // Send image URLs to backend
                    const imageData = uploadedImages.map(img => ({
                      image_url: img.url,
                      alt_text_ar: img.altTextAr,
                      alt_text_en: img.altTextEn,
                      caption_ar: img.captionAr,
                      caption_en: img.captionEn,
                      sort_order: img.sortOrder
                    }));

                    const imageResponse = await fetch(`${API_BASE_URL}/api/v1/images/content-sections/${createdSection.id}/images`, {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({ images: imageData })
                    });

                    const imageResult = await imageResponse.json();

                    if (!imageResponse.ok || !imageResult.success) {
                      console.warn(`Failed to save image data for section ${formSection.title_en}:`, imageResult.message);
                    } else {
                      console.log(`Content section images saved successfully for: ${formSection.title_en}`);
                    }
                  }
                } catch (imageUploadError) {
                  console.error(`Failed to upload images for section ${formSection.title_en}:`, imageUploadError);
                }
              }
            }
          }

          // Move to success step
          set({ currentStep: 8 });
          return true;

        } catch (error) {
          console.error('Form submission error:', error);
          set({ 
            errors: { 
              submit: error instanceof Error ? error.message : 'An unexpected error occurred' 
            } 
          });
          return false;
        } finally {
          set({ isSubmitting: false });
        }
      },
      // Upload place images using proper file structure
      uploadPlaceImages: async (placeId: string, images: PlaceImage[]) => {
        try {
          // Prepare images for upload to Supabase
          const imagesToUpload = images
            .filter(img => img.file) // Only upload images with files
            .map(img => ({
              file: img.file!,
              isPrimary: img.is_primary,
              altText: img.alt_text,
              displayOrder: img.display_order
            }));

          if (imagesToUpload.length === 0) {
            console.log('No images to upload');
            return true;
          }

          // Upload images to Supabase with proper file structure
          const uploadedImages = await SupabaseStorageService.uploadPlaceImages(
            placeId,
            imagesToUpload
          );

          console.log('Images uploaded to Supabase:', uploadedImages);

          // Send image URLs to backend
          const imageData = uploadedImages.map(img => ({
            image_url: img.url,
            alt_text: img.altText,
            is_primary: img.isPrimary,
            display_order: img.displayOrder
          }));

          const response = await fetch(`${API_BASE_URL}/api/v1/places/${placeId}/images`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ images: imageData })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            console.error('Failed to save image data to backend:', result.message);
            return false;
          }

          console.log('Place images saved successfully:', result.data);
          return true;

        } catch (error) {
          console.error('Place image upload error:', error);
          return false;
        }
      },


      
      // Reset form
      resetForm: () => {
        const { cleanupImagePreviews } = get();
        cleanupImagePreviews();
        
        set({
          currentStep: 1,
          formData: defaultFormData,
          isSubmitting: false,
          errors: {},
          createdPlace: null
        });
      }
      
    })
  )
);