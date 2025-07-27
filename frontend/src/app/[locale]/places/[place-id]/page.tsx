"use client"
import { useState } from "react";
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Globe, 
  Camera, 
  Share2, 
  Heart,
  ArrowLeft,
  Navigation,
  Calendar
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/**
 * Place Details Page Component
 * Displays comprehensive information about a specific place
 */
export default function PlaceDetails({ placeId }) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Mock data - replace with actual data fetching based on placeId
  const place = {
    id: placeId,
    name: "Sultan Qaboos Grand Mosque",
    wilayah: "Muscat",
    description: "The Sultan Qaboos Grand Mosque is the largest mosque in Oman and one of the most beautiful religious buildings in the world. Built from Indian sandstone, the mosque can accommodate up to 20,000 worshippers and features stunning Islamic architecture with intricate geometric patterns.",
    images: [
      "/api/placeholder/800/600",
      "/api/placeholder/800/600",
      "/api/placeholder/800/600"
    ],
    rating: 4.8,
    reviewCount: 1247,
    category: "Religious Site",
    openingHours: {
      saturday: "8:00 AM - 11:00 AM",
      sunday: "8:00 AM - 11:00 AM",
      monday: "8:00 AM - 11:00 AM",
      tuesday: "8:00 AM - 11:00 AM",
      wednesday: "8:00 AM - 11:00 AM",
      thursday: "8:00 AM - 11:00 AM",
      friday: "Closed for prayers"
    },
    contact: {
      phone: "+968 24 505 170",
      website: "www.sultanqaboosgrandmosque.om"
    },
    location: {
      address: "Sultan Qaboos Street, Muscat, Oman",
      coordinates: "23.5859° N, 58.4059° E"
    },
    highlights: [
      "World's second largest hand-woven carpet",
      "Stunning Swarovski crystal chandelier",
      "Beautiful Islamic calligraphy",
      "Guided tours available",
      "Photography allowed in certain areas"
    ],
    visitingTips: [
      "Dress modestly - long sleeves and pants required",
      "Remove shoes before entering prayer halls",
      "Free guided tours available",
      "Best time to visit is early morning",
      "Photography restrictions in some areas"
    ]
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `Check out ${place.name} in ${place.wilayah}`,
        url: window.location.href,
      });
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === place.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? place.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button and actions */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleShare}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleFavorite}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative h-80 bg-gray-200">
        {!imageError ? (
          <>
            <Image
              src={place.images[currentImageIndex]}
              alt={place.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              priority
            />
            
            {/* Image Navigation */}
            {place.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {place.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">{place.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{place.name}</h1>
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{place.wilayah}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {place.category}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-gray-800">{place.rating}</span>
              <span className="text-gray-600 text-sm">({place.reviewCount} reviews)</span>
            </div>
          </div>
          
          <p className="text-gray-700 leading-relaxed">{place.description}</p>
        </div>

        {/* Contact & Location */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{place.contact.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-400" />
                <a href={`https://${place.contact.website}`} className="text-blue-600 hover:text-blue-800">
                  {place.contact.website}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Location
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700">{place.location.address}</p>
              <p className="text-gray-500 text-sm">{place.location.coordinates}</p>
              <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Get Directions
              </button>
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Opening Hours
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(place.openingHours).map(([day, hours]) => (
              <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="font-medium text-gray-700 capitalize">{day}</span>
                <span className={`text-sm ${hours.includes('Closed') ? 'text-red-600' : 'text-gray-600'}`}>
                  {hours}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Highlights</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {place.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visiting Tips */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Visiting Tips</h2>
          <div className="space-y-3">
            {place.visitingTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </div>
                <span className="text-gray-700">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}