import Image from "next/image";
import { MapPin, Clock, Star } from "lucide-react";

export default function RestaurantCard({ place, isExpanded }) {
    return (
        <div className=" rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-all duration-300">
            <div className="flex flex-row gap-6 items-center">
                {/* Left side - Restaurant Image */}
                <div className="flex-shrink-0">
                    <div className="relative w-20 h-20 rounded overflow-hidden bg-amber-100">
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
                        <span className="text-2xl">🤔</span>
                        <h3 className="text-lg font-semibold text-gray-800">
                            {place.question || "هل ما زلت تقرأ يابا هممتنوي؟"}
                        </h3>
                    </div>
                    
                   
                    {/* Author and Date Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-medium text-orange-600">
                                {place.author || "علي حسين"}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <span>في نشرة الـح من ثمانية</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{place.date || "2 يوليو 2025"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}