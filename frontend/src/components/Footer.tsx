import { useTranslations } from 'next-intl';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('Links');
  
  return (
    <footer className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-bold text-emerald-300 mb-4">
              {t('brand')}
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              اكتشف جمال المنطقة الشرقية من المملكة العربية السعودية. دليلك الشامل للمطاعم والوجهات السياحية والأماكن المميزة.
            </p>
            <div className="flex space-x-4 space-x-reverse">
              <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                <MapPin size={20} />
              </div>
              <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                <Mail size={20} />
              </div>
              <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                <Phone size={20} />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-emerald-300">
              روابط سريعة
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/" className="text-gray-300 hover:text-emerald-300 transition-colors">
                  الرئيسية
                </a>
              </li>
              <li>
                <a href="/places" className="text-gray-300 hover:text-emerald-300 transition-colors">
                  الأماكن
                </a>
              </li>
              <li>
                <a href="/restaurants" className="text-gray-300 hover:text-emerald-300 transition-colors">
                  المطاعم
                </a>
              </li>
              <li>
                <a href="/destinations" className="text-gray-300 hover:text-emerald-300 transition-colors">
                  الوجهات
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-emerald-300">
              الفئات
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-300 transition-colors">
                  السياحة
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-300 transition-colors">
                  المشي لمسافات طويلة
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-300 transition-colors">
                  الوصفات
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-300 transition-colors">
                  معلومات عامة
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-emerald-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 {t('brand')}. جميع الحقوق محفوظة.
            </div>
            <div className="flex space-x-6 space-x-reverse text-sm">
              <a href="#" className="text-gray-400 hover:text-emerald-300 transition-colors">
                سياسة الخصوصية
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-300 transition-colors">
                شروط الاستخدام
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-300 transition-colors">
                اتصل بنا
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}