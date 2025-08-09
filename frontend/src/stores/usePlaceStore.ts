// stores/usePlaceStore.ts - Enhanced with Supabase integration
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SupabaseStorageService } from '../services/supabaseStorage';

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:9000';

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
}

export interface PlaceImage {
  id?: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  file?: File; // For local file handling
  preview?: string; // For preview URL
  supabase_path?: string; // Supabase storage path
  temp_place_id?: string; // Temporary place ID for folder organization
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
  
  // Step 5: Images
  images: PlaceImage[];
  
  // Step 6: Properties & Contact
  property_ids: string[];
  phone?: string;
  email?: string;
  website?: string;
}

// Helper function to check if user is authenticated
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return !!token;
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

// Helper function to get auth headers
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

// Rest of your interfaces remain the same...
export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
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

export interface Property {
  id: string;
  name_ar: string;
  name_en: string;
  category_id: string;
  icon: string;
}

interface PlaceStore {
  // Form state
  currentStep: number;
  formData: PlaceFormData;
  isSubmitting: boolean;
  errors: Record<string, string>;
  
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
  fetchProperties: (categoryId: string) => Promise<void>;
  
  // Enhanced image handling with Supabase
  addImage: (image: PlaceImage) => void;
  removeImage: (index: number) => void;
  updateImage: (index: number, image: Partial<PlaceImage>) => void;
  setPrimaryImage: (index: number) => void;
  uploadImageToSupabase: (file: File, onProgress?: (progress: number) => void) => Promise<PlaceImage | null>;
  cleanupImagePreviews: () => void;
  
  // Content sections
  addContentSection: (section: ContentSection) => void;
  removeContentSection: (index: number) => void;
  updateContentSection: (index: number, section: Partial<ContentSection>) => void;
  
  // Form submission
  submitForm: () => Promise<boolean>;
  resetForm: () => void;
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
      
      parentCategories: [],
      childCategories: [],
      governates: [],
      wilayahs: [],
      properties: [],
      
      isLoadingCategories: false,
      isLoadingGovernorates: false,
      isLoadingWilayahs: false,
      isLoadingProperties: false,
      
      // Step management
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
      
      // Form data management
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
            set({ parentCategories: result.data });
          }
        } catch (error) {
          console.error('Failed to fetch parent categories:', error);
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
            set({ childCategories: result.data });
          }
        } catch (error) {
          console.error('Failed to fetch child categories:', error);
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
      
      fetchProperties: async (categoryId) => {
        set({ isLoadingProperties: true });
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/properties?category_id=${categoryId}`);
          const result = await response.json();
          if (result.success) {
            set({ properties: result.data });
          }
        } catch (error) {
          console.error('Failed to fetch properties:', error);
        } finally {
          set({ isLoadingProperties: false });
        }
      },
      
      // Enhanced image management with Supabase
      addImage: (image) => {
        set((state) => ({
          formData: {
            ...state.formData,
            images: [...state.formData.images, image]
          }
        }));
      },
      
      removeImage: async (index) => {
        const { formData } = get();
        const imageToRemove = formData.images[index];
        
        // If image has a Supabase path, delete it from storage
        if (imageToRemove.supabase_path) {
          try {
            await SupabaseStorageService.deleteFile('media-bucket', imageToRemove.supabase_path);
          } catch (error) {
            console.error('Failed to delete image from Supabase:', error);
          }
        }
        
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

      // New Supabase upload method with proper folder structure
      uploadImageToSupabase: async (file, onProgress, isPrimary = false, placeId = null) => {
        try {
          // Validate file first
          const validation = SupabaseStorageService.validateFile(
            file,
            10 * 1024 * 1024, // 10MB max
            ['image/jpeg', 'image/png', 'image/webp']
          );

          if (!validation.valid) {
            throw new Error(validation.error);
          }

          // Resize image for optimization
          const resizedFile = await SupabaseStorageService.resizeImage(
            file,
            1920, // max width
            1080, // max height
            0.8   // quality
          );

          // Determine folder structure based on your schema
          const tempPlaceId = placeId || `temp-${Date.now()}`;
          const folder = isPrimary ? `places/${tempPlaceId}` : `places/${tempPlaceId}/gallery`;
          
          // Generate filename based on image type
          let fileName;
          if (isPrimary) {
            const extension = file.name.split('.').pop();
            fileName = `cover.${extension}`;
          } else {
            // For gallery images, use sequential naming
            const { formData } = get();
            const galleryCount = formData.images.filter(img => !img.is_primary).length + 1;
            const extension = file.name.split('.').pop();
            fileName = `${galleryCount.toString().padStart(3, '0')}.${extension}`;
          }

          // Upload to Supabase
          const result = await SupabaseStorageService.uploadFile({
            bucket: 'media-bucket',
            folder,
            fileName,
            file: resizedFile,
            onProgress
          });

          if (result.success && result.url && result.path) {
            const { formData } = get();
            
            const uploadedImage: PlaceImage = {
              id: `supabase-${Date.now()}`,
              url: result.url,
              alt_text: '',
              is_primary: isPrimary,
              display_order: formData.images.length,
              supabase_path: result.path,
              preview: URL.createObjectURL(file),
              temp_place_id: tempPlaceId
            };

            return uploadedImage;
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Supabase upload error:', error);
          throw error;
        }
      },

      // Clean up all preview URLs
      cleanupImagePreviews: () => {
        const { formData } = get();
        formData.images.forEach(image => {
          if (image.preview) {
            URL.revokeObjectURL(image.preview);
          }
        });
      },
      
      // Content sections management
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
      
      // Enhanced form submission with Supabase URLs
      submitForm: async () => {
        const { formData } = get();
        set({ isSubmitting: true });
        
        try {
          // Check authentication first
          if (!isAuthenticated()) {
            set({ errors: { submit: 'Please login to continue.' } });
            return false;
          }

          const token = getAuthToken();
          if (!token) {
            set({ errors: { submit: 'Authentication token not found. Please login again.' } });
            return false;
          }

          console.log('Submitting form data:', formData);

          // Prepare the data to match backend DTO structure
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
            category_ids: formData.category_ids,
            property_ids: formData.property_ids,
            
            // Transform images to include Supabase URLs
            images: formData.images.map((image, index) => ({
              image_url: image.url, // This is now the Supabase URL
              alt_text: image.alt_text,
              is_primary: image.is_primary,
              display_order: image.display_order
            })),
            
            // Transform content sections
            content_sections: formData.content_sections.map(section => ({
              section_type: section.section_type,
              title_ar: section.title_ar,
              title_en: section.title_en,
              content_ar: section.content_ar,
              content_en: section.content_en,
              sort_order: section.sort_order,
              images: section.images.map(img => ({
                image_url: img.image_url,
                alt_text_ar: img.alt_text_ar,
                alt_text_en: img.alt_text_en,
                caption_ar: img.caption_ar,
                caption_en: img.caption_en,
                sort_order: img.sort_order
              }))
            }))
          };

          // Enhanced form submission with proper image organization
          const submitFormData = {
            ...requestData,
            
            // Add temporary place IDs to help backend organize images
            temp_image_data: formData.images.map((image, index) => ({
              temp_place_id: image.temp_place_id,
              current_path: image.supabase_path,
              is_primary: image.is_primary,
              alt_text: image.alt_text,
              display_order: image.display_order
            }))
          };

          console.log('Prepared request data with temp image data:', submitFormData);

          // Submit to backend - backend will handle moving images to proper folders
          const response = await fetch(`${API_BASE_URL}/api/v1/places`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(submitFormData)
          });

          console.log('Response status:', response.status);
          const result = await response.json();
          console.log('Response body:', result);

          if (response.ok && result.success) {
            // Clean up preview URLs
            get().cleanupImagePreviews();
            
            set({ currentStep: 8 }); // Success step
            return true;
          } else {
            const errorMessage = result.error || result.message || 'Failed to create place';
            console.error('API Error:', errorMessage);
            
            if (response.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('authToken');
              set({ errors: { submit: 'Authentication failed. Please login again.' } });
            } else {
              set({ errors: { submit: errorMessage } });
            }
            return false;
          }
        } catch (error) {
          console.error('Form submission error:', error);
          set({ errors: { submit: 'Network error occurred. Please check your connection and try again.' } });
          return false;
        } finally {
          set({ isSubmitting: false });
        }
      },
      
      resetForm: () => {
        // Clean up any preview URLs before resetting
        get().cleanupImagePreviews();
        
        set({
          currentStep: 1,
          formData: defaultFormData,
          errors: {},
          isSubmitting: false
        });
      }
    }),
    {
      name: 'place-store'
    }
  )
);