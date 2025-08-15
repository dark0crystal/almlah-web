// categoryData.ts
export interface CategoryData {
  title: string;
  subtitle?: string;
  icon?: string;
  bgColor: string;
  bgImage?: string; // Background image URL
  textColor?: string;
  slug?: string; // for navigation
}

export const categoriesData: CategoryData[] = [
  {
    title: "فنجان",
    subtitle: "بودكاست",
    icon: "🎙️",
    bgColor: "bg-gradient-to-br from-orange-400 to-pink-400",
    bgImage: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop&crop=center",
    slug: "finjan-podcast"
  },
  {
    title: "دليلة الرياض",
    subtitle: "جديد",
    icon: "🌟",
    bgColor: "bg-gradient-to-br from-green-500 to-emerald-600",
    bgImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop&crop=center",
    slug: "riyadh-guide"
  },
  {
    title: "الصوت الأخير",
    icon: "📚",
    bgColor: "bg-gradient-to-br from-orange-500 to-red-500",
    bgImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&crop=center",
    slug: "last-sound"
  },
  {
    title: "شكرة",
    icon: "💎",
    bgColor: "bg-gradient-to-br from-gray-600 to-gray-800",
    bgImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=center",
    slug: "shakra"
  },
  {
    title: "كتاب مسموع",
    icon: "🎧",
    bgColor: "bg-gradient-to-br from-indigo-600 to-purple-700",
    bgImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center",
    slug: "audiobook"
  },
  {
    title: "النشرة السينمائية",
    icon: "🎬",
    bgColor: "bg-gradient-to-br from-teal-500 to-cyan-600",
    bgImage: "https://images.unsplash.com/photo-1489599517064-0754c955f22f?w=400&h=400&fit=crop&crop=center",
    slug: "cinema-newsletter"
  },
  {
    title: "تكنولوجيا",
    icon: "💻",
    bgColor: "bg-gradient-to-br from-blue-500 to-blue-700",
    bgImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=center",
    slug: "technology"
  },
  {
    title: "رياضة",
    icon: "⚽",
    bgColor: "bg-gradient-to-br from-red-500 to-pink-600",
    bgImage: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=400&fit=crop&crop=center",
    slug: "sports"
  },
];