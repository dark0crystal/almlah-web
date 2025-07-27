import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Lalezar } from "next/font/google";
import { getLocale } from "next-intl/server";

const lalezarFont = Lalezar({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
  });

export default async function Brand(){
    const locale = (await getLocale()).substring(0,2)
    const t = await getTranslations("Links")
    return(
        <div className="mx-6 text-4xl ">
            <Link locale={locale} className={lalezarFont.className} href='/'>{t("brand")}</Link>
        </div>
    )
}