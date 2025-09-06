"use client"
import React from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlaceStore } from '../../../stores/usePlaceStore';
import { basicInfoSchema, BasicInfoFormData } from '../../../schemas/placeSchemas';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export const BasicInfoStep: React.FC = () => {
  const {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    setErrors,
    clearErrors
  } = usePlaceStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    mode: 'onChange',
    defaultValues: {
      name_ar: formData.name_ar,
      name_en: formData.name_en,
      subtitle_ar: formData.subtitle_ar,
      subtitle_en: formData.subtitle_en,
    }
  });

  const watchedValues = watch();

  const onSubmit = (data: BasicInfoFormData) => {
    updateFormData(data);
    clearErrors();
    nextStep();
  };

  const onError = (formErrors: FieldErrors<BasicInfoFormData>) => {
    const errorMessages: Record<string, string> = {};
    Object.keys(formErrors).forEach(key => {
      const error = formErrors[key as keyof BasicInfoFormData];
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Basic Information
        </h2>
        <p className="text-gray-600">
          Tell us about your place in both Arabic and English
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Place Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Place Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name_en')}
              type="text"
              placeholder="Enter place name in English"
              className={`
                w-full px-4 py-3 border-2 rounded-lg transition-colors duration-200
                focus:outline-none focus:ring-0
                ${errors.name_en 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
            {errors.name_en && (
              <p className="text-red-500 text-sm">{errors.name_en.message}</p>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>English name of the place</span>
              <span>{watchedValues.name_en?.length || 0}/200</span>
            </div>
          </div>

          {/* Arabic Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Place Name (Arabic) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name_ar')}
              type="text"
              placeholder="أدخل اسم المكان بالعربية"
              dir="rtl"
              className={`
                w-full px-4 py-3 border-2 rounded-lg transition-colors duration-200
                focus:outline-none focus:ring-0
                ${errors.name_ar 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
            {errors.name_ar && (
              <p className="text-red-500 text-sm">{errors.name_ar.message}</p>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>الاسم العربي للمكان</span>
              <span>{watchedValues.name_ar?.length || 0}/200</span>
            </div>
          </div>
        </div>

        {/* Subtitles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English Subtitle */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Subtitle (English)
              <span className="text-sm font-normal text-gray-500 ml-1">(Optional)</span>
            </label>
            <input
              {...register('subtitle_en')}
              type="text"
              placeholder="A brief tagline or subtitle"
              className="
                w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                transition-colors duration-200 focus:outline-none 
                focus:border-blue-500 focus:ring-0
              "
            />
            <p className="text-xs text-gray-500">
              A short tagline that describes your place
            </p>
          </div>

          {/* Arabic Subtitle */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Subtitle (Arabic)
              <span className="text-sm font-normal text-gray-500 ml-1">(اختياري)</span>
            </label>
            <input
              {...register('subtitle_ar')}
              type="text"
              placeholder="عنوان فرعي قصير"
              dir="rtl"
              className="
                w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                transition-colors duration-200 focus:outline-none 
                focus:border-blue-500 focus:ring-0
              "
            />
            <p className="text-xs text-gray-500">
              عنوان قصير يصف مكانك
            </p>
          </div>
        </div>

        {/* Preview Card */}
        {(watchedValues.name_en || watchedValues.name_ar) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Preview</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="space-y-2">
                {watchedValues.name_en && (
                  <h4 className="text-lg font-bold text-gray-900">
                    {watchedValues.name_en}
                  </h4>
                )}
                {watchedValues.name_ar && (
                  <h4 className="text-lg font-bold text-gray-900" dir="rtl">
                    {watchedValues.name_ar}
                  </h4>
                )}
                {(watchedValues.subtitle_en || watchedValues.subtitle_ar) && (
                  <div className="space-y-1">
                    {watchedValues.subtitle_en && (
                      <p className="text-sm text-gray-600">{watchedValues.subtitle_en}</p>
                    )}
                    {watchedValues.subtitle_ar && (
                      <p className="text-sm text-gray-600" dir="rtl">{watchedValues.subtitle_ar}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={prevStep}
          className="
            px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg 
            font-semibold hover:bg-gray-50 transition-colors duration-200 
            flex items-center space-x-2
          "
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <button
          type="submit"
          disabled={!isValid}
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