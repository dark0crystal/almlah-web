import Image from 'next/image';
import samhah from "../../../public/samhah.png"
import chai from "../../../public/chai.png"
import alryam from "../../../public/alryam.png"
import khayma from "../../../public/khayma.png"
import rb3 from "../../../public/rb3.png"
import alsahwah from "../../../public/alsahwah.png"
import shbaboman from "../../../public/pngs/shbaboman.png"

export default function Heading() {
  // Image data for easier management
  const images = [
    { src: samhah, alt: "Samhah", width: 120, height: 160 },
    { src: chai, alt: "Chai", width: 130, height: 170 },
    { src: alryam, alt: "Al Ryam", width: 140, height: 180 },
    { src: khayma, alt: "Khayma", width: 150, height: 190 },
    { src: alsahwah, alt: "Alsahwah", width: 135, height: 175 },
    { src: shbaboman, alt: "Shbaboman", width: 125, height: 165 },
    { src: rb3, alt: "Rb3", width: 115, height: 155 },
    { src: alsahwah, alt: "Alsahwah 2", width: 110, height: 145 },
  ];

  return (
    <div className="relative w-[88vw] h-[50vh] mt-8 mx-16 mb-0 rounded-3xl overflow-hidden bg-[#fce7a1] flex items-center justify-center">
      
      {/* Grain texture overlay */}
      <div 
        className="absolute inset-0 z-[1] opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          mixBlendMode: 'multiply'
        }}
      />
             
      {/* Static Images Background - Positioned at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 z-0">
        {/* Mobile: Show 3 images */}
        <div className="flex md:hidden justify-center items-end gap-2 h-full px-4">
          {images.slice(0, 3).map((image, index) => (
            <div
              key={`mobile-${index}`}
              className="flex-1 max-w-[100px]"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={100}
                height={130}
                className="rounded-t-2xl object-cover w-full"
              />
            </div>
          ))}
        </div>

        {/* Tablet: Show 5 images */}
        <div className="hidden md:flex lg:hidden justify-center items-end gap-3 h-full px-6">
          {images.slice(0, 5).map((image, index) => (
            <div
              key={`tablet-${index}`}
              className="flex-1 max-w-[120px]"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="rounded-t-2xl object-cover w-full"
              />
            </div>
          ))}
        </div>

        {/* Desktop: Show 6 images */}
        <div className="hidden lg:flex xl:hidden justify-center items-end gap-4 h-full px-8">
          {images.slice(0, 6).map((image, index) => (
            <div
              key={`desktop-${index}`}
              className="flex-1 max-w-[140px]"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="rounded-t-2xl object-cover w-full"
              />
            </div>
          ))}
        </div>

        {/* Large Desktop: Show all 8 images */}
        <div className="hidden xl:flex justify-center items-end gap-4 h-full px-10">
          {images.map((image, index) => (
            <div
              key={`large-${index}`}
              className="flex-1 max-w-[150px]"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="rounded-t-2xl object-cover w-full"
              />
            </div>
          ))}
        </div>
       </div>

       {/* Background shape (like the football curve) */}
      <div className="absolute inset-0 z-5">
        {/* You can add your football curve shape here */}
      </div>
                          
      {/* Text */}
      <h1 className="relative z-10 text-black font-extrabold text-4xl md:text-6xl text-center leading-relaxed px-4">
        رفـــيـقــك إلــي يـعـرف كـل مــــكـــان
      </h1>
    </div>
  );
}