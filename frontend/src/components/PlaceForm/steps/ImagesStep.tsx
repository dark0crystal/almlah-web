"use client"
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePlaceStore, PlaceImage } from '../../../stores/usePlaceStore';
import { imagesSchema, ImagesFormData } from '../../../schemas/placeSchemas';
import { ChevronLeftIcon, ChevronRightIcon, PhotoIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export const ImagesStep: React.FC = () => {
  const {
    formData,
    updateFormData,
    nextStep,
    prevStep,
    addImage,
    removeImage,
    updateImage,
    setPrimaryImage,
    setErrors,
    clearErrors
  } = usePlaceStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    handleSubmit,
    formState: { errors }
  } = useForm<ImagesFormData>({
    // resolver: zodResolver(imagesSchema),
    defaultValues: {
      images: formData.images
    }
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        const newImage: PlaceImage = {
          url: '',
          alt_text: '',
          is_primary: formData.images.length === 0,
          display_order: formData.images.length,
          file,
          preview
        };
        addImage(newImage);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const onSubmit = (data: ImagesFormData) => {
    updateFormData(data);
    clearErrors();
    nextStep();
  };

  const onError = () => {
    setErrors({ images: 'Please add at least one image' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Photos</h2>
        <p className="text-gray-600">
          Show off your place with high-quality photos. The first image will be your main photo.
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Drop photos here or click to browse
        </h3>
        <p className="text-gray-600 mb-4">
          Support: JPG, PNG, WebP. Max size: 10MB per image.
        </p>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Choose Files
        </button>
      </div>

      {errors.images && (
        <p className="text-red-500 text-sm text-center">{errors.images.message}</p>
      )}

      {/* Image Preview Grid */}
      {formData.images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Photos ({formData.images.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.preview || image.url}
                    alt={image.alt_text}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title={image.is_primary ? 'Main photo' : 'Set as main photo'}
                    >
                      {image.is_primary ? (
                        <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <StarIcon className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Remove photo"
                    >
                      <XMarkIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1">
                      <StarSolidIcon className="w-3 h-3" />
                      <span>Main</span>
                    </div>
                  </div>
                )}

                {/* Alt Text Input */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Image description (optional)"
                    value={image.alt_text}
                    onChange={(e) => updateImage(index, { alt_text: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>💡 Tip: Set your best photo as the main photo by clicking the star icon</p>
          </div>
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
          disabled={formData.images.length === 0}
          className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
        >
          <span>Continue</span>
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};