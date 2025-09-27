"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SplashScreen from '@/components/splash/SplashScreen';
import { FirstVisitModal } from '@/components/modals/FirstVisitModal';
import { useFirstVisit } from '@/hooks/useFirstVisit';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { Car } from '@/types';
import FloatingWelcomeCard from '@/components/FloatingWelcomeCard';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
}

export default function ClientLayoutWrapper({ children, navbar }: ClientLayoutWrapperProps) {
  const pathname = usePathname();
  const isMainPage = pathname === '/ar' || pathname === '/en' || pathname === '/';
  const isDashboardPage = pathname.includes('/dashboard');
  const [showSplash, setShowSplash] = useState(isMainPage);
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const { isFirstVisit, isLoading, markAsVisited } = useFirstVisit();

  const handleSplashComplete = () => {
    setShowSplash(false);
    console.log('Splash complete, isFirstVisit:', isFirstVisit, 'isLoading:', isLoading);
    // Show welcome card for returning users after splash
    if (!isFirstVisit && !isLoading) {
      setShowWelcomeCard(true);
    }
  };

  const handleCarSelect = (car: Car) => {
    console.log('Selected car:', car);
    // You can store the selected car in localStorage or state management
    localStorage.setItem('selected_car', JSON.stringify(car));
    markAsVisited();
  };

  const handleModalClose = () => {
    markAsVisited();
  };

  const handleWelcomeCardClose = () => {
    setShowWelcomeCard(false);
  };

  // Debug logging
  useEffect(() => {
    console.log('ClientLayoutWrapper - isFirstVisit changed:', isFirstVisit, 'isLoading:', isLoading);
  }, [isFirstVisit, isLoading]);

  // Show welcome card for users visiting any page (except dashboard) for the first time
  useEffect(() => {
    if (!isLoading && !isDashboardPage && !showSplash) {
      // Check if user has seen the welcome card before (persistent across sessions)
      const hasSeenWelcomeCard = localStorage.getItem('hasSeenWelcomeCard');
      if (hasSeenWelcomeCard !== 'true') {
        setShowWelcomeCard(true);
      }
    }
  }, [isLoading, isDashboardPage, showSplash]);

  // Show splash screen only on main page
  if (showSplash && isMainPage) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Don't show anything while checking first visit status
  if (isLoading) {
    return null;
  }

  // Normal app layout
  const showModal = !isLoading && isFirstVisit === true;
  console.log('Rendering layout - showModal:', showModal, 'isFirstVisit:', isFirstVisit, 'isLoading:', isLoading);
  
  return (
    <AuthInitializer>
      {!isDashboardPage && navbar}
      {children}
      
      {/* First visit modal */}
      <FirstVisitModal
        isOpen={showModal}
        onClose={handleModalClose}
        onCarSelect={handleCarSelect}
      />

      {/* Welcome card for returning users */}
      {showWelcomeCard && (
        <FloatingWelcomeCard onClose={handleWelcomeCardClose} />
      )}
    </AuthInitializer>
  );
}