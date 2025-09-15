export default function Heading() {
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