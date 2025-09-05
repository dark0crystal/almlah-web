"use client"
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlaceStore } from '../../../stores/usePlaceStore';
import { categorySelectionSchema, CategorySelectionFormData } from '../../../schemas/placeSchemas';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export const CategorySelectionStep: React.FC = () => {
  const {
    formData,
    updateFormData,
    nextStep,
    parentCategories,
    childCategories,
    isLoadingCategories,
    fetchParentCategories,
    fetchChildCategories,
    setErrors,
    clearErrors
  } = usePlaceStore();

  const [selectedParent, setSelectedParent] = useState<string>(formData.parent_category_id || '');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CategorySelectionFormData>({
    resolver: zodResolver(categorySelectionSchema),
    defaultValues: {
      parent_category_id: formData.parent_category_id,
      category_ids: formData.category_ids
    }
  });

  const watchedParentCategory = watch('parent_category_id');
  const watchedCategoryIds = watch('category_ids');

  useEffect(() => {
    fetchParentCategories();
  }, [fetchParentCategories]);

  useEffect(() => {
    if (watchedParentCategory && watchedParentCategory !== selectedParent) {
      setSelectedParent(watchedParentCategory);
      fetchChildCategories(watchedParentCategory);
      // Clear selected child categories when parent changes
      setValue('category_ids', []);
    }
  }, [watchedParentCategory, selectedParent, fetchChildCategories, setValue]);

  const onSubmit = (data: CategorySelectionFormData) => {
    updateFormData(data);
    clearErrors();
    nextStep();
  };

  const onError = (formErrors: Record<string, { message: string }>) => {
    const errorMessages: Record<string, string> = {};
    Object.keys(formErrors).forEach(key => {
      errorMessages[key] = formErrors[key].message;
    });
    setErrors(errorMessages);
  };

  const toggleCategorySelection = (categoryId: string) => {
    const currentIds = watchedCategoryIds || [];
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter(id => id !== categoryId)
      : [...currentIds, categoryId];
    
    setValue('category_ids', newIds);
  };

  if (isLoadingCategories && parentCategories.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What type of place are you adding?
        </h2>
        <p className="text-gray-600">
          First, select the main category, then choose specific types that apply to your place.
        </p>
      </div>

      {/* Parent Category Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Choose Main Category</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parentCategories.map((category) => (
            <label key={category.id} className="cursor-pointer">
              <input
                {...register('parent_category_id')}
                type="radio"
                value={category.id}
                className="sr-only"
              />
              <div className={`
                border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-md
                ${watchedParentCategory === category.id 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{category.name_en || category.name}</h4>
                    <p className="text-sm text-gray-600">{category.name_ar || category.name}</p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>

        {errors.parent_category_id && (
          <p className="text-red-500 text-sm mt-2">{errors.parent_category_id.message}</p>
        )}
      </div>

      {/* Child Categories Selection */}
      {watchedParentCategory && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              Select Specific Types
            </h3>
          </div>

          {isLoadingCategories ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {childCategories.map((category) => {
                const isSelected = watchedCategoryIds?.includes(category.id) || false;
                
                return (
                  <div
                    key={category.id}
                    onClick={() => toggleCategorySelection(category.id)}
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
                      <span className="text-xl">{category.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm">{category.name_en}</h5>
                        <p className="text-xs text-gray-600">{category.name_ar}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {errors.category_ids && (
            <p className="text-red-500 text-sm mt-2">{errors.category_ids.message}</p>
          )}

          {childCategories.length === 0 && !isLoadingCategories && (
            <div className="text-center py-8 text-gray-500">
              <p>No specific types available for this category.</p>
              <p className="text-sm mt-1">You can proceed to the next step.</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <div></div> {/* Empty div for spacing */}
        
        <button
          type="submit"
          disabled={!watchedParentCategory}
          className="
            px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold
            hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors duration-200 flex items-center space-x-2
          "
        >
          <span>Continue</span>
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};