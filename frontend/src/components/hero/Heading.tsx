import Image from 'next/image';
import samhah from "../../../public/samhah.png"
import chai from "../../../public/chai.png"
import alryam from "../../../public/alryam.png"


export default function Heading() {
  return (
    <div className="relative w-[88vw] h-[60vh] m-16 rounded-3xl overflow-hidden bg-[#fce7a1] flex items-center justify-center">
      
      {/* Overlapping Images Background - Positioned at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 z-0">
        
        {/* Image 1 - Far Left */}
        <div className="absolute bottom-4 left-8">
          <Image
            src={samhah}
            alt="Image 1"
            width={120}
            height={160}
            className="rounded-2xl object-cover"
          />
        </div>

        {/* Image 2 - Left Center, overlapping Image 1 */}
        <div className="absolute bottom-8 left-24 z-10">
          <Image
            src={samhah}
            alt="Image 2"
            width={140}
            height={180}
            className="rounded-2xl object-cover"
          />
        </div>

        {/* Image 3 - Center Left, overlapping Image 2 */}
        <div className="absolute bottom-2 left-40 z-20">
          <Image
            src={samhah}
            alt="Image 3"
            width={130}
            height={170}
            className="rounded-2xl object-cover"
          />
        </div>

        {/* Image 4 - Center, highest z-index */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <Image
            src={samhah}
            alt="Image 4"
            width={150}
            height={190}
            className="rounded-2xl object-cover"
          />
        </div>

        {/* Image 5 - Center Right, overlapping Image 4 */}
        <div className="absolute bottom-1 right-40 z-20">
          <Image
            src={samhah}
            alt="Image 5"
            width={135}
            height={175}
            className="rounded-2xl object-cover"
          />
        </div>

        {/* Image 6 - Right Center, overlapping Image 5 */}
        <div className="absolute bottom-7 right-24 z-10">
          <Image
            src={alryam}
            alt="Image 6"
            width={125}
            height={165}
            className="rounded-2xl object-cover"
          />
        </div>

        {/* Image 7 - Far Right */}
        <div className="absolute bottom-3 right-8">
          <Image
            src={chai}
            alt="Image 7"
            width={115}
            height={155}
            className="rounded-2xl object-cover"
          />
        </div>

        {/* Additional smaller images for more overlap effect */}
        {/* Image 8 - Behind center left */}
        <div className="absolute bottom-12 left-32 z-5">
          <Image
            src={samhah}
            alt="Image 8"
            width={100}
            height={130}
            className="rounded-2xl object-cover"
          />
        </div>

        {/* Image 9 - Behind center right */}
        <div className="absolute bottom-10 right-32 z-5">
          <Image
            src={chai}
            alt="Image 9"
            width={110}
            height={140}
            className="rounded-2xl object-cover"
          />
        </div>

        {/* Image 10 - Small accent behind far left */}
        <div className="absolute bottom-16 left-16">
          <Image
            src={chai}
            alt="Image 10"
            width={80}
            height={110}
            className="rounded-xl object-cover"
          />
        </div>

        {/* Image 11 - Small accent behind far right */}
        <div className="absolute bottom-14 right-16">
          <Image
            src={alryam}
            alt="Image 11"
            width={85}
            height={115}
            className="rounded-xl object-cover"
          />
        </div>

        {/* Subtle gradient overlay to blend images with background */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#fce7a1]/20 to-[#fce7a1]/60 z-40"></div>
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