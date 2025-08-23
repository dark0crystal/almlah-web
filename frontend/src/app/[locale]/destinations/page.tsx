"use client";

import { useParams } from "next/navigation";
import DestinationsHeader from "@/components/destination/DestinationsHeader";
import Destination from "@/components/destination/Destination";
import Footer from "@/components/Footer";

/**
 * Main Destinations page that displays all available destinations
 * Features a hero header section with discover destinations content
 * and the main destinations component with map and cards
 */
export default function DestinationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <div className={`w-full min-h-screen ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header Section - 40vh height with title and image */}
      <DestinationsHeader />
      
      {/* Main Destinations Content - Map and Cards */}
      <div className="flex justify-center w-full">
        <Destination />
      </div>
      
      {/* Footer Section */}
      <Footer />
    </div>
  );
}