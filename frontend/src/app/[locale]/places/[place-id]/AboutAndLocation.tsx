import React from 'react';

export default function AboutAndLocation() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto  py-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            نبذة عن الراشد مول
          </h1>
          {/* share button */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Section */}
            <div className=" rounded-2xl  p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                الماركات العالمية ومتاجر الجمال
              </h2>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                يتميز الراشد مول وجهة تسوق فريدة تناسب الجميع، إذ يضم مجموعة من المتاجر الفاخرة والشهيرة والمرافق المتنوعة، بالإضافة إلى
                سينما ومنطقة مخصصة للأطفال. تم بناء المول على منطقة مرتفعة بتصميم هندسي استثنائي مع بحيرة توسط المجاري في الدور
                الأرضي وتحتوي على شلالات جذابة، مما يوفر لزواره تجربة تسوق متكاملة والاستمتاع بالإطلالات المميزة مع الثقافة والأهداف.
              </p>
            </div>
          </div>

          {/* Left Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">المعلومات</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">الموقع:</span>
                    <span className="text-gray-600 text-sm">عسير</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">العمر:</span>
                    <span className="text-gray-600 text-sm">الجميع</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Suitable For Tags */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">مناسب لـ</h3>
              <div className="flex flex-wrap gap-2">
                <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  👨‍👩‍👧‍👦 أصدقاء
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  🎭 العائلات
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  🛍️ التسوق
                </span>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">ساعات العمل</h3>
                <button className="text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                يومياً 9:00 صباحاً إلى 11:00 مساء
              </p>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="h-48 md:h-64 bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">خريطة الموقع</p>
                  </div>
                </div>
                {/* Google Maps attribution */}
                <div className="absolute bottom-2 right-2">
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">Google</span>
                </div>
              </div>
              
              {/* Location Button */}
              <div className="p-4">
                <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                  📍 الموقع
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}