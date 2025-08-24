'use client'
import React from 'react'
import { useTranslations } from 'next-intl'

const Footer = () => {
  const t = useTranslations('gallery')
  
  return (
    <footer className="bg-[#f3f3eb] py-6 mt-16">
      <div className="container mx-auto text-center">
        <p className="text-gray-700 text-sm">
         {t('footer')}
        </p>
      </div>
    </footer>
  )
}

export default Footer