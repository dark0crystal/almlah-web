import Header from "@/components/Header";
import ImagesContainer from "./ImagesContainer";
import AboutAndLocation from "./AboutAndLocation";

export default function PlaceDetails() {
  return (
    <div className="bg-white text-black">
      {/* Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
       
        {/* Title & Description */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">سد وادي ضيقة</h1>
          <p className="text-lg text-gray-700">
            سد لحفظ مياه الأودية، ويتميز بجماله الطبيعي، وتنتشر حوله العديد من أشجار السدر.
          </p>
        </div>

        {/* Image Gallery */}
        <ImagesContainer />

        <AboutAndLocation/>
        <div className="h-screen"/>
      </div>
    </div>
  );
}
