import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
    images: {
    domains: [
      'jeyypngrycucoystlmft.supabase.co',
      'lh3.googleusercontent.com',
      'images.unsplash.com',
      'localhost',
      '127.0.0.1'
    ],
  },
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);