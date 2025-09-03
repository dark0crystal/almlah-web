// Hardcoded recommendations data
export interface RecommendationItem {
  id: string;
  name_ar: string;
  name_en: string;
  category: string;
  image: string;
  rating?: number;
  location_ar: string;
  location_en: string;
}

export const RECOMMENDATIONS_DATA: RecommendationItem[] = [
  {
    id: "1",
    name_ar: "مطعم الخليل التراثي",
    name_en: "Al Khalil Heritage Restaurant",
    category: "restaurant",
    image: "/gallery-alkhalil/img12.jpg",
    rating: 4.8,
    location_ar: "مسقط",
    location_en: "Muscat"
  },
  {
    id: "2", 
    name_ar: "قهوة الصباح",
    name_en: "Morning Coffee",
    category: "cafe",
    image: "/chai.png",
    rating: 4.6,
    location_ar: "صلالة",
    location_en: "Salalah"
  },
  {
    id: "3",
    name_ar: "متحف عمان الوطني",
    name_en: "National Museum of Oman",
    category: "tourism",
    image: "/gallery-alkhalil/img14.jpg",
    rating: 4.9,
    location_ar: "مسقط",
    location_en: "Muscat"
  },
  {
    id: "4",
    name_ar: "مطعم البحر الأزرق",
    name_en: "Blue Sea Restaurant", 
    category: "restaurant",
    image: "/gallery-alkhalil/img15.jpg",
    rating: 4.7,
    location_ar: "صور",
    location_en: "Sur"
  },
  {
    id: "5",
    name_ar: "سوق مطرح التقليدي",
    name_en: "Muttrah Traditional Souq",
    category: "shopping",
    image: "/gallery-alkhalil/img16.jpg", 
    rating: 4.5,
    location_ar: "مسقط",
    location_en: "Muscat"
  },
  {
    id: "6",
    name_ar: "حديقة القرم الطبيعية",
    name_en: "Qurum Natural Park",
    category: "tourism",
    image: "/gallery-alkhalil/img17.jpg",
    rating: 4.4,
    location_ar: "مسقط", 
    location_en: "Muscat"
  },
  {
    id: "7",
    name_ar: "مقهى الليل",
    name_en: "Night Cafe",
    category: "cafe",
    image: "/gallery-alkhalil/img18.jpg",
    rating: 4.3,
    location_ar: "نزوى",
    location_en: "Nizwa"
  }
];