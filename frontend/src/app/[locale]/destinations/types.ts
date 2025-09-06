// Types for destination components
import { Place } from '@/types';

export type Locale = 'ar' | 'en';

// Core destination/governate interfaces
export interface GovernateDetailsProps {
  params: Promise<{
    'destination-id': string;
    locale: string;
  }>;
}

export interface WilayahDetailsProps {
  params: Promise<{
    'destination-id': string;
    'wilayah-id': string;
    locale: string;
  }>;
}

// Component prop interfaces
export interface DestinationPlaceCardProps {
  place: Place;
  locale: string;
}

export interface DestinationPlacesWrapperProps {
  governateId: string;
  categoryId?: string;
}

export interface WilayahCardProps {
  wilayah: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    image_url?: string;
    place_count?: number;
  };
  locale: 'ar' | 'en';
  onClick?: (wilayah: { 
    id: string; 
    name_ar: string; 
    name_en: string; 
    slug: string; 
    image_url?: string; 
    place_count?: number 
  }) => void;
}

export interface WilayahCardsWrapperProps {
  wilayahs: SimpleWilayah[];
  governateName: string;
  onWilayahClick?: (wilayah: WilayahWithImages) => void;
}

export interface GovernateImagesContainerProps {
  images: GovernateImage[];
  governateName: string;
  language?: 'ar' | 'en';
}

export interface GovernateImagesModalProps {
  images: string[];
  governateName: string;
  language?: 'ar' | 'en';
  onClose: () => void;
  initialIndex?: number;
}

export interface GovernateLoadingSkeletonProps {
  language?: 'ar' | 'en';
  showProgress?: boolean;
  loadingText?: string;
}

export interface GovernateErrorComponentProps {
  error: string;
  language?: 'ar' | 'en';
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showGoBack?: boolean;
  showGoHome?: boolean;
}

export interface GovernateInfoSidebarProps {
  governate: GovernateDetails;
  wilayahs: SimpleWilayah[];
  language?: 'ar' | 'en';
  onGetDirections?: () => void;
}

// Re-export types from services that are used in destinations
export type { 
  Place, 
  GovernateDetails, 
  SimpleWilayah, 
  WilayahWithImages, 
  GovernateImage 
} from '@/services/governateApi';