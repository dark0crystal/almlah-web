'use client';

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import LanguageChange from "./LangChange";
import { useLocale } from "next-intl";
// import NavMenu from ".";

type MobileMenuProps = {
  navLinks: { direction: string; name: string }[];
};

export default function MobileMenu({ navLinks }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale().substring(0, 2); // Get the current locale
  const direction = locale === 'ar' ? 'rtl' : 'ltr'; // Determine direction based on the locale

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="lg:hidden relative">
      <button onClick={toggleMenu} className="text-gray-700 bg-[#fbda5f] rounded-full p-2">
        {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
      </button>
      <div
        className={`absolute top-16 ${direction === 'rtl' ? 'left-1/2' : 'right-1/2'} transform w-[80vw] md:w-[60vw] bg-[#fbda5f] text-black p-6 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center space-y-4">
          {navLinks.map((navLink, index) => (
            <Link key={index} locale={locale} href={navLink.direction} onClick={toggleMenu}>
              <h1 className="text-xl font-black">{navLink.name}</h1>
            </Link>
          ))}
          {/* <NavMenu/> */}
        </div>
        <LanguageChange />
      </div>
    </div>
  );
}