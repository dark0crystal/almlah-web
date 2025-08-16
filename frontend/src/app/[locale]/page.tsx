
import CategoryCard from '@/components/cards/categoryCards/CategoryCard';
import VerticalCard from '@/components/cards/verticalCards/VerticalCard';
import Destination from '@/components/destination/Destination';
import Header from '@/components/Header';
import Heading from '@/components/hero/Heading';
import {getTranslations} from 'next-intl/server';
import Places from './places/page';
import WelcomingText from '@/components/hero/WelcomingText';
import ArabicCardsLayout from '@/components/IntroSection/Cards';
import CategoryCardsWrapper from '@/components/cards/categoryCards/CategoryCardsWrapper';
import PostCardsWrapper from '@/components/cards/postCards/PostCardWrapper';
import ScrollAnimatedPng from '@/components/animated/MovingToKashtah';

export default async function HomePage() {
  const t = await getTranslations('HomePage');
  return (
    <div>
      <div className='flex items-center flex-col'>
        
        {/* <Header/> */}
        <Heading/>
        <ScrollAnimatedPng/>
        {/* <CategoryCard /> */}
        <ArabicCardsLayout/>
        
        {/* <VerticalCard/> */}
        <Destination/>
       
        <CategoryCardsWrapper />
       
        <PostCardsWrapper/>
        <div className='h-screen'/>
      </div>
    </div>
    )
}