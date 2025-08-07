"use client"
import React, { useEffect } from 'react';
import { usePlaceStore } from '../../stores/usePlaceStore';
import { StepIndicator } from './steps/StepIndicator';
import { CategorySelectionStep } from './steps/CategorySelectionStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { LocationStep } from './steps/LocationStep';
import { DescriptionContentStep } from './steps/DescriptionContentStep';
import { ImagesStep } from './steps/ImagesStep';
import { PropertiesContactStep } from './steps/PropertiesContactStep';
import { OverviewStep } from './steps/OverviewStep';
import { SuccessStep } from './steps/SuccessStep';

const STEP_TITLES = {
  1: { en: 'Choose Place Type', ar: 'اختر نوع المكان' },
  2: { en: 'Basic Information', ar: 'المعلومات الأساسية' },
  3: { en: 'Location', ar: 'الموقع' },
  4: { en: 'Description & Content', ar: 'الوصف والمحتوى' },
  5: { en: 'Photos', ar: 'الصور' },
  6: { en: 'Properties & Contact', ar: 'الخصائص والاتصال' },
  7: { en: 'Review & Submit', ar: 'مراجعة وإرسال' },
  8: { en: 'Success!', ar: 'تم بنجاح!' }
};

const AddPlaceForm: React.FC = () => {
  const { currentStep, resetForm } = usePlaceStore();

  useEffect(() => {
    // Reset form when component mounts
    return () => {
      resetForm();
    };
  }, [resetForm]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CategorySelectionStep />;
      case 2:
        return <BasicInfoStep />;
      case 3:
        return <LocationStep />;
      case 4:
        return <DescriptionContentStep />;
      case 5:
        return <ImagesStep />;
      case 6:
        return <PropertiesContactStep />;
      case 7:
        return <OverviewStep />;
      case 8:
        return <SuccessStep />;
      default:
        return <CategorySelectionStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Add New Place
          </h1>
          <p className="text-lg text-gray-600">
            {STEP_TITLES[currentStep as keyof typeof STEP_TITLES]?.en}
          </p>
        </div>

        {/* Step Indicator */}
        {currentStep < 8 && <StepIndicator />}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            {renderStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  );
};

export default AddPlaceForm;