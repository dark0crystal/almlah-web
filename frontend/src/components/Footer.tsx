'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const brandT = useTranslations('Links');
  
  return (
    <footer 
      className="h-[60vh] mt-20 rounded-t-3xl text-white relative overflow-hidden"
      style={{ backgroundColor: '#f5e6a8' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
        <div className="absolute top-20 right-20 w-20 h-20 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 border-2 border-white rounded-full"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Main Hero Section */}
        <div className="flex-1 flex items-center justify-center text-center px-6">
          <div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-gray-800 mb-4 animate-pulse">
              {t('readyText')}
            </h1>
            <div className="w-24 h-1 bg-gray-700 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand Section */}
              <div className="col-span-1 md:col-span-2">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  {brandT('brand')}
                </h2>
                <p className="text-gray-700 mb-6 leading-relaxed max-w-md">
                  اكتشف جمال سلطنة عُمان. دليلك الشامل للمطاعم والوجهات السياحية والأماكن المميزة.
                </p>
                <div className="flex space-x-4 space-x-reverse">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors cursor-pointer">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors cursor-pointer">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors cursor-pointer">
                    <Phone size={20} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {t('quickLinks')}
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                      {t('home')}
                    </a>
                  </li>
                  <li>
                    <a href="/places" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                      {t('places')}
                    </a>
                  </li>
                  <li>
                    <a href="/restaurants" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                      {t('restaurants')}
                    </a>
                  </li>
                  <li>
                    <a href="/destinations" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                      {t('destinations')}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {t('categories')}
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                      {t('tourism')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                      {t('hiking')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                      {t('recipes')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                      {t('generalInfo')}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-600 pt-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-gray-700 text-sm mb-4 md:mb-0 font-medium">
                  © 2025 {brandT('brand')}. {t('rightsReserved')}
                </div>
                <div className="flex space-x-6 space-x-reverse text-sm">
                  <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                    {t('privacyPolicy')}
                  </a>
                  <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                    {t('termsOfUse')}
                  </a>
                  <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                    {t('contactUs')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}