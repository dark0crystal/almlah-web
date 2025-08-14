
import CategoryCard from '@/components/cards/categoryCards/CategoryCard';
import VerticalCard from '@/components/cards/verticalCards/VerticalCard';
import Destination from '@/components/destination/Destination';
import Header from '@/components/Header';
import Heading from '@/components/hero/Heading';
import {getTranslations} from 'next-intl/server';
import Places from './places/page';
import HeroSection from '@/components/hero/Hero';
import WelcomingText from '@/components/hero/WelcomingText';
import ThreeCardsWrapper from '@/components/IntroSection/IntroCardsWrapper';
 
export default async function HomePage() {
  const t = await getTranslations('HomePage');
  return (
    <div>
      <div className='flex items-center flex-col'>
        
        {/* <Header/> */}
        <Heading/>
        {/* <CategoryCard /> */}
        
        <h1 className='text-3xl font-bold'>
          {t('title')}
        </h1>

        {/* <VerticalCard/> */}
        <Destination/>


        <div className="h-[100vh]"/>
        <Places/>
        <div className='h-screen'/>
        <ThreeCardsWrapper/>
      </div>
    </div>
    )
}