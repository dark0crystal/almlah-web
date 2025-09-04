"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Image, MapPin, Clock, Users } from 'lucide-react';
import DishFormModal from './DishFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';

// Type definitions
interface Dish {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  governate?: {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
  };
  preparation_time_minutes: number;
  serving_size: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_traditional: boolean;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  images: DishImage[];
  created_at: string;
  updated_at: string;
}

interface DishImage {
  id: string;
  image_url: string;
  alt_text_ar: string;
  alt_text_en: string;
  is_primary: boolean;
  display_order: number;
}

interface Governate {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

interface DishFormData {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  governate_id: string;
  preparation_time_minutes: number;
  serving_size: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_traditional: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  images: {
    image_url: string;
    alt_text_ar: string;
    alt_text_en: string;
    is_primary: boolean;
    display_order: number;
  }[];
}

interface DishListResponse {
  dishes: Dish[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// API service functions
const API_HOST = 'http://127.0.0.1:9000';

const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<{ data: unknown; message?: string }> => {
  const token = localStorage.getItem('authToken');
  
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

const dishService = {
  getAll: async (params: {
    search?: string;
    governate_id?: string;
    difficulty?: string;
    is_traditional?: boolean;
    is_featured?: boolean;
    is_active?: boolean;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<DishListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.governate_id) queryParams.append('governate_id', params.governate_id);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.is_traditional !== undefined) queryParams.append('is_traditional', params.is_traditional.toString());
    if (params.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString());
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const queryString = queryParams.toString();
    const url = `/api/v1/dishes${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiCall(url);
    return response.data as DishListResponse;
  },

  getById: async (id: string): Promise<Dish> => {
    const response = await apiCall(`/api/v1/dishes/${id}`);
    return response.data as Dish;
  },

  create: async (data: DishFormData): Promise<Dish> => {
    console.log('🚀 Sending dish creation request with data:', data);
    console.log('🖼️ Images being sent:', data.images);
    const response = await apiCall('/api/v1/dishes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data as Dish;
  },

  update: async (id: string, data: DishFormData): Promise<Dish> => {
    const response = await apiCall(`/api/v1/dishes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data as Dish;
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/api/v1/dishes/${id}`, {
      method: 'DELETE',
    });
  }
};

const governateService = {
  getAll: async (): Promise<Governate[]> => {
    const response = await apiCall('/api/v1/governates');
    return response.data as Governate[];
  }
};

export default function ManageDishesPage() {
  // State
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [governates, setGovernorates] = useState<Governate[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [deletingDish, setDeletingDish] = useState<Dish | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGovernate, setSelectedGovernate] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [filterTraditional, setFilterTraditional] = useState<boolean | undefined>(undefined);
  const [filterFeatured, setFilterFeatured] = useState<boolean | undefined>(undefined);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  // Load data
  const loadDishes = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: 20,
        search: searchTerm || undefined,
        governate_id: selectedGovernate || undefined,
        difficulty: selectedDifficulty || undefined,
        is_traditional: filterTraditional,
        is_featured: filterFeatured,
        is_active: filterActive,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const response = await dishService.getAll(params);
      setDishes(response.dishes);
      setTotalItems(response.total);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Error loading dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGovernorates = async () => {
    try {
      const response = await governateService.getAll();
      setGovernorates(response);
    } catch (error) {
      console.error('Error loading governorates:', error);
    }
  };

  useEffect(() => {
    loadDishes();
  }, [currentPage, searchTerm, selectedGovernate, selectedDifficulty, filterTraditional, filterFeatured, filterActive]);

  useEffect(() => {
    loadGovernorates();
  }, []);

  // Handlers
  const handleCreate = () => {
    setEditingDish(null);
    setIsModalOpen(true);
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setIsModalOpen(true);
  };

  const handleDelete = (dish: Dish) => {
    setDeletingDish(dish);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (data: DishFormData) => {
    try {
      if (editingDish) {
        await dishService.update(editingDish.id, data);
      } else {
        await dishService.create(data);
      }
      setIsModalOpen(false);
      setEditingDish(null);
      await loadDishes();
    } catch (error) {
      console.error('Error saving dish:', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDish) return;
    
    try {
      await dishService.delete(deletingDish.id);
      setIsDeleteModalOpen(false);
      setDeletingDish(null);
      await loadDishes();
    } catch (error) {
      console.error('Error deleting dish:', error);
      throw error;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGovernate('');
    setSelectedDifficulty('');
    setFilterTraditional(undefined);
    setFilterFeatured(undefined);
    setFilterActive(undefined);
    setCurrentPage(1);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return difficulty;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Dishes</h1>
          <p className="text-gray-600 mt-1">Manage traditional Omani dishes</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Dish
        </button>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Governate */}
          <select
            value={selectedGovernate}
            onChange={(e) => setSelectedGovernate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Governorates</option>
            {governates.map(gov => (
              <option key={gov.id} value={gov.id}>{gov.name_en}</option>
            ))}
          </select>

          {/* Difficulty */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Traditional */}
          <select
            value={filterTraditional === undefined ? '' : filterTraditional.toString()}
            onChange={(e) => setFilterTraditional(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Traditional - All</option>
            <option value="true">Traditional</option>
            <option value="false">Modern</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Featured */}
          <select
            value={filterFeatured === undefined ? '' : filterFeatured.toString()}
            onChange={(e) => setFilterFeatured(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Featured - All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
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
          Showing {dishes.length} of {totalItems} dishes
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Dishes Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dishes...</p>
          </div>
        ) : dishes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No dishes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dish
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Governorate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {dish.images.find(img => img.is_primary)?.image_url ? (
                          <img
                            src={dish.images.find(img => img.is_primary)?.image_url}
                            alt={dish.name_en}
                            className="h-10 w-10 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNEgyOFYyNkgxMlYxNFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Image className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{dish.name_en}</div>
                          <div className="text-sm text-gray-500">{dish.name_ar}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {dish.governate?.name_en || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-1" />
                          <span>{dish.preparation_time_minutes} min</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-1" />
                          <span>{dish.serving_size} servings</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(dish.difficulty)}`}>
                          {getDifficultyText(dish.difficulty)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            dish.is_active ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
                          }`}>
                            {dish.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {dish.is_traditional && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-blue-800 bg-blue-100">
                              Traditional
                            </span>
                          )}
                          {dish.is_featured && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-yellow-800 bg-yellow-100">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(dish)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dish)}
                          className="text-red-600 hover:text-red-700 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === pageNum
                      ? 'text-blue-600 bg-blue-50 border border-blue-300'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Modals */}
      <DishFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDish(null);
        }}
        onSave={handleSave}
        dish={editingDish}
        governates={governates}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingDish(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Dish"
        message={`Are you sure you want to delete "${deletingDish?.name_en}"? This action cannot be undone.`}
      />
    </div>
  );
}