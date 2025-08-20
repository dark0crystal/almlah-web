"use client"
import React from 'react';
import { motion } from 'framer-motion';

interface OmanMapProps {
  onGovernorateClick: (governorateId: string) => void;
  selectedGovernorate: string | null;
}

const governorates = [
  { id: 'muscat', name: 'Muscat', color: '#F59E0B' },
  { id: 'dhofar', name: 'Dhofar', color: '#EF4444' },
  { id: 'ad-dakhiliyah', name: 'Ad Dakhiliyah', color: '#10B981' },
  { id: 'al-batinah-north', name: 'Al Batinah North', color: '#3B82F6' },
  { id: 'al-batinah-south', name: 'Al Batinah South', color: '#8B5CF6' },
  { id: 'ash-sharqiyah-north', name: 'Ash Sharqiyah North', color: '#F97316' },
  { id: 'ash-sharqiyah-south', name: 'Ash Sharqiyah South', color: '#06B6D4' },
  { id: 'ad-dhahirah', name: 'Ad Dhahirah', color: '#84CC16' },
  { id: 'al-wusta', name: 'Al Wusta', color: '#F472B6' },
  { id: 'al-buraimi', name: 'Al Buraimi', color: '#6366F1' },
  { id: 'musandam', name: 'Musandam', color: '#14B8A6' }
];

export const OmanMap: React.FC<OmanMapProps> = ({ onGovernorateClick, selectedGovernorate }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Omani Traditional Dishes</h1>
        <p className="text-gray-600">Click on any governorate to explore local dishes</p>
      </div>
      
      <motion.svg
        viewBox="0 0 800 600"
        className="w-full h-full max-w-4xl max-h-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Simplified Oman map with governorates */}
        
        {/* Musandam - Northern tip */}
        <motion.path
          d="M 250 80 L 300 60 L 350 80 L 340 120 L 290 130 L 260 110 Z"
          fill={selectedGovernorate === 'musandam' ? '#059669' : '#14B8A6'}
          stroke="#065F46"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('musandam')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Al Buraimi - Western border */}
        <motion.path
          d="M 100 150 L 180 140 L 190 200 L 170 240 L 120 250 L 90 200 Z"
          fill={selectedGovernorate === 'al-buraimi' ? '#4338CA' : '#6366F1'}
          stroke="#312E81"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('al-buraimi')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Al Batinah North - Northern coast */}
        <motion.path
          d="M 200 140 L 350 130 L 380 170 L 360 200 L 200 210 L 190 180 Z"
          fill={selectedGovernorate === 'al-batinah-north' ? '#1D4ED8' : '#3B82F6'}
          stroke="#1E3A8A"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('al-batinah-north')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Muscat - Capital region */}
        <motion.path
          d="M 380 170 L 450 160 L 480 200 L 460 240 L 400 250 L 360 210 Z"
          fill={selectedGovernorate === 'muscat' ? '#D97706' : '#F59E0B'}
          stroke="#92400E"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('muscat')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Al Batinah South - South of northern coast */}
        <motion.path
          d="M 200 210 L 360 200 L 370 260 L 340 290 L 210 300 L 180 260 Z"
          fill={selectedGovernorate === 'al-batinah-south' ? '#7C3AED' : '#8B5CF6'}
          stroke="#5B21B6"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('al-batinah-south')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Ad Dhahirah - Western interior */}
        <motion.path
          d="M 120 250 L 210 240 L 220 320 L 180 360 L 130 370 L 100 320 Z"
          fill={selectedGovernorate === 'ad-dhahirah' ? '#65A30D' : '#84CC16'}
          stroke="#365314"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('ad-dhahirah')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Ad Dakhiliyah - Central interior */}
        <motion.path
          d="M 220 280 L 340 270 L 380 320 L 360 380 L 280 390 L 220 340 Z"
          fill={selectedGovernorate === 'ad-dakhiliyah' ? '#047857' : '#10B981'}
          stroke="#064E3B"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('ad-dakhiliyah')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Ash Sharqiyah North - Northern east */}
        <motion.path
          d="M 460 240 L 520 230 L 560 270 L 540 320 L 480 330 L 440 290 Z"
          fill={selectedGovernorate === 'ash-sharqiyah-north' ? '#EA580C' : '#F97316'}
          stroke="#C2410C"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('ash-sharqiyah-north')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Ash Sharqiyah South - Southern east */}
        <motion.path
          d="M 440 290 L 540 320 L 560 380 L 520 420 L 460 430 L 420 380 Z"
          fill={selectedGovernorate === 'ash-sharqiyah-south' ? '#0891B2' : '#06B6D4'}
          stroke="#0E7490"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('ash-sharqiyah-south')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Al Wusta - Central/Western */}
        <motion.path
          d="M 180 360 L 280 390 L 320 450 L 280 500 L 200 510 L 160 450 Z"
          fill={selectedGovernorate === 'al-wusta' ? '#EC4899' : '#F472B6'}
          stroke="#BE185D"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('al-wusta')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Dhofar - Southern region */}
        <motion.path
          d="M 280 500 L 520 480 L 580 520 L 560 570 L 300 580 L 260 530 Z"
          fill={selectedGovernorate === 'dhofar' ? '#DC2626' : '#EF4444'}
          stroke="#991B1B"
          strokeWidth="2"
          className="cursor-pointer transition-all duration-300 hover:brightness-110"
          onClick={() => onGovernorateClick('dhofar')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Labels for each governorate */}
        {governorates.map((gov) => {
          const labelPositions: { [key: string]: { x: number; y: number } } = {
            'musandam': { x: 300, y: 95 },
            'al-buraimi': { x: 140, y: 195 },
            'al-batinah-north': { x: 275, y: 175 },
            'muscat': { x: 420, y: 205 },
            'al-batinah-south': { x: 275, y: 255 },
            'ad-dhahirah': { x: 160, y: 305 },
            'ad-dakhiliyah': { x: 300, y: 335 },
            'ash-sharqiyah-north': { x: 500, y: 285 },
            'ash-sharqiyah-south': { x: 480, y: 375 },
            'al-wusta': { x: 220, y: 435 },
            'dhofar': { x: 420, y: 535 }
          };
          
          const pos = labelPositions[gov.id];
          if (!pos) return null;
          
          return (
            <motion.text
              key={gov.id}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              className="fill-white font-semibold text-sm pointer-events-none drop-shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              {gov.name}
            </motion.text>
          );
        })}
      </motion.svg>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg p-4 max-w-xs">
        <h3 className="font-semibold text-gray-800 mb-2">Governorates</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {governorates.map((gov) => (
            <div key={gov.id} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: gov.color }}
              />
              <span className="text-gray-700 truncate">{gov.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};