//import Brand from "./Brand";
import LanguageChange from "./LangChange";
// import NavMenu from "./NavMenu";
import MobileMenu from "./MobileNavbar";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Brand from "./Brand";

type NavBarProps = {
  style: string;
};

export default async function NavBar({ style }: NavBarProps) {
  const locale = (await getLocale()).substring(0, 2); // This will give you "ar" or "en"
  const direction = locale === 'ar' ? 'rtl' : 'ltr'; // Determine direction programmatically
  const t = await getTranslations("navbar");
  
  const navLinks = [
    { direction: "/", name: t("home") },
    { direction: "/places", name: t("places") },
    { direction: "/restaurants", name: t("restaurants") },
    { direction: "/destinations", name: t("destinations") },
    { direction: "/the-gallery", name: t("gallery") },
    { direction: "/zatar", name: t("zatar") },
    { direction: "/about-us", name: t("aboutUs") },
  ];

  const dashboardLinks = [
    { direction: "/dashboard", name: t("dashboard") },
    { direction: "/dashboard/admin/manage-places", name: t("managePlaces") },
    { direction: "/dashboard/admin/manage-governorate", name: t("manageGovernorate") },
    { direction: "/dashboard/admin/manage-wilayah", name: t("manageWilayah") },
    { direction: "/dashboard/admin/manage-categories", name: t("manageCategories") },
    { direction: "/dashboard/admin/manage-users", name: t("manageUsers") },
  ];

  return (
    <div dir={direction} className="sticky top-0 z-50 bg-[#f3f3eb]">
      <nav className="flex items-center justify-center p-2 lg:p-2 border-b border-gray-200 w-full h-[8vh]">
        <div className="w-[88vw] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Brand />
            <div className="hidden xl:flex items-center space-x-6">
              {navLinks.map((navLink, index) => (
                <Link key={index} href={navLink.direction}>
                  <h1 className="text-lg mx-2 font-normal hover:text-blue-600 transition-colors duration-200">{navLink.name}</h1>
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden xl:flex">
            <LanguageChange />
          </div>
          <MobileMenu navLinks={navLinks} dashboardLinks={dashboardLinks} />
        </div>
      </nav>
    </div>
  );
}