import Brand from "./Brand";
import LanguageChange from "./LangChange";
// import NavMenu from "./NavMenu";
import MobileMenu from "./MobileNavbar";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type NavBarProps = {
  style: string;
};

export default async function NavBar({ style }: NavBarProps) {
  const locale = (await getLocale()).substring(0, 2); // This will give you "ar" or "en"
  const t = await getTranslations("Links");
  const navLinks = [
    { direction: "/about", name: t("about") },
    { direction: "/places", name: t("map") },
  ];

  return (
    <div dir={t("dir")} className="sticky top-0 z-50 bg-white ">
      <nav className={`${style} flex items-center justify-between p-2 lg:p-2 border-b border-gray-200 w-[90vw] md:w-[70vw] lg:w-full h-[12vh] mx-auto`}>
        <div className="flex items-center">
          <Brand />
        </div>
        <div className="hidden lg:flex items-center space-x-6">
          {navLinks.map((navLink, index) => (
            <Link key={index} locale={locale} href={navLink.direction}>
              <h1 className="text-lg mx-2 font-normal hover:text-blue-600 transition-colors duration-200">{navLink.name}</h1>
            </Link>
          ))}
          
          {/* <NavMenu /> */}
          
          <LanguageChange />
        </div>
        <MobileMenu navLinks={navLinks} />
      </nav>
    </div>
  );
}