"use client";
import { useEffect, useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Lalezar } from "next/font/google";
import { Car } from "@/types";

const lalezarFont = Lalezar({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
});

// Map car names to video file names
const getVideoFileName = (carName: string): string => {
    const nameMap: { [key: string]: string } = {
        'Al Ryam': 'alryam',
        'RB3': 'rb3',
        'Chai': 'chai',
        'Khayma': 'khayma',
        'G63': 'g63'
    };
    
    return nameMap[carName] || 'rb3'; // Default to rb3 if not found
};

export default function Brand() {
    const locale = useLocale().substring(0, 2);
    const t = useTranslations("Links");
    const [showVideo, setShowVideo] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [logoDimensions, setLogoDimensions] = useState({ width: 64, height: 32 });
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const logoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load selected car from localStorage
        const savedCar = localStorage.getItem('selectedCar');
        if (savedCar) {
            setSelectedCar(JSON.parse(savedCar));
        }

        // Measure logo dimensions
        const measureLogo = () => {
            if (logoRef.current) {
                const rect = logoRef.current.getBoundingClientRect();
                setLogoDimensions({
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        // Measure on mount and when window resizes
        measureLogo();
        window.addEventListener('resize', measureLogo);

        // Set up interval for every 5 minutes (300000ms)
        const interval = setInterval(() => {
            playVideoAnimation();
        }, 300000); // 5 minutes

        // Optional: trigger on first load after 10 seconds for demo
        const initialTimeout = setTimeout(() => {
            playVideoAnimation();
        }, 10000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimeout);
            window.removeEventListener('resize', measureLogo);
        };
    }, []);

    const playVideoAnimation = () => {
        setIsAnimating(true);
        
        // Start the transition
        setTimeout(() => {
            setShowVideo(true);
        }, 200); // Small delay for smooth transition

        // Hide video after 7 seconds
        setTimeout(() => {
            setShowVideo(false);
            setTimeout(() => {
                setIsAnimating(false);
            }, 200);
        }, 7000);
    };

    return (
        <div className="mx-6 text-4xl relative">
            {/* Original Logo */}
            <div 
                ref={logoRef}
                className={`transition-opacity duration-200 ${
                    showVideo ? 'opacity-0' : 'opacity-100'
                }`}
            >
                <Link 
                    locale={locale} 
                    className={lalezarFont.className} 
                    href='/'
                >
                    {t("brand")}
                </Link>
            </div>

            {/* Video Container */}
            {(showVideo || isAnimating) && (
                <div 
                    className={`absolute top-0 left-0 transition-all duration-300 ${
                        showVideo ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                        width: `${logoDimensions.width * (isHovering ? 2.2 : 1.5)}px`,
                        height: `${logoDimensions.height * (isHovering ? 1.8 : 1.2)}px`,
                        transform: isHovering ? 'translate(-25%, -25%)' : 'translate(-12.5%, -10%)'
                    }}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden shadow-lg"
                        style={{
                            width: '100%',
                            height: '100%',
                            boxShadow: isHovering ? '0 10px 25px rgba(0,0,0,0.3)' : '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                    >
                        <video
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            onEnded={() => {
                                setShowVideo(false);
                                setTimeout(() => setIsAnimating(false), 200);
                            }}
                        >
                            <source src={`/navbarvids/${getVideoFileName(selectedCar?.name || 'RB3')}.mp4`} type="video/mp4" />
                            {/* Fallback animated gradient */}
                            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
                        </video>
                    </div>
                </div>
            )}
        </div>
    );
}