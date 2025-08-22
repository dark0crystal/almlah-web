"use client";

import { useState, useEffect } from 'react';

const FIRST_VISIT_KEY = 'almlah_first_visit';
const VEHICLE_SELECTED_KEY = 'almlah_vehicle_selected';

export function useFirstVisit() {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this is the user's first visit and if they've selected a vehicle
    const checkFirstVisit = () => {
      try {
        const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
        const vehicleSelected = localStorage.getItem(VEHICLE_SELECTED_KEY);
        console.log('Checking first visit - hasVisited value:', hasVisited);
        console.log('Checking vehicle selection - vehicleSelected value:', vehicleSelected);
        
        // Show modal if user hasn't visited OR hasn't selected a vehicle
        if (!hasVisited || hasVisited === null || hasVisited === 'null' || 
            !vehicleSelected || vehicleSelected === null || vehicleSelected === 'null') {
          console.log('Setting as first visit - need to show modal');
          setIsFirstVisit(true);
        } else {
          // Both visited and vehicle selected
          console.log('Setting as not first visit - modal already completed');
          setIsFirstVisit(false);
        }
      } catch (error) {
        // If localStorage is not available, assume first visit for better UX
        console.warn('localStorage not available:', error);
        setIsFirstVisit(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(checkFirstVisit, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const markAsVisited = () => {
    try {
      console.log('Marking as visited and vehicle selected in localStorage');
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
      localStorage.setItem(VEHICLE_SELECTED_KEY, 'true');
      setIsFirstVisit(false);
      console.log('Successfully marked as visited and vehicle selected');
    } catch (error) {
      console.warn('Could not mark as visited:', error);
    }
  };

  const resetFirstVisit = () => {
    try {
      console.log('Resetting first visit and vehicle selection status');
      localStorage.removeItem(FIRST_VISIT_KEY);
      localStorage.removeItem(VEHICLE_SELECTED_KEY);
      setIsFirstVisit(true);
      console.log('Successfully reset first visit and vehicle selection status');
    } catch (error) {
      console.warn('Could not reset first visit:', error);
    }
  };

  return {
    isFirstVisit,
    isLoading,
    markAsVisited,
    resetFirstVisit
  };
}