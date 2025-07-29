import CategoryCard from '@/components/cards/categoryCards/CategoryCard';
import Heading from '@/components/hero/Heading';
import {getTranslations} from 'next-intl/server';
 
export default async function HomePage() {
  const t = await getTranslations('HomePage');
  return (
    <div>
      <div className='flex items-center flex-col'>

      
        <Heading/>
        <CategoryCard />
        
        <h1 className='text-3xl font-bold'>
          {t('title')}
        </h1>
      </div>
    </div>
    )
}