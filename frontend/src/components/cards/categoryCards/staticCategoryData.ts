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
}

export const categoriesData: CategoryData[] = [
  {
    title: "أماكن سياحية",
    subtitle: "سياحة",
    icon: "🎙️",
    bgColor: "bg-gradient-to-br from-orange-400 to-pink-400",
    bgImage: rb3, // Use imported image or "/finjan.png" for direct path
  },
  {
    title: "مطاعم",
    subtitle: "جديد",
    icon: "🌟",
    bgColor: "bg-gradient-to-br from-green-500 to-emerald-600",
    bgImage: chai, // Direct path to public folder
  },
  {
    title: "كبيسات",
    icon: "📚",
    bgColor: "bg-gradient-to-br from-orange-500 to-red-500",
    bgImage: chai,
  },
  {
    title: "شكرة",
    icon: "💎",
    bgColor: "bg-gradient-to-br from-gray-600 to-gray-800",
    bgImage: chai,
  },
  {
    title: "كتاب مسموع",
    icon: "🎧",
    bgColor: "bg-gradient-to-br from-indigo-600 to-purple-700",
    bgImage: "/audiobook.png",
  },
  {
    title: "النشرة السينمائية",
    icon: "🎬",
    bgColor: "bg-gradient-to-br from-teal-500 to-cyan-600",
    bgImage: "/cinema.png",
  },
  {
    title: "تكنولوجيا",
    icon: "💻",
    bgColor: "bg-gradient-to-br from-blue-500 to-blue-700",
    bgImage: "/technology.png",
  },
  {
    title: "رياضة",
    icon: "⚽",
    bgColor: "bg-gradient-to-br from-red-500 to-pink-600",
    bgImage: "/sports.png",
  },
];