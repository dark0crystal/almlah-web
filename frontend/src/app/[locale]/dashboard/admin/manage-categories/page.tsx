"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Globe, Eye } from 'lucide-react';
import CategoryItem from './CategoryItem';
import CategoryFormModal from './CategoryFormModal';
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

interface CategoryListResponse {
  categories: Category[];
  primary: Category[];
  secondary: Category[];
  total: number;
}

// API service functions
const API_HOST = 'http://127.0.0.1:9000';

const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<{ data: unknown; message?: string }> => {
  // Check if we're in a browser environment before accessing localStorage
  const isBrowser = typeof window !== 'undefined';
  const token = isBrowser ? localStorage.getItem('authToken') : null;
  
  const response = await fetch(`${API_HOST}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
      endpoint,
      options
    });
    throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

const categoryService = {
  getAll: async (params: {
    search?: string;
    type?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<CategoryListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.type) queryParams.append('type', params.type);
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const queryString = queryParams.toString();
    const url = `/api/v1/categories${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiCall(url);
    return response.data as CategoryListResponse;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await apiCall(`/api/v1/categories/${id}`);
    return response.data as Category;
  },

  create: async (data: CategoryFormData): Promise<Category> => {
    console.log('🚀 Sending category creation request with data:', data);
    const response = await apiCall('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data as Category;
  },

  update: async (id: string, data: CategoryFormData): Promise<Category> => {
    const response = await apiCall(`/api/v1/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data as Category;
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/api/v1/categories/${id}`, {
      method: 'DELETE',
    });
  }
};

// Helper function to ensure array format
const ensureArray = (data: unknown): Category[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as Category[];
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.primary && Array.isArray(obj.primary)) return obj.primary as Category[];
    if (obj.categories && Array.isArray(obj.categories)) return obj.categories as Category[];
    if (obj.data) return ensureArray(obj.data);
    return [obj as unknown as Category];
  }
  return [];
};

export default function ManageCategoriesPage() {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [primaryCategories, setPrimaryCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [currentLang, setCurrentLang] = useState<'en' | 'ar' | 'both'>('both');

  // Load data
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        type: selectedType || undefined,
        is_active: filterActive,
        sort_by: 'sort_order',
        sort_order: 'asc'
      };

      const response = await categoryService.getAll(params);
      
      // Handle different response formats
      const allCategories = ensureArray(response.categories || response.primary || response);
      const primaryCats = ensureArray(response.primary || allCategories.filter(cat => cat.type === 'primary'));
      
      setCategories(allCategories);
      setPrimaryCategories(primaryCats);
      setTotalItems(response.total || allCategories.length);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, filterActive]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handlers
  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (id: string | null, data: CategoryFormData) => {
    try {
      if (id) {
        await categoryService.update(id, data);
      } else {
        await categoryService.create(data);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      await loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    
    setDeleteLoading(true);
    try {
      await categoryService.delete(deletingCategory.id);
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setFilterActive(undefined);
  };

  // Get hierarchical categories for display
  const getHierarchicalCategories = () => {
    const primary = categories.filter(cat => cat.type === 'primary');
    const secondary = categories.filter(cat => cat.type === 'secondary');
    
    return primary.map(primaryCat => ({
      ...primaryCat,
      subcategories: secondary.filter(secCat => secCat.parent_id === primaryCat.id)
    }));
  };

  const hierarchicalCategories = getHierarchicalCategories();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
          <p className="text-gray-600 mt-1">Manage place categories and subcategories</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value as 'en' | 'ar' | 'both')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="both">Both Languages</option>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Category
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Filters</span>
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-blue-600 hover:text-blue-700"
          >
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>

          {/* Active */}
          <select
            value={filterActive === undefined ? '' : filterActive.toString()}
            onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Status - All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Showing {categories.length} of {totalItems} categories
        </p>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">
            {currentLang === 'both' ? 'Both Languages' : currentLang === 'en' ? 'English' : 'Arabic'}
          </span>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading categories...</p>
          </div>
        ) : hierarchicalCategories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No categories found</p>
          </div>
        ) : (
          <div>
            {hierarchicalCategories.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                level={0}
                onEdit={handleEdit}
                onDelete={handleDelete}
                expandedCategories={expandedCategories}
                onToggleExpand={handleToggleExpand}
                currentLang={currentLang}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSave}
        category={editingCategory}
        primaryCategories={primaryCategories}
        currentLang={currentLang}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleConfirmDelete}
        category={deletingCategory}
        loading={deleteLoading}
        currentLang={currentLang}
      />
    </div>
  );
}