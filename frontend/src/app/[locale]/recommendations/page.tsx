"use client"

import { useParams } from "next/navigation";
import RecommendationsHero from "./components/RecommendationsHero";
import CategoriesWrapper from "./components/CategoriesWrapper";
import RecommendationsFooter from "./components/RecommendationsFooter";

export default function RecommendationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <div className={`min-h-screen bg-gray-50 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Hero Section */}
      <RecommendationsHero locale={locale} />

      {/* Categories Cards Section */}
      <CategoriesWrapper locale={locale} />

      {/* Footer */}
      <RecommendationsFooter locale={locale} />
    </div>
  );
}