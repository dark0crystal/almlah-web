// src/app/[locale]/recommendations/config/recommendationSections.ts

export interface RecommendationSection {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  description: string;
  descriptionAr: string;
  image: string;
  type: 'featured' | 'top_rated' | 'recent';
  gradient: string;
  icon: string;
}

export const recommendationSections: RecommendationSection[] = [
  {
    id: 'breakfast',
    title: 'Best Breakfast Places in Oman',
    titleAr: 'أفضل أماكن الإفطار في عُمان',
    category: 'breakfast',
    description: 'Start your day right with these amazing breakfast spots that serve everything from traditional Omani breakfast to international favorites.',
    descriptionAr: 'ابدأ يومك بشكل صحيح مع هذه الأماكن الرائعة للإفطار التي تقدم كل شيء من الإفطار العماني التقليدي إلى الأطباق العالمية المفضلة.',
    image: '/breakfast-hero.jpg',
    type: 'featured',
    gradient: 'from-orange-400 to-red-500',
    icon: '🍳'
  },
  {
    id: 'lunch',
    title: 'Top Lunch Destinations',
    titleAr: 'أفضل وجهات الغداء',
    category: 'lunch',
    description: 'Discover the finest restaurants and eateries perfect for a memorable lunch experience with family and friends.',
    descriptionAr: 'اكتشف أفضل المطاعم والمأكولات المثالية لتجربة غداء لا تُنسى مع العائلة والأصدقاء.',
    image: '/lunch-hero.jpg',
    type: 'featured',
    gradient: 'from-green-400 to-teal-500',
    icon: '🍽️'
  },
  {
    id: 'dinner',
    title: 'Exquisite Dinner Experiences',
    titleAr: 'تجارب عشاء رائعة',
    category: 'dinner',
    description: 'End your day with these exceptional dining establishments that offer unforgettable dinner experiences and ambiance.',
    descriptionAr: 'اختتم يومك مع هذه المؤسسات الاستثنائية لتناول الطعام التي تقدم تجارب عشاء لا تُنسى وأجواء مميزة.',
    image: '/dinner-hero.jpg',
    type: 'featured',
    gradient: 'from-purple-500 to-indigo-600',
    icon: '🌟'
  },
  {
    id: 'cafes',
    title: 'Cozy Cafes & Coffee Culture',
    titleAr: 'مقاهي مريحة وثقافة القهوة',
    category: 'cafe',
    description: 'Relax and unwind at these charming cafes that serve exceptional coffee and create perfect atmospheres for socializing.',
    descriptionAr: 'استرخ واسترح في هذه المقاهي الساحرة التي تقدم قهوة استثنائية وتخلق أجواءً مثالية للتواصل الاجتماعي.',
    image: '/cafe-hero.jpg',
    type: 'featured',
    gradient: 'from-amber-400 to-orange-500',
    icon: '☕'
  },
  {
    id: 'tourism',
    title: 'Must-Visit Tourist Attractions',
    titleAr: 'الأماكن السياحية التي يجب زيارتها',
    category: 'tourism',
    description: 'Explore the most beautiful and culturally significant places that showcase the rich heritage and natural beauty of Oman.',
    descriptionAr: 'استكشف أجمل الأماكن ذات الأهمية الثقافية التي تُظهر التراث الغني والجمال الطبيعي لعُمان.',
    image: '/tourism-hero.jpg',
    type: 'featured',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '🏛️'
  }
];

// Helper function to get section by ID
export const getRecommendationSection = (id: string): RecommendationSection | undefined => {
  return recommendationSections.find(section => section.id === id);
};

// Helper function to get all section IDs
export const getAllSectionIds = (): string[] => {
  return recommendationSections.map(section => section.id);
};