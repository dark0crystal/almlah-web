import Destination from '@/components/destination/Destination';
import Heading from '@/components/hero/Heading';
import {getTranslations} from 'next-intl/server';
import ArabicCardsLayout from '@/components/IntroSection/Cards';
import CategoryCardsWrapper from '@/components/cards/categoryCards/CategoryCardsWrapper';
import PostCardsWrapper from '@/components/cards/postCards/PostCardWrapper';
import ScrollAnimatedPng from '@/components/animated/MovingToKashtah';
import RecommendationsCarousel from '@/components/recommendations/RecommendationsCarousel';
import Footer from '@/components/Footer';

export default async function HomePage() {
  const t = await getTranslations('HomePage');
  return (
    <div>
      <div className='flex items-center flex-col space-y-8 sm:space-y-12 md:space-y-16 lg:space-y-20'>
        
        {/* <Header/> */}
        <Heading/>
        {/* <ScrollAnimatedPng/> */}
        {/* <CategoryCard /> */}
        
        <div className="mt-8 sm:mt-12 md:mt-16 lg:mt-20">
          <ArabicCardsLayout/>
        </div>

        <CategoryCardsWrapper />
        
        {/* <VerticalCard/> */}
        <Destination/>
       
        
       
        <PostCardsWrapper/>
        
        <RecommendationsCarousel/>
      </div>
      <Footer />
    </div>
    )
}