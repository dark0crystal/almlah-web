// stores/usePlaceStore.ts
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
      
      // API calls
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
      
      // Image management
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
      
      // Form submission
      submitForm: async () => {
        const { formData } = get();
        set({ isSubmitting: true });
        
        try {
          // Create FormData for file uploads
          const submitData = new FormData();
          
          // Add text data
          Object.entries(formData).forEach(([key, value]) => {
            if (key === 'images') {
              // Handle images separately
              return;
            }
            if (key === 'content_sections') {
              submitData.append(key, JSON.stringify(value));
              return;
            }
            if (Array.isArray(value)) {
              value.forEach((item) => submitData.append(`${key}[]`, item));
            } else if (value !== undefined && value !== null) {
              submitData.append(key, value.toString());
            }
          });
          
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
          
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/v1/places`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: submitData
          });
          
          const result = await response.json();
          
          if (result.success) {
            set({ currentStep: 8 }); // Success step
            return true;
          } else {
            set({ errors: { submit: result.error || 'Failed to create place' } });
            return false;
          }
        } catch (error) {
          console.error('Form submission error:', error);
          set({ errors: { submit: 'Network error occurred' } });
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