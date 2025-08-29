"use client"
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlaceStore } from '../../../stores/usePlaceStore';
import { locationSchema, LocationFormData } from '../../../schemas/placeSchemas';
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from '@heroicons/react/24/outline';

export const LocationStep: React.FC = () => {
  const {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    governates,
    wilayahs,
    isLoadingGovernorates,
    isLoadingWilayahs,
    fetchGovernorates,
    fetchWilayahs,
    setErrors,
    clearErrors
  } = usePlaceStore();

  const [selectedGovernate, setSelectedGovernate] = useState<string>(formData.governate_id || '');
  const [mapCoordinates, setMapCoordinates] = useState<{lat: number; lng: number} | null>(
    formData.latitude && formData.longitude 
      ? { lat: formData.latitude, lng: formData.longitude }
      : null
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    mode: 'onChange',
    defaultValues: {
      governate_id: formData.governate_id,
      wilayah_id: formData.wilayah_id,
      latitude: formData.latitude,
      longitude: formData.longitude,
    }
  });

  const watchedGovernate = watch('governate_id');
  const watchedWilayah = watch('wilayah_id');

  useEffect(() => {
    fetchGovernorates();
  }, [fetchGovernorates]);

  useEffect(() => {
    if (watchedGovernate && watchedGovernate !== selectedGovernate) {
      setSelectedGovernate(watchedGovernate);
      fetchWilayahs(watchedGovernate);
      setValue('wilayah_id', ''); // Clear wilayah when governate changes
    }
  }, [watchedGovernate, selectedGovernate, fetchWilayahs, setValue]);


  const onSubmit = (data: LocationFormData) => {
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

  const getSelectedGovernateInfo = () => {
    return governates.find(g => g.id === watchedGovernate);
  };

  const getSelectedWilayahInfo = () => {
    return wilayahs.find(w => w.id === watchedWilayah);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Location Details
        </h2>
        <p className="text-gray-600">
          Help visitors find your place by providing accurate location information
        </p>
      </div>

      {/* Location Selection */}
      <div className="space-y-6">
        {/* Governate Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">
            Governate <span className="text-red-500">*</span>
          </label>
          
          {isLoadingGovernorates ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading governates...</span>
            </div>
          ) : (
            <select
              {...register('governate_id')}
              className={`
                w-full px-4 py-3 border-2 rounded-lg transition-colors duration-200
                focus:outline-none focus:ring-0 bg-white
                ${errors.governate_id 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            >
              <option value="">Select a governate</option>
              {governates.map((governate) => (
                <option key={governate.id} value={governate.id}>
                  {governate.name_en} - {governate.name_ar}
                </option>
              ))}
            </select>
          )}
          
          {errors.governate_id && (
            <p className="text-red-500 text-sm">{errors.governate_id.message}</p>
          )}
        </div>

        {/* Wilayah Selection */}
        {watchedGovernate && (
          <div className="space-y-3 animate-fadeIn">
            <label className="block text-sm font-semibold text-gray-900">
              Wilayah <span className="text-red-500">*</span>
            </label>
            
            {isLoadingWilayahs ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading wilayahs...</span>
              </div>
            ) : (
              <select
                {...register('wilayah_id')}
                className={`
                  w-full px-4 py-3 border-2 rounded-lg transition-colors duration-200
                  focus:outline-none focus:ring-0 bg-white
                  ${errors.wilayah_id 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-blue-500'
                  }
                `}
              >
                <option value="">Select a wilayah</option>
                {wilayahs.map((wilayah) => (
                  <option key={wilayah.id} value={wilayah.id}>
                    {wilayah.name_en} - {wilayah.name_ar}
                  </option>
                ))}
              </select>
            )}
            
            {errors.wilayah_id && (
              <p className="text-red-500 text-sm">{errors.wilayah_id.message}</p>
            )}
          </div>
        )}

        {/* Coordinates Section */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-900">
            Precise Location (Optional)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                {...register('latitude', { valueAsNumber: true })}
                type="number"
                step="any"
                placeholder="23.588"
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg 
                  focus:outline-none focus:border-blue-500 transition-colors duration-200
                "
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                {...register('longitude', { valueAsNumber: true })}
                type="number"
                step="any"
                placeholder="58.383"
                className="
                  w-full px-3 py-2 border border-gray-300 rounded-lg 
                  focus:outline-none focus:border-blue-500 transition-colors duration-200
                "
              />
            </div>
          </div>
          
          <p className="text-xs text-gray-500">
            Precise coordinates help visitors navigate to your exact location using maps
          </p>
        </div>

        {/* Location Preview */}
        {(getSelectedGovernateInfo() || getSelectedWilayahInfo()) && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <MapPinIcon className="w-4 h-4 mr-2" />
              Location Preview
            </h3>
            <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
              {getSelectedGovernateInfo() && (
                <div>
                  <span className="text-sm text-gray-600">Governate: </span>
                  <span className="font-medium text-gray-900">
                    {getSelectedGovernateInfo()?.name_en} - {getSelectedGovernateInfo()?.name_ar}
                  </span>
                </div>
              )}
              {getSelectedWilayahInfo() && (
                <div>
                  <span className="text-sm text-gray-600">Wilayah: </span>
                  <span className="font-medium text-gray-900">
                    {getSelectedWilayahInfo()?.name_en} - {getSelectedWilayahInfo()?.name_ar}
                  </span>
                </div>
              )}
              {mapCoordinates && (
                <div>
                  <span className="text-sm text-gray-600">Coordinates: </span>
                  <span className="font-medium text-gray-900 font-mono text-xs">
                    {mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Placeholder */}
        {mapCoordinates && (
          <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center border border-gray-200">
            <div className="text-center text-gray-600">
              <MapPinIcon className="w-12 h-12 mx-auto mb-2 text-blue-500" />
              <p className="font-medium">Map Preview</p>
              <p className="text-sm">
                Lat: {mapCoordinates.lat.toFixed(6)}, Lng: {mapCoordinates.lng.toFixed(6)}
              </p>
              <p className="text-xs mt-2">
                Interactive map would be displayed here in production
              </p>
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