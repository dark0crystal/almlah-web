// stores/usePlaceStore.ts - Fixed version
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
  
  // Image handling
  addImage: (image: PlaceImage) => void;
  removeImage: (index: number) => void;
  updateImage: (index: number, image: Partial<PlaceImage>) => void;
  setPrimaryImage: (index: number) => void;
  
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
        if (currentStep < 7) {
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
      
      // Image management (keeping existing implementations)
      addImage: (image) => {
        set((state) => ({
          formData: {
            ...state.formData,
            images: [...state.formData.images, image]
          }
        }));
      },
      
      removeImage: (index) => {
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
      
      // Content sections management (keeping existing implementations)
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
      
      // FIXED FORM SUBMISSION
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
          console.log('Using token:', token.substring(0, 20) + '...');

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
            // Convert string IDs to UUIDs as expected by backend
            governate_id: formData.governate_id || null,
            wilayah_id: formData.wilayah_id || null,
            category_ids: formData.category_ids,
            property_ids: formData.property_ids,
            // Transform content sections to match backend structure
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

          console.log('Prepared request data:', requestData);

          // If there are images with files, use FormData approach
          if (formData.images.some(img => img.file)) {
            const submitData = new FormData();
            
            // Add JSON data as a single field
            submitData.append('data', JSON.stringify(requestData));
            
            // Add image files
            formData.images.forEach((image, index) => {
              if (image.file) {
                submitData.append(`images`, image.file);
                submitData.append(`image_metadata_${index}`, JSON.stringify({
                  alt_text: image.alt_text,
                  is_primary: image.is_primary,
                  display_order: image.display_order
                }));
              }
            });

            const response = await fetch(`${API_BASE_URL}/api/v1/places`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type for FormData
              },
              body: submitData
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const result = await response.json();
            console.log('Response body:', result);

            if (response.ok && result.success) {
              set({ currentStep: 8 }); // Success step
              return true;
            } else {
              const errorMessage = result.error || result.message || 'Failed to create place';
              console.error('API Error:', errorMessage);
              set({ errors: { submit: errorMessage } });
              return false;
            }
          } else {
            // No files, use JSON approach
            const response = await fetch(`${API_BASE_URL}/api/v1/places`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response body:', result);

            if (response.ok && result.success) {
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