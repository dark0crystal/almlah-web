import Destination from '@/components/destination/Destination';
import Heading from '@/components/hero/Heading';
import {getTranslations} from 'next-intl/server';
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

        <CategoryCardsWrapper />
        
        {/* <VerticalCard/> */}
        <Destination/>
       
        
       
        <PostCardsWrapper/>
        <div className='h-screen'/>
      </div>
    </div>
    )
}