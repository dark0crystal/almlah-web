"use client"
import React from 'react';
import { usePlaceStore } from '../../../stores/usePlaceStore';
import { CheckIcon } from '@heroicons/react/24/solid';

const STEPS = [
  { number: 1, title: 'Type', icon: '🏷️' },
  { number: 2, title: 'Info', icon: '📝' },
  { number: 3, title: 'Location', icon: '📍' },
  { number: 4, title: 'Content', icon: '📄' },
  { number: 5, title: 'Photos', icon: '📸' },
  { number: 6, title: 'Properties', icon: '⚙️' },
  { number: 7, title: 'Review', icon: '✅' },
];

export const StepIndicator: React.FC = () => {
  const { currentStep, setCurrentStep } = usePlaceStore();

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepClasses = (status: string) => {
    const baseClasses = 'flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-200';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-emerald-500 text-white shadow-lg`;
      case 'current':
        return `${baseClasses} bg-blue-500 text-white shadow-lg ring-4 ring-blue-100`;
      case 'upcoming':
        return `${baseClasses} bg-gray-200 text-gray-500`;
      default:
        return baseClasses;
    }
  };

  const getConnectorClasses = (stepNumber: number) => {
    const baseClasses = 'flex-1 h-1 mx-2 rounded-full transition-all duration-300';
    
    if (stepNumber < currentStep) {
      return `${baseClasses} bg-emerald-500`;
    }
    return `${baseClasses} bg-gray-200`;
  };

  return (
    <div className="mb-8">
      {/* Desktop Step Indicator */}
      <div className="hidden md:flex items-center justify-between">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.number);
          
          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <button
                  onClick={() => {
                    // Allow navigation to completed steps only
                    if (step.number < currentStep) {
                      setCurrentStep(step.number);
                    }
                  }}
                  className={`${getStepClasses(status)} ${
                    step.number < currentStep ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                  }`}
                  disabled={step.number >= currentStep}
                >
                  {status === 'completed' ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-lg">{step.icon}</span>
                  )}
                </button>
                
                {/* Step Title */}
                <span className={`mt-2 text-xs font-medium ${
                  status === 'current' 
                    ? 'text-blue-600' 
                    : status === 'completed'
                    ? 'text-emerald-600'
                    : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              
              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div className={getConnectorClasses(step.number)} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={getStepClasses(getStepStatus(currentStep))}>
              {getStepStatus(currentStep) === 'completed' ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <span className="text-lg">{STEPS[currentStep - 1]?.icon}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Step {currentStep} of {STEPS.length}
              </p>
              <p className="text-xs text-gray-500">
                {STEPS[currentStep - 1]?.title}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1 mx-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
          
          <span className="text-sm font-medium text-gray-600">
            {Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100)}%
          </span>
        </div>

        {/* Mini Steps for Mobile */}
        <div className="flex justify-center space-x-1">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                step.number <= currentStep 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};