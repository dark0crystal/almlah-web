import CategoryCard from '@/components/cards/categoryCards/CategoryCard';
import VerticalCard from '@/components/cards/verticalCards/VerticalCard';
import Destination from '@/components/destination/Destination';
import Header from '@/components/Header';
import Heading from '@/components/hero/Heading';
import {getTranslations} from 'next-intl/server';
 
export default async function HomePage() {
  const t = await getTranslations('HomePage');
  return (
    <div>
      <div className='flex items-center flex-col'>

        <Header/>
        <Heading/>
        <CategoryCard />
        
        <h1 className='text-3xl font-bold'>
          {t('title')}
        </h1>

        <VerticalCard/>
        <Destination/>
      </div>
    </div>
    )
}