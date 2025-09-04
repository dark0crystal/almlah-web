import React from 'react';
import { ChevronDown, ChevronRight, Folder, Tag, Edit, Trash2 } from 'lucide-react';

// Type definitions
interface Category {
  id: string;
  name?: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  icon?: string;
  type: 'primary' | 'secondary';
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  place_count?: number;
  subcategories?: Category[];
  children?: Category[];
}

interface CategoryItemProps {
  category: Category;
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  expandedCategories: Set<string>;
  onToggleExpand: (categoryId: string) => void;
  currentLang: 'en' | 'ar' | 'both';
}

// Helper function to ensure array format
const ensureArray = (data: unknown): Category[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.primary && Array.isArray(obj.primary)) return obj.primary as Category[];
    if (obj.categories && Array.isArray(obj.categories)) return obj.categories as Category[];
    if (obj.data) return ensureArray(obj.data);
    return [obj as Category];
  }
  return [];
};

// Helper function to get display name based on current language
const getDisplayName = (category: Category, currentLang: 'en' | 'ar' | 'both'): string => {
  if (category.name) return category.name; // Localized response
  return currentLang === 'ar' ? category.name_ar : category.name_en;
};

// Helper function to get display description based on current language
const getDisplayDescription = (category: Category, currentLang: 'en' | 'ar' | 'both'): string | undefined => {
  if (category.description) return category.description; // Localized response
  return currentLang === 'ar' ? category.description_ar : category.description_en;
};

// Category Item Component
const CategoryItem: React.FC<CategoryItemProps> = ({ 
  category, 
  level = 0, 
  onEdit, 
  onDelete, 
  expandedCategories, 
  onToggleExpand, 
  currentLang 
}) => {
  const subcategories = ensureArray(category.subcategories || category.children);
  const hasSubcategories = subcategories.length > 0;
  const isExpanded = expandedCategories.has(category.id);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div 
        className={`flex items-center p-4 hover:bg-gray-50 ${
          level > 0 ? `border-l-4 border-blue-200 bg-gray-50` : ''
        }`}
        style={{ marginLeft: level > 0 ? `${level * 20}px` : '0' }}
      >
        <div className="flex-1 flex items-center">
          {hasSubcategories ? (
            <button
              onClick={() => onToggleExpand(category.id)}
              className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-6 mr-2"></div>
          )}
          
          <div className="flex items-center">
            {category.type === 'primary' ? (
              <Folder className="text-blue-500 mr-2 flex-shrink-0" size={18} />
            ) : (
              <Tag className="text-green-500 mr-2 flex-shrink-0" size={18} />
            )}
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-medium text-gray-900">
                  {getDisplayName(category, currentLang)}
                </span>
                {category.icon && (
                  <span className="text-lg">{category.icon}</span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                  category.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                  category.type === 'primary'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {category.type}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                <span className="font-mono bg-gray-100 px-1 rounded">{category.slug}</span>
                {hasSubcategories && (
                  <span className="ml-2">• {subcategories.length} subcategories</span>
                )}
                {category.place_count && category.place_count > 0 && (
                  <span className="ml-2">• {category.place_count} places</span>
                )}
              </div>
              {getDisplayDescription(category, currentLang) && (
                <div className="text-sm text-gray-600 mt-1 italic">
                  {getDisplayDescription(category, currentLang)}
                </div>
              )}
              {/* Show both languages in admin view */}
              {currentLang === 'both' && (
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  <div><strong>AR:</strong> {category.name_ar}</div>
                  <div><strong>EN:</strong> {category.name_en}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-4">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
            title="Edit category"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
            title="Delete category"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {hasSubcategories && isExpanded && (
        <div>
          {subcategories.map(subcategory => (
            <CategoryItem
              key={subcategory.id}
              category={subcategory}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedCategories={expandedCategories}
              onToggleExpand={onToggleExpand}
              currentLang={currentLang}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryItem;