import Image from "next/image";
import { MapPin, Clock, Star } from "lucide-react";

export default function RestaurantCard({ place, isExpanded }) {
    return (
        <div className=" rounded-2xl p-2  hover:shadow-md transition-all duration-300">
            <div className="flex flex-row gap-6 items-center">
                {/* Left side - Restaurant Image */}
                <div className="flex-shrink-0">
                    <div className="relative w-30 h-30 rounded overflow-hidden bg-amber-100">
                        <Image
                            alt="restaurant img"
                            src={place.image || "/api/placeholder/80/80"}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
                
                {/* Center - Restaurant Info */}
                <div className="flex-1 space-y-3">
                    {/* Main Question/Title */}
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {place.question || "جسر العيجة"}
                        </h3>
                    </div>
                    
                   
                    {/*  */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        
                        <div className="flex items-center gap-1">
                            <span>{place.date || "جنوب الشرقية، صور ،مطل سياحي "}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}