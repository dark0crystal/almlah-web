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
        <button 
          onClick={toggleMenu} 
          className="relative z-50 text-gray-700 bg-[#fbda5f] hover:bg-[#f6bf0c] rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <div className="relative">
            {isOpen ? (
              <X className="h-6 w-6 transition-transform duration-200" />
            ) : (
              <Menu className="h-6 w-6 transition-transform duration-200" />
            )}
          </div>
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
          className={`fixed top-0 ${direction === 'rtl' ? 'right-0' : 'left-0'} h-screen w-80 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out xl:hidden ${
            isOpen ? 'translate-x-0' : direction === 'rtl' ? 'translate-x-full' : '-translate-x-full'
          }`}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#f3f3eb] to-[#fbda5f]">
          <h2 className="text-2xl font-bold text-gray-800">Menu</h2>
          <button 
            onClick={toggleMenu} 
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* Main Navigation */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                Navigation
              </h3>
              <div className="space-y-2">
                {navLinks.map((navLink, index) => (
                  <Link key={index} href={navLink.direction} onClick={closeMenu}>
                    <div className="flex items-center space-x-4 px-4 py-3 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 shadow-sm hover:shadow-md group">
                      <div className="w-6 h-6 flex-shrink-0 text-gray-600 group-hover:text-blue-600 transition-colors">
                        {getIcon(navLink.direction)}
                      </div>
                      <span className="text-gray-800 font-medium group-hover:text-blue-700 transition-colors">{navLink.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Dashboard Section */}
            <div className="mb-6">
              <button
                onClick={toggleDashboard}
                className="flex items-center justify-between w-full px-2 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                <span>Dashboard</span>
                <div className={`p-1 rounded-full transition-all duration-200 ${showDashboard ? 'rotate-180 bg-gray-200' : 'hover:bg-gray-200'}`}>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {showDashboard && (
                <div className="mt-3 space-y-2 pl-4">
                  {dashboardLinks.map((dashLink, index) => (
                    <Link key={index} href={dashLink.direction} onClick={closeMenu}>
                      <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all duration-200 shadow-sm group">
                        <div className="w-4 h-4 flex-shrink-0 text-gray-500 group-hover:text-orange-600 transition-colors">
                          {getIcon(dashLink.direction)}
                        </div>
                        <span className="text-gray-700 text-sm group-hover:text-orange-700 transition-colors">{dashLink.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Language Change */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="flex items-center justify-center">
            <LanguageChange />
          </div>
        </div>
        </div>
      )}
    </>
  );
}