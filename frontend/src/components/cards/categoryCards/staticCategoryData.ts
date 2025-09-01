// categoryData.ts
import rb3 from "../../../../public/rb3.png";
import chai from "../../../../public/chai.png"
// Import other images from your public folder
// import finjanImage from "../../../../public/finjan.png";
// import riyadhImage from "../../../../public/riyadh.png";
// import lastSoundImage from "../../../../public/last-sound.png";
// import shakraImage from "../../../../public/shakra.png";
// import audiobookImage from "../../../../public/audiobook.png";
// import cinemaImage from "../../../../public/cinema.png";
// import technologyImage from "../../../../public/technology.png";
// import sportsImage from "../../../../public/sports.png";

export interface CategoryData {
  title: string;
  subtitle?: string;
  icon?: string;
  bgColor: string;
  bgImage?: string | any; // Can be string URL or imported image
  textColor?: string;
  slug?: string; // Navigation route
  href?: string; // Custom href if different from slug-based routing
}

export const categoriesData: CategoryData[] = [
  {
    title: "الأماكن السياحية",
    subtitle: "استكشف الوجهات",
    icon: "🏛️",
    bgColor: "bg-gradient-to-br from-orange-400 to-pink-400",
    bgImage: rb3,
    slug: "tourism",
    href: "/places?category=tourism"
  },
  {
    title: "المطاعم",
    subtitle: "أفضل المطاعم",
    icon: "🍽️",
    bgColor: "bg-gradient-to-br from-green-500 to-emerald-600",
    bgImage: chai,
    href: "/restaurants"
  },
  {
    title: "زعتر",
    subtitle: "مكتشف المطاعم",
    icon: "🎲",
    bgColor: "bg-gradient-to-br from-purple-500 to-indigo-600",
    bgImage: chai,
    href: "/zatar"
  },
  {
    title: "المحافظات",
    subtitle: "استكشف عُمان",
    icon: "🗺️",
    bgColor: "bg-gradient-to-br from-blue-500 to-cyan-600",
    bgImage: chai,
    href: "/destinations"
  },
  {
    title: "ذا جاليري",
    subtitle: "معرض الصور",
    icon: "📸",
    bgColor: "bg-gradient-to-br from-pink-500 to-rose-600",
    bgImage: chai,
    href: "/the-gallery"
  },
  {
    title: "جميع الأماكن",
    subtitle: "تصفح الكل",
    icon: "📍",
    bgColor: "bg-gradient-to-br from-teal-500 to-green-600",
    bgImage: chai,
    href: "/places"
  },
  {
    title: "خريطة الأطباق",
    subtitle: "خريطة تفاعلية",
    icon: "🗺️",
    bgColor: "bg-gradient-to-br from-amber-500 to-orange-600",
    bgImage: chai,
    href: "/dishes-map"
  },
  {
    title: "من نحن",
    subtitle: "تعرف علينا",
    icon: "ℹ️",
    bgColor: "bg-gradient-to-br from-gray-500 to-slate-600",
    bgImage: chai,
    href: "/about-us"
  },
];