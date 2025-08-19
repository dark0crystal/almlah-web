import Image from 'next/image';
import samhah from "../../../public/samhah.png"
import chai from "../../../public/chai.png"
import alryam from "../../../public/alryam.png"
import khayma from "../../../public/khayma.png"
import rb3 from "../../../public/rb3.png"

export default function Heading() {
  // Image data for easier management
  const images = [
    { src: samhah, alt: "Samhah", width: 120, height: 160 },
    { src: samhah, alt: "Chai", width: 130, height: 170 },
    { src: samhah, alt: "Al Ryam", width: 140, height: 180 },
    { src: samhah, alt: "Khayma", width: 150, height: 190 },
    { src: samhah, alt: "Rb3", width: 135, height: 175 },
    { src: samhah, alt: "Samhah 2", width: 125, height: 165 },
    { src: samhah, alt: "Chai 2", width: 115, height: 155 },
    { src: samhah, alt: "Al Ryam 2", width: 110, height: 145 },
  ];

  return (
    <div className="relative w-[88vw] h-[60vh] m-16 mb-0 rounded-3xl overflow-hidden bg-[#fce7a1] flex items-center justify-center">
      
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

        {/* Subtle gradient overlay to blend images with background */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#fce7a1]/20 to-[#fce7a1]/60 z-40 pointer-events-none"></div>
      </div>

      {/* Background shape (like the football curve) */}
      <div className="absolute inset-0 z-5">
        {/* You can add your football curve shape here */}
      </div>
                   
      {/* Text */}
      <h1 className="relative z-50 text-black font-extrabold text-4xl md:text-6xl text-center leading-relaxed px-4">
        الــــمـــلاح ، <br className="md:hidden" />
        رفيق دربك إلي يدل كل مــــكـــان
      </h1>
    </div>
  );
}