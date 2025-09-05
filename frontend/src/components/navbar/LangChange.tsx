'use client'
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function LanguageChange() {
    const pathName = usePathname();
    const locale = useLocale();

    // Remove the current locale from the pathname
    const pathWithoutLocale = pathName.replace(`/${locale}`, "");

    return (
        <div>
            {locale === "ar" ? (
                <Link 
                    className="px-6 py-2  bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors duration-200" 
                    href={`/en${pathWithoutLocale}`} 
                    locale="en"
                >
                    English
                </Link>
            ) : (
                <Link 
                    className="px-6 py-2  bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors duration-200" 
                    href={`/ar${pathWithoutLocale}`} 
                    locale="ar"
                >
                عــــربـي
                </Link>
            )}
        </div>
    );
}


