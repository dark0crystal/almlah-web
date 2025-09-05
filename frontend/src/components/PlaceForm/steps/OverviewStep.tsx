"use client"
import React from 'react';
import Image from 'next/image';
import { usePlaceStore } from '../../../stores/usePlaceStore';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, PhotoIcon, TagIcon } from '@heroicons/react/24/outline';
import { SECTION_TYPES } from '../../../schemas/placeSchemas';

export const OverviewStep: React.FC = () => {
  const {
    formData,
    prevStep,
    submitForm,
    isSubmitting,
    errors,
    parentCategories,
    childCategories,
    governates,
    wilayahs,
    properties
  } = usePlaceStore();

  const getParentCategoryName = () => {
    const parent = parentCategories.find(c => c.id === formData.parent_category_id);
    return parent ? `${parent.name_en} - ${parent.name_ar}` : '';
  };

  const getChildCategoryNames = () => {
    return formData.category_ids
      .map(id => childCategories.find(c => c.id === id))
      .filter(Boolean)
      .map(c => `${c!.name_en} - ${c!.name_ar}`)
      .join(', ');
  };

  const getLocationInfo = () => {
    const governate = governates.find(g => g.id === formData.governate_id);
    const wilayah = wilayahs.find(w => w.id === formData.wilayah_id);
    
    const parts = [];
    if (governate) parts.push(`${governate.name_en} - ${governate.name_ar}`);
    if (wilayah) parts.push(`${wilayah.name_en} - ${wilayah.name_ar}`);
    
    return parts.join(' > ');
  };

  const getSelectedProperties = () => {
    return formData.property_ids
      .map(id => properties.find(p => p.id === id))
      .filter(Boolean)
      .map(p => `${p!.name_en} - ${p!.name_ar}`);
  };

  const handleSubmit = async () => {
    const success = await submitForm();
    if (!success && errors.submit) {
      alert(errors.submit);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
        <p className="text-gray-600">
          Please review all information before submitting your place
        </p>
      </div>

      {/* Overview Cards */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TagIcon className="w-5 h-5 mr-2" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">English Name:</span>
              <p className="font-medium">{formData.name_en}</p>
            </div>
            <div>
              <span className="text-gray-600">Arabic Name:</span>
              <p className="font-medium" dir="rtl">{formData.name_ar}</p>
            </div>
            {formData.subtitle_en && (
              <div>
                <span className="text-gray-600">English Subtitle:</span>
                <p className="font-medium">{formData.subtitle_en}</p>
              </div>
            )}
            {formData.subtitle_ar && (
              <div>
                <span className="text-gray-600">Arabic Subtitle:</span>
                <p className="font-medium" dir="rtl">{formData.subtitle_ar}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <span className="text-gray-600">Category:</span>
              <p className="font-medium">{getParentCategoryName()}</p>
              {getChildCategoryNames() && (
                <p className="text-sm text-gray-600 mt-1">{getChildCategoryNames()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2" />
            Location
          </h3>
          <div className="text-sm space-y-2">
            <div>
              <span className="text-gray-600">Location:</span>
              <p className="font-medium">{getLocationInfo()}</p>
            </div>
            {(formData.latitude && formData.longitude) && (
              <div>
                <span className="text-gray-600">Coordinates:</span>
                <p className="font-medium font-mono">{formData.latitude}, {formData.longitude}</p>
              </div>
            )}
          </div>
        </div>

        {/* Descriptions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-gray-600">English:</span>
              <p className="mt-1">{formData.description_en}</p>
            </div>
            <div>
              <span className="text-gray-600">Arabic:</span>
              <p className="mt-1" dir="rtl">{formData.description_ar}</p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        {formData.content_sections.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Sections ({formData.content_sections.length})</h3>
            <div className="space-y-3">
              {formData.content_sections.map((section, index) => {
                const sectionType = SECTION_TYPES.find(t => t.value === section.section_type);
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xl">{sectionType?.icon || '📋'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{section.title_en} - {section.title_ar}</p>
                      <p className="text-xs text-gray-600 capitalize">{section.section_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PhotoIcon className="w-5 h-5 mr-2" />
            Photos ({formData.images.length})
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {formData.images.slice(0, 8).map((image, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                <Image
                  src={image.preview || image.url || ''}
                  alt={image.alt_text || ''}
                  fill
                  className="object-cover"
                />
                {image.is_primary && (
                  <div className="absolute top-1 left-1">
                    <div className="bg-yellow-500 text-white px-1 py-0.5 rounded text-xs font-bold">
                      ⭐
                    </div>
                  </div>
                )}
              </div>
            ))}
            {formData.images.length > 8 && (
              <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-600">
                +{formData.images.length - 8}
              </div>
            )}
          </div>
        </div>

        {/* Properties & Contact */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties & Contact</h3>
          <div className="space-y-4 text-sm">
            {getSelectedProperties().length > 0 && (
              <div>
                <span className="text-gray-600">Properties ({getSelectedProperties().length}):</span>
                <p className="mt-1">{getSelectedProperties().join(', ')}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.phone && (
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{formData.phone}</p>
                </div>
              )}
              {formData.email && (
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{formData.email}</p>
                </div>
              )}
              {formData.website && (
                <div>
                  <span className="text-gray-600">Website:</span>
                  <p className="font-medium">{formData.website}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 transition-colors duration-200 flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>Submit Place</span>
              <ChevronRightIcon className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};