"use client";

import { useState, useEffect } from 'react';

const FIRST_VISIT_KEY = 'almlah_first_visit';

export function useFirstVisit() {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this is the user's first visit
    const checkFirstVisit = () => {
      try {
        const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
        console.log('Checking first visit - hasVisited value:', hasVisited);
        
        if (!hasVisited || hasVisited === null || hasVisited === 'null') {
          // First visit - don't mark as visited yet, wait for modal interaction
          console.log('Setting as first visit');
          setIsFirstVisit(true);
        } else {
          // Not first visit
          console.log('Setting as not first visit');
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
      console.log('Marking as visited in localStorage');
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
      setIsFirstVisit(false);
      console.log('Successfully marked as visited');
    } catch (error) {
      console.warn('Could not mark as visited:', error);
    }
  };

  const resetFirstVisit = () => {
    try {
      console.log('Resetting first visit status');
      localStorage.removeItem(FIRST_VISIT_KEY);
      setIsFirstVisit(true);
      console.log('Successfully reset first visit status');
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