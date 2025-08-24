'use client'
import React from 'react'
import GalleryMotion from './GalleryMotion'
import TitleMotion from './TitleMotion'
import Galleries from './Galleries'
import Footer from './Footer'


const page = () => {
  
  return (
    <div>
      <GalleryMotion/>
      <TitleMotion/>
      <Galleries/>
      <Footer/>
    </div>
    
  )
}

export default page