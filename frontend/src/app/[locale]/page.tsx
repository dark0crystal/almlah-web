import CategoryCard from '@/components/cards/categoryCards/CategoryCard';
import {getTranslations} from 'next-intl/server';
 
export default async function HomePage() {
  const t = await getTranslations('HomePage');
  return (
    <div>
      <CategoryCard />
      
      <h1 className='text-3xl font-bold'>
        {t('title')}
      </h1>
    </div>
    )
}