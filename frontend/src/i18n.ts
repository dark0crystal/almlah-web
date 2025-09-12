import {getRequestConfig} from 'next-intl/server';
import {routing} from './i18n/routing';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid, fallback to default
  const validLocale = (locale && routing.locales.includes(locale as 'ar' | 'en')) ? locale : routing.defaultLocale;
 
  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});