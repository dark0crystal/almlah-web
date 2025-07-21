import {getTranslations} from 'next-intl/server';
 
export default async function HomePage() {
  const t = await getTranslations('HomePage');
  return (
    <h1 className='text-3xl font-bold'>
      {t('title')}
    </h1>
    )
}