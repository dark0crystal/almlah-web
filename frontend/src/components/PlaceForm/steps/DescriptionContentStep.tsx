"use client"
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlaceStore } from '../../../stores/usePlaceStore';
import { descriptionContentSchema, DescriptionContentFormData, ContentSection, SECTION_TYPES } from '../../../schemas/placeSchemas';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

export const DescriptionContentStep: React.FC = () => {
  const {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    addContentSection,
    removeContentSection,
    updateContentSection,
    setErrors,
    clearErrors
  } = usePlaceStore();

  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<DescriptionContentFormData>({
    resolver: zodResolver(descriptionContentSchema),
    mode: 'onChange',
    defaultValues: {
      description_ar: formData.description_ar,
      description_en: formData.description_en,
      content_sections: formData.content_sections,
    }
  });

  const watchedValues = watch();

  const onSubmit = (data: DescriptionContentFormData) => {
    updateFormData(data);
    clearErrors();
    nextStep();
  };

  const onError = (formErrors: any) => {
    const errorMessages: Record<string, string> = {};
    Object.keys(formErrors).forEach(key => {
      errorMessages[key] = formErrors[key].message;
    });
    setErrors(errorMessages);
  };

  const handleAddContentSection = () => {
    const newSection: ContentSection = {
      section_type: '',
      title_ar: '',
      title_en: '',
      content_ar: '',
      content_en: '',
      sort_order: formData.content_sections.length,
      images: []
    };
    addContentSection(newSection);
    setEditingSectionIndex(formData.content_sections.length);
    setShowAddSection(true);
  };

  const handleSaveSection = (index: number, section: Partial<ContentSection>) => {
    updateContentSection(index, section);
    setEditingSectionIndex(null);
    setShowAddSection(false);
  };

  const handleRemoveSection = (index: number) => {
    if (confirm('Are you sure you want to remove this section?')) {
      removeContentSection(index);
      setEditingSectionIndex(null);
      setShowAddSection(false);
    }
  };

  const ContentSectionForm: React.FC<{ 
    section: ContentSection; 
    index: number; 
    onSave: (section: Partial<ContentSection>) => void;
    onCancel: () => void;
  }> = ({ section, index, onSave, onCancel }) => {
    const [localSection, setLocalSection] = useState(section);

    const updateLocalSection = (updates: Partial<ContentSection>) => {
      setLocalSection(prev => ({ ...prev, ...updates }));
    };

    return (
      <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
        <div className="space-y-4">
          {/* Section Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Section Type <span className="text-red-500">*</span>
            </label>
            <select
              value={localSection.section_type}
              onChange={(e) => updateLocalSection({ section_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Select section type</option>
              {SECTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label_en} - {type.label_ar}
                </option>
              ))}
            </select>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Title (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={localSection.title_en}
                onChange={(e) => updateLocalSection({ title_en: e.target.value })}
                placeholder="Enter title in English"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Title (Arabic) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={localSection.title_ar}
                onChange={(e) => updateLocalSection({ title_ar: e.target.value })}
                placeholder="أدخل العنوان بالعربية"
                dir="rtl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Content (English)
              </label>
              <textarea
                value={localSection.content_en}
                onChange={(e) => updateLocalSection({ content_en: e.target.value })}
                placeholder="Enter detailed content in English"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Content (Arabic)
              </label>
              <textarea
                value={localSection.content_ar}
                onChange={(e) => updateLocalSection({ content_ar: e.target.value })}
                placeholder="أدخل المحتوى المفصل بالعربية"
                dir="rtl"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(localSection)}
              disabled={!localSection.section_type || !localSection.title_en || !localSection.title_ar}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
            >
              Save Section
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Description & Content
        </h2>
        <p className="text-gray-600">
          Provide detailed information about your place and add custom content sections
        </p>
      </div>

      {/* Main Descriptions */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Main Description (English) <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description_en')}
              rows={6}
              placeholder="Describe your place in detail. What makes it special? What can visitors expect?"
              className={`
                w-full px-4 py-3 border-2 rounded-lg transition-colors duration-200
                focus:outline-none focus:ring-0
                ${errors.description_en 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
            {errors.description_en && (
              <p className="text-red-500 text-sm">{errors.description_en.message}</p>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Main description in English</span>
              <span>{watchedValues.description_en?.length || 0} characters</span>
            </div>
          </div>

          {/* Arabic Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Main Description (Arabic) <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description_ar')}
              rows={6}
              placeholder="صف مكانك بالتفصيل. ما الذي يجعله مميزاً؟ ماذا يمكن للزوار أن يتوقعوا؟"
              dir="rtl"
              className={`
                w-full px-4 py-3 border-2 rounded-lg transition-colors duration-200
                focus:outline-none focus:ring-0
                ${errors.description_ar 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
            {errors.description_ar && (
              <p className="text-red-500 text-sm">{errors.description_ar.message}</p>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>الوصف الرئيسي بالعربية</span>
              <span>{watchedValues.description_ar?.length || 0} حرف</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Additional Content Sections</h3>
            <p className="text-sm text-gray-600">Add specialized sections like history, activities, tips, etc.</p>
          </div>
          <button
            type="button"
            onClick={handleAddContentSection}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Section</span>
          </button>
        </div>

        {/* Existing Sections */}
        <div className="space-y-4">
          {formData.content_sections.map((section, index) => (
            <div key={index}>
              {editingSectionIndex === index ? (
                <ContentSectionForm
                  section={section}
                  index={index}
                  onSave={(updatedSection) => handleSaveSection(index, updatedSection)}
                  onCancel={() => setEditingSectionIndex(null)}
                />
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {SECTION_TYPES.find(t => t.value === section.section_type)?.icon || '📋'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {section.title_en} - {section.title_ar}
                        </h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {section.section_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingSectionIndex(index)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(index)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {(section.content_en || section.content_ar) && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p className="line-clamp-2">{section.content_en || section.content_ar}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* New Section Form */}
          {showAddSection && editingSectionIndex === formData.content_sections.length - 1 && (
            <ContentSectionForm
              section={formData.content_sections[formData.content_sections.length - 1]}
              index={formData.content_sections.length - 1}
              onSave={(updatedSection) => handleSaveSection(formData.content_sections.length - 1, updatedSection)}
              onCancel={() => {
                removeContentSection(formData.content_sections.length - 1);
                setShowAddSection(false);
                setEditingSectionIndex(null);
              }}
            />
          )}
        </div>

        {formData.content_sections.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No additional sections yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add sections like history, activities, or visitor tips to make your place more informative
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <button
          type="submit"
          disabled={!isValid}
          className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
        >
          <span>Continue</span>
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};