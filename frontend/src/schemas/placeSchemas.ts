// schemas/placeSchemas.ts
import { z } from 'zod';

// Step 1: Category Selection Schema
export const categorySelectionSchema = z.object({
  parent_category_id: z.string().uuid('Please select a parent category'),
  category_ids: z.array(z.string().uuid()).min(1, 'Please select at least one category type')
});

// Step 2: Basic Info Schema
export const basicInfoSchema = z.object({
  name_ar: z.string().min(2, 'Arabic name must be at least 2 characters').max(200, 'Arabic name must be less than 200 characters'),
  name_en: z.string().min(2, 'English name must be at least 2 characters').max(200, 'English name must be less than 200 characters'),
  subtitle_ar: z.string().optional(),
  subtitle_en: z.string().optional(),
});

// Step 3: Location Schema
export const locationSchema = z.object({
  governate_id: z.string().uuid('Please select a governate'),
  wilayah_id: z.string().uuid('Please select a wilayah'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Content Section Image Schema
export const contentSectionImageSchema = z.object({
  id: z.string().optional(),
  image_url: z.string().url('Invalid image URL').optional(),
  alt_text_ar: z.string().optional(),
  alt_text_en: z.string().optional(),
  caption_ar: z.string().optional(),
  caption_en: z.string().optional(),
  sort_order: z.number().min(0).default(0),
});

// Content Section Schema
export const contentSectionSchema = z.object({
  id: z.string().optional(),
  section_type: z.string().min(1, 'Section type is required'),
  title_ar: z.string().min(1, 'Arabic title is required'),
  title_en: z.string().min(1, 'English title is required'),
  content_ar: z.string().optional(),
  content_en: z.string().optional(),
  sort_order: z.number().min(0).default(0),
  images: z.array(contentSectionImageSchema).default([]),
});

// Step 4: Description & Content Schema
export const descriptionContentSchema = z.object({
  description_ar: z.string().min(10, 'Arabic description must be at least 10 characters'),
  description_en: z.string().min(10, 'English description must be at least 10 characters'),
  content_sections: z.array(contentSectionSchema).default([]),
});

// Place Image Schema
export const placeImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url('Invalid image URL').optional(),
  alt_text: z.string().default(''),
  is_primary: z.boolean().default(false),
  display_order: z.number().min(0).default(0),
  file: z.instanceof(File).optional(),
  preview: z.string().optional(),
});

// Step 5: Images Schema
export const imagesSchema = z.object({
  images: z.array(placeImageSchema).min(1, 'Please add at least one image'),
});

// Step 6: Properties & Contact Schema
export const propertiesContactSchema = z.object({
  property_ids: z.array(z.string().uuid()).default([]),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

// Complete form schema
export const completeFormSchema = z.object({
  // Step 1
  parent_category_id: z.string().uuid('Please select a parent category').optional(),
  category_ids: z.array(z.string().uuid()).min(1, 'Please select at least one category type'),
  
  // Step 2
  name_ar: z.string().min(2, 'Arabic name must be at least 2 characters').max(200, 'Arabic name must be less than 200 characters'),
  name_en: z.string().min(2, 'English name must be at least 2 characters').max(200, 'English name must be less than 200 characters'),
  subtitle_ar: z.string().optional(),
  subtitle_en: z.string().optional(),
  
  // Step 3
  governate_id: z.string().uuid('Please select a governate').optional(),
  wilayah_id: z.string().uuid('Please select a wilayah').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  
  // Step 4
  description_ar: z.string().min(10, 'Arabic description must be at least 10 characters'),
  description_en: z.string().min(10, 'English description must be at least 10 characters'),
  content_sections: z.array(contentSectionSchema).default([]),
  
  // Step 5
  images: z.array(placeImageSchema).min(1, 'Please add at least one image'),
  
  // Step 6
  property_ids: z.array(z.string().uuid()).default([]),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

// Individual step types
export type CategorySelectionFormData = z.infer<typeof categorySelectionSchema>;
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type DescriptionContentFormData = z.infer<typeof descriptionContentSchema>;
export type ImagesFormData = z.infer<typeof imagesSchema>;
export type PropertiesContactFormData = z.infer<typeof propertiesContactSchema>;
export type CompleteFormData = z.infer<typeof completeFormSchema>;

// Content section types
export type ContentSection = z.infer<typeof contentSectionSchema>;
export type ContentSectionImage = z.infer<typeof contentSectionImageSchema>;
export type PlaceImage = z.infer<typeof placeImageSchema>;

// Validation functions
export const validateStep = (step: number, data: any) => {
  switch (step) {
    case 1:
      return categorySelectionSchema.safeParse(data);
    case 2:
      return basicInfoSchema.safeParse(data);
    case 3:
      return locationSchema.safeParse(data);
    case 4:
      return descriptionContentSchema.safeParse(data);
    case 5:
      return imagesSchema.safeParse(data);
    case 6:
      return propertiesContactSchema.safeParse(data);
    default:
      return { success: true, data };
  }
};

// Section types for content sections
export const SECTION_TYPES = [
  { value: 'history', label_en: 'History', label_ar: 'التاريخ', icon: '📜' },
  { value: 'activities', label_en: 'Activities', label_ar: 'الأنشطة', icon: '🎯' },
  { value: 'facilities', label_en: 'Facilities', label_ar: 'المرافق', icon: '🏢' },
  { value: 'location', label_en: 'Location Details', label_ar: 'تفاصيل الموقع', icon: '📍' },
  { value: 'tips', label_en: 'Visitor Tips', label_ar: 'نصائح للزوار', icon: '💡' },
  { value: 'opening_hours', label_en: 'Opening Hours', label_ar: 'ساعات العمل', icon: '🕐' },
  { value: 'contact', label_en: 'Contact Information', label_ar: 'معلومات الاتصال', icon: '📞' },
  { value: 'gallery', label_en: 'Photo Gallery', label_ar: 'معرض الصور', icon: '🖼️' },
  { value: 'reviews', label_en: 'Reviews & Ratings', label_ar: 'التقييمات والآراء', icon: '⭐' },
  { value: 'other', label_en: 'Other Information', label_ar: 'معلومات أخرى', icon: '📋' },
] as const;

export type SectionType = typeof SECTION_TYPES[number]['value'];