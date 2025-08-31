"use client"
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { TrendingUp, Users, MapPin, Utensils } from "lucide-react";
import { zatarApi } from './zatarApi';

interface GameStatsData {
  total_rolls: number;
  unique_users: number;
  popular_food_type: string;
  popular_location: string;
  last_updated: string;
}

interface GameStatsProps {
  locale: string;
}

export default function GameStats({ locale }: GameStatsProps) {
  const t = useTranslations('zatar.stats');
  const [stats, setStats] = useState<GameStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await zatarApi.getGameStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch game stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-orange-100 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        {t('title')}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.total_rolls.toLocaleString()}</div>
          <div className="text-xs text-orange-700 flex items-center justify-center gap-1">
            <Utensils className="w-3 h-3" />
            {t('totalRolls')}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.unique_users.toLocaleString()}</div>
          <div className="text-xs text-blue-700 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" />
            {t('players')}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3" />
          {t('mostPopular')}
          <span className="font-medium">{stats.popular_location}</span>
        </div>
      </div>
    </div>
  );
}