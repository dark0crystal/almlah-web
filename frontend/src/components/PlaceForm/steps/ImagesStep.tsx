// components/ImagesStep.tsx - Updated for post-place-creation upload
"use client";
import React, { useState, useEffect } from 'react';
import { usePlaceStore } from '../../../stores/usePlaceStore';
import { ImageUpload } from '../ImageUpload';
import { ExistingImage, ImageUploadConfig } from '../../../types/image';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';

export const ImagesStep: React.FC = () => {
  const {
    formData,
    createdPlace,
    currentStep,
    nextStep,
    prevStep,
    uploadPlaceImages,
    setErrors,
    clearErrors,
    errors
  } = usePlaceStore();

  const [placeImages, setPlaceImages] = useState<ExistingImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Image upload configuration for the created place
  const imageConfig: ImageUploadConfig = {
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    bucket: 'media-bucket',
    folder: createdPlace ? `places/${createdPlace.id}` : 'temp',
    allowReorder: true,
    allowSetPrimary: true,
    showMetadataFields: true
  };

  // Ensure we have a created place before showing image upload
  useEffect(() => {
    if (!createdPlace && currentStep === 7) {
      // If no place is created but we're on image step, go back
      prevStep();
    }
  }, [createdPlace, currentStep, prevStep]);

  const handleImagesChange = (images: ExistingImage[]) => {
    setPlaceImages(images);
    clearErrors();
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const handleSubmit = async () => {
    if (!createdPlace) {
      setErrors({ images: 'No place created. Please go back and submit the form first.' });
      return;
    }

    setIsUploadingImages(true);
    clearErrors();

    try {
      // Upload place images if any
      if (placeImages.length > 0) {
        const success = await uploadPlaceImages(placeImages);
        if (!success) {
          setIsUploadingImages(false);
          return;
        }
      }

      // Upload content section images if any
      for (const section of formData.content_sections) {
        if (section.images && section.images.length > 0) {
          // Convert content section images to ExistingImage format
          const sectionImages: ExistingImage[] = section.images.map((img, index) => ({
            id: img.id || `section-${section.id}-${index}`,
            path: '', // Will be set during upload
            url: img.image_url,
            alt_text: img.alt_text_ar || img.alt_text_en,
            caption: img.caption_ar || img.caption_en,
            is_primary: false,
            display_order: img.sort_order || index
          }));

          // Note: You'll need to implement uploadContentSectionImages in your store
          // or handle content section images separately
        }
      }

      // Success - move to final step
      nextStep();
    } catch (error) {
      console.error('Image upload error:', error);
      setErrors({ images: 'Failed to upload images. Please try again.' });
    } finally {
      setIsUploadingImages(false);
      setUploadProgress(0);
    }
  };

  const handleSkipImages = () => {
    clearErrors();
    nextStep(); // Skip to success step
  };

  if (!createdPlace) {
    return (
      <div className="text-center py-12">
        <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Place Not Created</h2>
        <p className="text-gray-600 mb-6">
          Please go back and submit the place information first.
        </p>
        <button
          onClick={prevStep}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Place Created Successfully!</h2>
        <p className="text-gray-600">
          <strong>{createdPlace.name_en}</strong> has been created. 
          Now you can add photos to showcase your place.
        </p>
      </div>

      {/* Success Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-green-800 font-semibold">Place Information Saved</h3>
            <p className="text-green-700 text-sm mt-1">
              Your place has been created with ID: <code className="bg-green-100 px-1 rounded">{createdPlace.id}</code>
            </p>
            <p className="text-green-700 text-sm mt-1">
              You can now add photos, or skip this step and add them later from your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Photos (Optional)</h3>
          <p className="text-gray-600 text-sm">
            Upload high-quality photos to make your place more attractive to visitors. 
            You can always add or change photos later.
          </p>
        </div>

        <ImageUpload
          config={imageConfig}
          existingImages={placeImages}
          onImagesChange={handleImagesChange}
          onUploadProgress={handleUploadProgress}
          disabled={isUploadingImages}
          className="border border-gray-200 rounded-lg p-6"
        />

        {/* Upload Progress */}
        {isUploadingImages && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-800 font-medium">Uploading Images</span>
              <span className="text-blue-600 text-sm">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.images && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{errors.images}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={prevStep}
          disabled={isUploadingImages}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <div className="space-x-3">
          <button
            type="button"
            onClick={handleSkipImages}
            disabled={isUploadingImages}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors duration-200"
          >
            Skip for Now
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploadingImages || (placeImages.length === 0)}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isUploadingImages ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>
                  {placeImages.length > 0 ? `Save ${placeImages.length} Photos` : 'Continue'}
                </span>
                <ChevronRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">💡 Pro Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Upload a cover photo to make your place stand out</li>
          <li>• Add multiple photos showing different angles and features</li>
          <li>• Use descriptive alt text for better accessibility</li>
          <li>• Photos are automatically optimized for fast loading</li>
          <li>• You can manage photos anytime from your dashboard</li>
        </ul>
      </div>
    </div>
  );
};