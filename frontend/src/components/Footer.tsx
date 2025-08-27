'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const brandT = useTranslations('Links');
  
  return (
    <footer 
      className="mt-20 py-12 border-t border-gray-300"
      style={{ backgroundColor: '#f3f3eb' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              {brandT('brand')}
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              اكتشف جمال سلطنة عُمان. دليلك الشامل للمطاعم والوجهات السياحية والأماكن المميزة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">
              {t('quickLinks')}
            </h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <a href="/" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
                  {t('home')}
                </a>
              </li>
              <li>
                <a href="/places" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
                  {t('places')}
                </a>
              </li>
              <li>
                <a href="/restaurants" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
                  {t('restaurants')}
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">
              {t('categories')}
            </h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
                  {t('tourism')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
                  {t('hiking')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
                  {t('recipes')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-300 mt-6 sm:mt-8 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-gray-600 text-xs sm:text-sm text-center sm:text-left">
              © 2025 {brandT('brand')}. {t('rightsReserved')}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors">
                {t('privacyPolicy')}
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors">
                {t('termsOfUse')}
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors">
                {t('contactUs')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}