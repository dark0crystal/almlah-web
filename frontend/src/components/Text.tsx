'use client';

import React from 'react'
import Image from 'next/image'

export default function Text() {
  return (
    <div className="absolute flex flex-col w-[90vw] md:w-[80vw] items-center text-white">
      {/* Big Screens Design (md and above) */}
      <div className="hidden md:flex flex-col text-[4.5vw] lg:text-[4vw] uppercase leading-tight gap-6">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span>الـمـلاح، رفـيـقـك</span>
          <div className="relative w-16 h-12 lg:w-20 lg:h-14 overflow-hidden rounded-xl bg-gray-200 flex-shrink-0 shadow-md">
            <Image 
              src="/gallery-alkhalil/img1.jpg" 
              alt="مكان جميل"
              fill
              className="object-cover"
            />
          </div>
          <span>إلـي يعرف كــل مــكان</span>
        </div>
        
        <div className="flex items-center justify-end gap-4 flex-wrap self-end">
          <span>نــجـمـع لــك أماكن سياحية،</span>
          <div className="relative w-16 h-12 lg:w-20 lg:h-14 overflow-hidden rounded-xl bg-gray-200 flex-shrink-0 shadow-md">
            <Image 
              src="/gallery-alkhalil/img10.jpg" 
              alt="أماكن سياحية"
              fill
              className="object-cover"
            />
          </div>
          <span>كافيهات، مـطاعـم</span>
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span>و زوايــا مـا تـحـصلهــا فـي</span>
          <div className="relative w-16 h-12 lg:w-20 lg:h-14 overflow-hidden rounded-xl bg-gray-200 flex-shrink-0 shadow-md">
            <Image 
              src="/gallery-alkhalil/img12.jpg" 
              alt="زوايا مخفية"
              fill
              className="object-cover"
            />
          </div>
          <span>الـخـرائـط</span>
        </div>

        <div className="flex items-center justify-end gap-4 flex-wrap self-end">
          <span>فـريق الـمـلاح@٢٠٢٥</span>
        </div>
      </div>

      {/* Small Screens Design (below md) */}
      <div className="md:hidden flex flex-col text-[6vw] sm:text-[5vw] uppercase leading-tight gap-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span>الـمـلاح، رفـيـقـك</span>
            <div className="relative w-12 h-8 sm:w-14 sm:h-10 overflow-hidden rounded-lg bg-gray-200 flex-shrink-0 shadow-md">
              <Image 
                src="/gallery-alkhalil/img1.jpg" 
                alt="مكان جميل"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="text-center">
            <span>إلـي يعرف كــل مــكان</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span>نــجـمـع لــك أماكن سياحية،</span>
            <div className="relative w-12 h-8 sm:w-14 sm:h-10 overflow-hidden rounded-lg bg-gray-200 flex-shrink-0 shadow-md">
              <Image 
                src="/gallery-alkhalil/img10.jpg" 
                alt="أماكن سياحية"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="text-center">
            <span>كافيهات، مـطاعـم</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span>و زوايــا مـا تـحـصلهــا فـي</span>
            <div className="relative w-12 h-8 sm:w-14 sm:h-10 overflow-hidden rounded-lg bg-gray-200 flex-shrink-0 shadow-md">
              <Image 
                src="/gallery-alkhalil/img12.jpg" 
                alt="زوايا مخفية"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="text-center">
            <span>الـخـرائـط</span>
          </div>
        </div>

        <div className="text-center mt-4">
          <span>فـريق الـمـلاح@٢٠٢٥</span>
        </div>
      </div>
    </div>
  )
}