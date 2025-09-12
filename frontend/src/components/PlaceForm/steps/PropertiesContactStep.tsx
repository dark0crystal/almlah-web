"use client"
import React, { useEffect } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
import { usePlaceStore } from '../../../stores/usePlaceStore';
// import { propertiesContactSchema, PropertiesContactFormData } from '../../../schemas/placeSchemas';
import { ChevronLeftIcon, ChevronRightIcon, PhoneIcon, EnvelopeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface PropertiesContactFormData {
  property_ids: string[];
  phone: string;
  email: string;
  website: string;
}

export const PropertiesContactStep: React.FC = () => {
  const {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    properties,
    isLoadingProperties,
    fetchProperties,
    setErrors,
    clearErrors
  } = usePlaceStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PropertiesContactFormData>({
    // resolver: zodResolver(propertiesContactSchema), // TODO: Fix type mismatch
    defaultValues: {
      property_ids: formData.property_ids || [], // FIXED: Default to empty array
      phone: formData.phone || '',
      email: formData.email || '',
      website: formData.website || '',
    }
  });

  const watchedPropertyIds = watch('property_ids');

  useEffect(() => {
    // FIXED: Fetch properties based on parent category, not child categories
    if (formData.parent_category_id) {
      console.log('Fetching properties for parent category:', formData.parent_category_id);
      fetchProperties(formData.parent_category_id);
    } else if (formData.category_ids && formData.category_ids.length > 0) {
      // Fallback to first child category if no parent category is set
      console.log('Fetching properties for child category:', formData.category_ids[0]);
      fetchProperties(formData.category_ids[0]);
    }
  }, [formData.parent_category_id, formData.category_ids, fetchProperties]);

  const toggleProperty = (propertyId: string) => {
    const currentIds = watchedPropertyIds || [];
    const newIds = currentIds.includes(propertyId)
      ? currentIds.filter(id => id !== propertyId)
      : [...currentIds, propertyId];
    
    setValue('property_ids', newIds);
  };

  const onSubmit = (data: PropertiesContactFormData) => {
    updateFormData(data);
    clearErrors();
    nextStep();
  };

  const onError = (formErrors: FieldErrors<PropertiesContactFormData>) => {
    const errorMessages: Record<string, string> = {};
    Object.keys(formErrors).forEach(key => {
      const error = formErrors[key as keyof PropertiesContactFormData];
      if (error?.message) {
        errorMessages[key] = error.message;
      }
    });
    setErrors(errorMessages);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Properties & Contact</h2>
        <p className="text-gray-600">
          Add amenities and contact information to help visitors plan their visit
        </p>
      </div>

      {/* Properties Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Properties & Amenities</h3>
          <p className="text-sm text-gray-600 mb-6">Select all amenities and properties available at your place</p>
        </div>

        {isLoadingProperties ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading properties...</span>
          </div>
        ) : properties && properties.length > 0 ? ( // FIXED: Added null check
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {properties.map((property) => {
              const isSelected = watchedPropertyIds?.includes(property.id) || false;
              
              return (
                <div
                  key={property.id}
                  onClick={() => toggleProperty(property.id)}
                  className={`
                    cursor-pointer border-2 rounded-lg p-4 transition-all duration-200
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center
                      ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                    `}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xl">{property.icon || '🏷️'}</span>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm">{property.name_en}</h5>
                      <p className="text-xs text-gray-600">{property.name_ar}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No properties available for the selected category</p>
            {!formData.parent_category_id && !formData.category_ids?.length && (
              <p className="text-sm text-gray-500 mt-2">Please select a category first</p>
            )}
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <p className="text-sm text-gray-600 mb-6">Help visitors get in touch (all fields are optional)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              <PhoneIcon className="w-4 h-4 inline mr-2" />
              Phone Number
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+968 1234 5678"
              className={`
                w-full px-4 py-3 border-2 rounded-lg transition-colors duration-200
                focus:outline-none focus:ring-0
                ${errors.phone 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              <EnvelopeIcon className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="contact@example.com"
              className={`
                w-full px-4 py-3 border-2 rounded-lg transition-colors duration-200
                focus:outline-none focus:ring-0
                ${errors.email 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              <GlobeAltIcon className="w-4 h-4 inline mr-2" />
              Website
            </label>
            <input
              {...register('website')}
              type="url"
              placeholder="https://example.com"
              className={`
                w-full px-4 py-3 border-2 rounded-lg transition-colors duration-200
                focus:outline-none focus:ring-0
                ${errors.website 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
            {errors.website && (
              <p className="text-red-500 text-sm">{errors.website.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Parent Category: {formData.parent_category_id || 'None'}</p>
          <p>Child Categories: {formData.category_ids?.join(', ') || 'None'}</p>
          <p>Properties Length: {properties?.length || 'null/undefined'}</p>
          <p>Loading: {isLoadingProperties ? 'Yes' : 'No'}</p>
        </div>
      )}

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
          className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
        >
          <span>Continue</span>
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};