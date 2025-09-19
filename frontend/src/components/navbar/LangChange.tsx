'use client'
import { usePathname, Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export default function LanguageChange() {
    const pathName = usePathname();
    const locale = useLocale();

    return (
        <div>
            {locale === "ar" ? (
                <Link 
                    className="px-6 py-2  bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors duration-200" 
                    href={pathName} 
                    locale="en"
                >
                    English
                </Link>
            ) : (
                <Link 
                    className="px-6 py-2  bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors duration-200" 
                    href={pathName} 
                    locale="ar"
                >
                عــــربـي
                </Link>
            )}
        </div>
    );
}


