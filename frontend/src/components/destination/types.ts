// Types for destination components

export interface GovernorateImage {
  id: number;
  url?: string;
  image_url?: string;
  is_primary: boolean;
}

export interface GovernorateData {
  id: number;
  name_ar: string;
  name_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  latitude?: number;
  longitude?: number;
  wilayah_count?: number;
  place_count?: number;
  images?: GovernorateImage[];
  gallery_images?: string; // JSON string field for legacy support
}

export interface DestinationCoordinates {
  x: number;
  y: number;
}

export interface Destination {
  id: number;
  name: string;
  category: string;
  image: string | null;
  coordinates: DestinationCoordinates;
  rating: number;
  isFavorite: boolean;
  governorateData: GovernorateData;
}

export interface DestinationCardProps {
  destination: Destination;
  isHighlighted?: boolean;
}

export interface DestinationCardWrapperProps {
  destinations: Destination[];
  highlightedDestination: number | null;
  onDestinationHighlight: (destinationId: number | null) => void;
}

export interface DestinationsHeaderProps {
  imageSrc?: string;
  imageAlt?: string;
}

export interface DestinationsMapProps {
  destinations: Destination[];
  language?: string;
  onMarkerClick?: (destinationId: number) => void;
}

export interface MapMarkerProps {
  destination: Destination;
  isActive?: boolean;
  onClick: (destinationId: number) => void;
}