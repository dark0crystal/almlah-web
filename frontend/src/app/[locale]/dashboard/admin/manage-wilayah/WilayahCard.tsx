import React from 'react';
import Image from 'next/image';
import { Edit2, Trash2, MapPin, ImageIcon } from 'lucide-react';

interface Wilayah {
  id: string;
  name_ar: string;
  name_en: string;
  governate_id: string;
  sort_order: number;
  images?: { id: string; url: string; is_primary: boolean }[];
}

interface WilayahCardProps {
  wilayah: Wilayah;
  onEdit: (wilayah: Wilayah) => void;
  onDelete: (wilayah: Wilayah) => void;
}

const WilayahCard: React.FC<WilayahCardProps> = ({
  wilayah,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Image Gallery Preview */}
      {wilayah.images && wilayah.images.length > 0 && (
        <div className="relative h-48 bg-gray-200">
          <Image
            src={wilayah.images.find(img => img.is_primary)?.url || wilayah.images[0]?.url}
            alt={wilayah.name_en}
            fill
            className="object-cover"
          />
          {wilayah.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              <ImageIcon className="w-3 h-3 inline mr-1" />
              {wilayah.images.length}
            </div>
          )}
          {!wilayah.is_active && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
              Inactive
            </div>
          )}
        </div>
      )}
             
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{wilayah.name_en}</h3>
            <p className="text-gray-600 text-lg mb-2" dir="rtl">{wilayah.name_ar}</p>
            
            {/* Subtitles */}
            {(wilayah.subtitle_en || wilayah.subtitle_ar) && (
              <div className="mb-2">
                {wilayah.subtitle_en && (
                  <p className="text-sm text-gray-500 italic">{wilayah.subtitle_en}</p>
                )}
                {wilayah.subtitle_ar && (
                  <p className="text-sm text-gray-500 italic" dir="rtl">{wilayah.subtitle_ar}</p>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">{wilayah.governate?.name_en}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                {wilayah.slug}
              </span>
            </div>
            
            {!wilayah.is_active && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Places</p>
              <p className="text-sm font-semibold">{wilayah.place_count || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Images</p>
              <p className="text-sm font-semibold">{wilayah.images?.length || 0}</p>
            </div>
          </div>
          
          {(wilayah.latitude !== 0 || wilayah.longitude !== 0) && (
            <div className="col-span-2 flex items-center gap-2">
              <div className="w-4 h-4 text-gray-400 flex items-center justify-center">🌍</div>
              <div>
                <p className="text-xs text-gray-500">Coordinates</p>
                <p className="text-sm font-semibold">
                  {wilayah.latitude?.toFixed(4) || '0.0000'}, {wilayah.longitude?.toFixed(4) || '0.0000'}
                </p>
              </div>
            </div>
          )}

          {wilayah.sort_order && (
            <div className="col-span-2 flex items-center gap-2">
              <div className="w-4 h-4 text-gray-400 flex items-center justify-center">#</div>
              <div>
                <p className="text-xs text-gray-500">Sort Order</p>
                <p className="text-sm font-semibold">{wilayah.sort_order}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {wilayah.description_en && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{wilayah.description_en}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => onEdit(wilayah)}
            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(wilayah)}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default WilayahCard;