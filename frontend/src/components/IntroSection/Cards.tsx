import Image from 'next/image';
import samhah from "../../../public/samhah.png"

// Card1.tsx - Wide Card (Top)
export function WideCard() {
  return (
    <div className="relative w-full h-40 md:h-48 lg:h-56 bg-[#FFC00A] rounded-3xl overflow-hidden">
      {/* Yellow geometric shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-8 right-12 z-10 transform scale-[4] rotate-12">
          <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.77256 14.1251C3.1287 14.1251 2.65038 13.9688 2.33777 13.6564C2.02987 13.3486 1.87583 12.8729 1.87583 12.2292V10.7319C1.87583 10.6013 1.83157 10.4917 1.74288 10.4031L0.68604 9.33974C0.228617 8.88741 0 8.44205 0 8.00365C0 7.56525 0.228617 7.11744 0.685851 6.6604L1.74269 5.59706C1.83139 5.5084 1.87564 5.40111 1.87564 5.27518V3.77099C1.87564 3.12271 2.02968 2.64459 2.33758 2.33682C2.65019 2.02906 3.12851 1.87508 3.77237 1.87508H5.27025C5.40094 1.87508 5.51054 1.83085 5.59924 1.74219L6.66304 0.685812C7.12046 0.228777 7.56602 7.12149e-05 7.99991 7.12149e-05C8.4385 -0.00463467 8.88406 0.223883 9.33677 0.685624L10.4006 1.742C10.494 1.83066 10.6058 1.87489 10.7365 1.87489H12.2274C12.876 1.87489 13.3543 2.03113 13.6622 2.3436C13.9701 2.65607 14.1242 3.13193 14.1242 3.7708V5.27499C14.1242 5.40092 14.1709 5.50821 14.2641 5.59687L15.3209 6.66021C15.7735 7.11725 15.9998 7.56506 15.9998 8.00346C16.0045 8.44186 15.7782 8.88722 15.3209 9.33974L14.2641 10.4031C14.1707 10.4917 14.1242 10.6013 14.1242 10.7319V12.2292C14.1242 12.8774 13.9679 13.3556 13.6553 13.6633C13.3474 13.9711 12.8715 14.1251 12.2274 14.1251H10.7365C10.6058 14.1251 10.4938 14.1695 10.4006 14.258L9.33677 15.3213C8.88424 15.7736 8.43868 15.9999 7.99991 15.9999C7.56602 16.0046 7.12028 15.7783 6.66304 15.3213L5.59924 14.258C5.51054 14.1693 5.40094 14.1251 5.27025 14.1251H3.77237H3.77256Z" fill="#FFB800"/>
          </svg>
        </div>
      </div>

      {/* Image at bottom */}
      <div className="absolute bottom-0 left-8 z-20">
        <Image
          src={samhah}
          alt="Content image"
          width={80}
          height={60}
          className="md:w-[100px] md:h-[70px] lg:w-[120px] lg:h-[80px] object-cover rounded-t-xl"
        />
      </div>

      {/* Arabic Text */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 z-30">
        <h2 className="text-black font-black text-lg md:text-2xl lg:text-3xl text-right leading-tight">
          محتوى أكثر
          <br />
          في كل مكان
        </h2>
      </div>
    </div>
  );
}

export function SmallCard1() {
  return (
    <div className="relative w-full aspect-square bg-[#F5E6A8] rounded-3xl overflow-hidden">
      {/* Main text - at the top */}
      <div className="absolute top-2 md:top-4 lg:top-6 left-0 right-0 flex justify-center">
        <h3 className="text-3xl md:text-5xl lg:text-6xl font-black text-black z-40">
          مراحب
        </h3>
      </div>
      
      {/* First shadow - slightly below */}
      <div className="absolute top-6 md:top-12 lg:top-16 left-0 right-0 flex justify-center">
        <h3 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#E6D085] z-30">
          مراحب
        </h3>
      </div>
      
      {/* Second shadow - middle */}
      <div className="absolute top-10 md:top-20 lg:top-26 left-0 right-0 flex justify-center">
        <h3 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#E6D085] z-20">
          مراحب
        </h3>
      </div>
      
      {/* Third shadow - near bottom */}
      <div className="absolute top-14 md:top-28 lg:top-36 left-0 right-0 flex justify-center">
        <h3 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#E6D085] z-10">
          مراحب
        </h3>
      </div>
    </div>
  );
}

// Card3.tsx - Small Card (Bottom Right)
export function SmallCard2() {
  return (
    <div className="relative w-full aspect-square bg-white rounded-3xl overflow-hidden">
      

      {/* Image at bottom */}
      <div className="absolute bottom-0 right-4 z-20">
        <Image
          src={samhah}
          alt="Book image"
          width={70}
          height={50}
          className="object-cover rounded-t-xl"
        />
      </div>


      {/* Speaker icon */}
      <div className="absolute bottom-6 md:bottom-8 lg:bottom-12 left-4 z-20">
        <div className="text-black text-lg">🔊</div>
      </div>

      {/* Arabic Text */}
      <div className="absolute top-6 md:top-10 lg:top-16 right-4 left-4 z-30">
        <h3 className="text-black font-black text-sm md:text-lg lg:text-xl text-center leading-tight">
          كل يوم،مكان
          <br />
          سياحي جديد
        </h3>
      </div>
    </div>
  );
}

// Main wrapper component
export default function ArabicCardsLayout() {
  return (
    <div className="w-[88vw]">
      {/* Large screens: All cards horizontally */}
      <div className="hidden lg:flex lg:gap-6">
        {/* Wide card takes more space */}
        <div className="flex-grow">
          <WideCard />
        </div>
        
        {/* Small cards side by side */}
        <div className="flex gap-6">
          <div className="w-64">
            <SmallCard1 />
          </div>
          <div className="w-64">
            <SmallCard2 />
          </div>
        </div>
      </div>

      {/* Medium and small screens: Stack vertically */}
      <div className="lg:hidden space-y-6">
        {/* Wide card full width */}
        <WideCard />
        
        {/* Small cards side by side on medium, stack on mobile */}
        <div className="grid grid-cols-2 gap-2 md:gap-6">
          <SmallCard1 />
          <SmallCard2 />
        </div>
      </div>
    </div>
  );
}