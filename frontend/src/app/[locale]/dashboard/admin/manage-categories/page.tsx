"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Settings, Globe, X, AlertTriangle } from 'lucide-react';
import CategoryFormModal from './CategoryFormModal';
import CategoryItem from './CategoryItem';
import DeleteConfirmModal from './DeleteConfirmModal';

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

interface CategoryFormData {
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  icon: string;
  type: 'primary' | 'secondary';
  parent_id: string | null;
  sort_order: number;
}

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// API service functions with host and authentication
const API_HOST = 'http://127.0.0.1:9000';

// Generic API call function with authentication
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = localStorage.getItem('authToken');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_HOST}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API request failed' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}: Failed to complete request`);
  }

  return response.json();
};

const categoryAPI = {
  getAll: async (lang: string | null = null): Promise<Category[]> => {
    const endpoint = lang ? `/api/v1/categories?lang=${lang}` : `/api/v1/categories`;
    const data: APIResponse = await apiCall(endpoint);
    if (!data.success) throw new Error(data.error || 'Failed to fetch categories');
    return data.data;
  },

  getHierarchy: async (lang: string | null = null): Promise<Category[]> => {
    const endpoint = lang ? `/api/v1/categories/hierarchy?lang=${lang}` : `/api/v1/categories/hierarchy`;
    const data: APIResponse = await apiCall(endpoint);
    if (!data.success) throw new Error(data.error || 'Failed to fetch hierarchy');
    return data.data;
  },

  getPrimary: async (lang: string | null = null): Promise<Category[]> => {
    const endpoint = lang ? `/api/v1/categories/primary?lang=${lang}` : `/api/v1/categories/primary`;
    const data: APIResponse = await apiCall(endpoint);
    if (!data.success) throw new Error(data.error || 'Failed to fetch primary categories');
    return data.data;
  },

  create: async (categoryData: CategoryFormData): Promise<Category> => {
    console.log('Creating category with data:', categoryData);
    const data: APIResponse = await apiCall(`/api/v1/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    
    console.log('Response data:', data);
    
    if (!data.success) throw new Error(data.error || 'Failed to create category');
    return data.data;
  },

  update: async (id: string, categoryData: CategoryFormData): Promise<Category> => {
    const data: APIResponse = await apiCall(`/api/v1/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
    if (!data.success) throw new Error(data.error || 'Failed to update category');
    return data.data;
  },

  delete: async (id: string): Promise<any> => {
    const data: APIResponse = await apiCall(`/api/v1/categories/${id}`, {
      method: 'DELETE'
    });
    if (!data.success) throw new Error(data.error || 'Failed to delete category');
    return data.data;
  }
};

// Helper function to ensure array format
const ensureArray = (data: any): Category[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    if (data.primary) return data.primary;
    if (data.categories) return data.categories;
    if (data.data) return ensureArray(data.data);
    return [data];
  }
  return [];
};

// Main ManageCategories Component
const ManageCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [primaryCategories, setPrimaryCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy');
  const [currentLang, setCurrentLang] = useState<'en' | 'ar' | 'both'>('en');

  useEffect(() => {
    loadCategories();
    loadPrimaryCategories();
  }, [viewMode, currentLang]);

  const loadCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      const langParam = currentLang === 'both' ? null : currentLang;
      const data = viewMode === 'hierarchy' 
        ? await categoryAPI.getHierarchy(langParam)
        : await categoryAPI.getAll(langParam);
      
      console.log('Loaded categories data:', data);
      
      const categoryArray = ensureArray(data);
      setCategories(categoryArray);
      
    } catch (err) {
      setError((err as Error).message);
      console.error('Error loading categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPrimaryCategories = async (): Promise<void> => {
    try {
      const data = await categoryAPI.getPrimary();
      setPrimaryCategories(ensureArray(data));
    } catch (err) {
      console.error('Failed to load primary categories:', err);
      setPrimaryCategories([]);
    }
  };

  const handleSaveCategory = async (id: string | null, categoryData: CategoryFormData): Promise<void> => {
    try {
      if (id) {
        await categoryAPI.update(id, categoryData);
      } else {
        await categoryAPI.create(categoryData);
      }
      await loadCategories();
      await loadPrimaryCategories();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteCategory = async (): Promise<void> => {
    if (!selectedCategory) return;
    
    try {
      await categoryAPI.delete(selectedCategory.id);
      await loadCategories();
      await loadPrimaryCategories();
      setShowDeleteModal(false);
      setSelectedCategory(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleExpand = (categoryId: string): void => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const expandAll = (): void => {
    const allIds = new Set<string>();
    const addIds = (categories: Category[]): void => {
      const categoryArray = ensureArray(categories);
      categoryArray.forEach(cat => {
        const subcategories = ensureArray(cat.subcategories || cat.children);
        if (subcategories.length > 0) {
          allIds.add(cat.id);
          addIds(subcategories);
        }
      });
    };
    addIds(categories);
    setExpandedCategories(allIds);
  };

  const collapseAll = (): void => {
    setExpandedCategories(new Set());
  };

  // Helper function to count total categories including subcategories
  const countTotalCategories = (categories: Category[]): number => {
    let total = 0;
    const count = (cats: Category[]): void => {
      const categoryArray = ensureArray(cats);
      categoryArray.forEach(cat => {
        total++;
        const subcategories = ensureArray(cat.subcategories || cat.children);
        if (subcategories.length > 0) {
          count(subcategories);
        }
      });
    };
    count(categories);
    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Add Category
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={16} />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'hierarchy' | 'flat')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="hierarchy">Hierarchy</option>
                <option value="flat">Flat List</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Globe className="text-gray-500" size={16} />
              <label className="text-sm font-medium text-gray-700">Language:</label>
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as 'en' | 'ar' | 'both')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="both">Both Languages</option>
              </select>
            </div>
            
            {viewMode === 'hierarchy' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600">
            Total: {viewMode === 'hierarchy' ? countTotalCategories(categories) : categories.length} categories
            {viewMode === 'hierarchy' && categories.length > 0 && (
              <span className="ml-2">({categories.length} primary)</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {categories.length > 0 ? (
          <div>
            {categories.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                onEdit={(cat) => {
                  setSelectedCategory(cat);
                  setShowModal(true);
                }}
                onDelete={(cat) => {
                  setSelectedCategory(cat);
                  setShowDeleteModal(true);
                }}
                expandedCategories={expandedCategories}
                onToggleExpand={handleToggleExpand}
                currentLang={currentLang}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Settings size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No categories found. Create your first category to get started.</p>
          </div>
        )}
      </div>

      <CategoryFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedCategory(null);
          setError('');
        }}
        category={selectedCategory}
        primaryCategories={primaryCategories}
        onSave={handleSaveCategory}
        currentLang={currentLang}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onConfirm={handleDeleteCategory}
        loading={loading}
        currentLang={currentLang}
      />
    </div>
  );
};

export default ManageCategories;