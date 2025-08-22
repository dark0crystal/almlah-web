import { Search, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import chai from '../../public/chai.png';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  date?: string;
  linkText?: string;
  onLearnMore?: () => void;
}

export default function Header({ 
  title, 
  subtitle, 
  backgroundImage, 
}: HeaderProps) {
  const t = useTranslations('header');
  
  // Use translations if no custom title/subtitle provided
  const headerTitle = title || t('defaultTitle');
  const headerSubtitle = subtitle || t('defaultSubtitle');

  return (
    <div className="w-full bg-gray-50 mt-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background with gradient */}
        <div 
          className="relative min-h-[clamp(300px,40vh,500px)] rounded-3xl mx-6 mb-6 bg-gradient-to-br from-emerald-900 via-emerald-800 to-black"
          style={backgroundImage ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : {}}
        >
          {/* Overlay for better text readability when background image is used */}
          {backgroundImage && (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-emerald-800/75 to-black/85 rounded-3xl"></div>
          )}
          
          

          {/* Chai PNG - Top Right Corner */}
          <div className="absolute top-4 right-4 z-20">
            <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white/10 border-2 border-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm p-2">
              <Image
                src={chai}
                alt="Chai"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center justify-between h-full p-8 md:p-12" >
            {/* Text Content */}
            <div className="text-white max-w-none w-full">
              <h2 className="text-[clamp(1.25rem,4vw,3rem)] font-bold mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                {headerTitle.includes(' ') ? (
                  <>
                    {headerTitle.split(' ').slice(0, -2).join(' ')} <span className="text-emerald-300">{headerTitle.split(' ').slice(-2).join(' ')}</span>
                  </>
                ) : (
                  <span className="text-emerald-300">{headerTitle}</span>
                )}
              </h2>
              <h3 className="text-[clamp(1rem,3vw,2.5rem)] font-bold mb-6 whitespace-nowrap overflow-hidden text-ellipsis">
                {headerSubtitle}
              </h3>
              
            </div>

            {/* Abstract Design Element */}
            <div className="hidden lg:block relative">
              <div className="w-32 h-32 border-2 border-emerald-400 opacity-30 rounded-full"></div>
              <div className="absolute top-4 right-4 w-24 h-24 border border-emerald-300 opacity-50 rounded-full"></div>
              <div className="absolute top-8 right-8 w-16 h-16 bg-emerald-400 opacity-20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example usage component to demonstrate different configurations
function HeaderDemo() {
  const handleLearnMore = () => {
    alert('Learn more clicked!');
  };

  return (
    <div className="space-y-8">
      {/* Default Header */}
      <Header onLearnMore={handleLearnMore} />
      
      {/* Custom Header with different content */}
      <Header 
        title="مؤتمر التقنية العربي"
        subtitle="للابتكار والتطوير"
        date="2025.9.15"
        linkText="سجل الآن"
        onLearnMore={handleLearnMore}
      />
      
      {/* Header with background image */}
      <Header 
        title="معرض الفنون التشكيلية"
        subtitle="في الرياض"
        backgroundImage="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop&crop=center"
        date="2025.10.1"
        linkText="احجز تذكرة"
        onLearnMore={handleLearnMore}
      />
    </div>
  );
}