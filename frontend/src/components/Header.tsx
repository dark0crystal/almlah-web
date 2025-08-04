import { Search, ChevronDown } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  date?: string;
  linkText?: string;
  onLearnMore?: () => void;
}

export default function Header({ 
  title = "شمال الشرقية", 
  subtitle = "حيث الصحراء القاحلة",
  backgroundImage, 
}: HeaderProps) {
  return (
    <div className="w-full bg-gray-50 mt-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background with gradient */}
        <div 
          className="relative min-h-[400px] rounded-3xl mx-6 mb-6 bg-gradient-to-br from-emerald-900 via-emerald-800 to-black"
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
          
          

          {/* Content */}
          <div className="relative z-10 flex items-center justify-between h-full p-8 md:p-12" >
            {/* Text Content */}
            <div className="text-white max-w-lg">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                {title.includes(' ') ? (
                  <>
                    {title.split(' ').slice(0, -2).join(' ')} <span className="text-emerald-300">{title.split(' ').slice(-2).join(' ')}</span>
                  </>
                ) : (
                  <span className="text-emerald-300">{title}</span>
                )}
              </h2>
              <h3 className="text-2xl md:text-3xl font-bold mb-6">
                {subtitle}
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