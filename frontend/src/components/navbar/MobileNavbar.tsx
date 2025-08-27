'use client';

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Menu, X, Home, MapPin, Utensils, Map, Dice6, Info, Settings, Images } from "lucide-react";
import LanguageChange from "./LangChange";
import { useLocale, useTranslations } from "next-intl";

type MobileMenuProps = {
  navLinks: { direction: string; name: string }[];
  dashboardLinks: { direction: string; name: string }[];
};

export default function MobileMenu({ navLinks, dashboardLinks }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const pathname = usePathname();
  const locale = useLocale().substring(0, 2);
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const t = useTranslations('navbar');

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setShowDashboard(false);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setShowDashboard(false);
  };

  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  // Close menu when pathname changes (navigation occurs)
  useEffect(() => {
    setIsOpen(false);
    setShowDashboard(false);
  }, [pathname]);

  const getIcon = (href: string) => {
    const iconClass = "w-full h-full";
    if (href === "/") return <Home className={iconClass} />;
    if (href === "/places") return <MapPin className={iconClass} />;
    if (href === "/restaurants") return <Utensils className={iconClass} />;
    if (href === "/destinations") return <Map className={iconClass} />;
    if (href === "/the-gallery") return <Images className={iconClass} />;
    if (href === "/zatar") return <Dice6 className={iconClass} />;
    if (href === "/about-us") return <Info className={iconClass} />;
    if (href.includes("/dashboard")) return <Settings className={iconClass} />;
    return <MapPin className={iconClass} />;
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="xl:hidden relative">
        <button onClick={toggleMenu} className="text-gray-700 bg-[#fbda5f] rounded-full p-2">
          {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* Sidebar - Only render when open */}
      {isOpen && (
        <div
          className={`fixed top-0 ${direction === 'rtl' ? 'right-0' : 'left-0'} h-screen w-72 sm:w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out xl:hidden ${
            isOpen ? 'translate-x-0' : direction === 'rtl' ? 'translate-x-full' : '-translate-x-full'
          }`}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-[#f3f3eb]">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">{t('home')}</h2>
          <button onClick={toggleMenu} className="text-gray-600 hover:text-gray-800">
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 space-y-1 sm:space-y-2">
            {/* Main Navigation */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">
                Navigation
              </h3>
              {navLinks.map((navLink, index) => (
                <Link key={index} href={navLink.direction} onClick={closeMenu}>
                  <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                      {getIcon(navLink.direction)}
                    </div>
                    <span className="text-sm sm:text-base text-gray-800 font-medium truncate">{navLink.name}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Dashboard Section */}
            <div className="mb-4 sm:mb-6">
              <button
                onClick={toggleDashboard}
                className="flex items-center justify-between w-full px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700"
              >
                <span>Dashboard</span>
                <svg
                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${showDashboard ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDashboard && (
                <div className="mt-1 sm:mt-2 space-y-1 pl-3 sm:pl-4">
                  {dashboardLinks.map((dashLink, index) => (
                    <Link key={index} href={dashLink.direction} onClick={closeMenu}>
                      <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0">
                          {getIcon(dashLink.direction)}
                        </div>
                        <span className="text-gray-700 text-xs sm:text-sm truncate">{dashLink.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Language Change */}
        <div className="border-t border-gray-200 p-3 sm:p-4">
          <div className="scale-90 sm:scale-100 origin-left">
            <LanguageChange />
          </div>
        </div>
        </div>
      )}
    </>
  );
}