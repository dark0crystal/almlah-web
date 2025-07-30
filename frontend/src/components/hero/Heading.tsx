export default function Heading() {
  return (
    <div className="relative w-[88vw] h-[40vh] m-16 rounded-3xl overflow-hidden bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
      {/* Background shape (like the football curve) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-800/30 via-green-900/60 to-black/90 opacity-80" />

      {/* Overlay dark layer to give depth */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Text */}
      <h1 className="relative z-10 text-white font-extrabold text-4xl md:text-6xl text-center leading-relaxed">
        الــــمـــلاح ، <br className="md:hidden" />
        رفيق دربك إلي يدل كل مــــكـــان
      </h1>
    </div>
  );
}
