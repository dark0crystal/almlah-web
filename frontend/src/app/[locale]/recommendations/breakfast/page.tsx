"use client"

import { useParams } from "next/navigation";
import BreakfastContent from "./BreakfastContent";

export default function Breakfast(){
    const params = useParams();
    const locale = (params?.locale as string) || 'en';

    return(
        <div className="max-w-6xl mx-auto px-4 py-12">
            <BreakfastContent locale={locale} />
        </div>
    )
}