"use client"
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Calendar,
  Users,
  FileImage,
  Filter,
  MoreVertical,
  AlertTriangle,
  Check,
  X,
  Loader2,
  ExternalLink,
  Star,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

// API Service for place management
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api/v1';

const placeService = {
  // Get all places
  getAllPlaces: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('q', params.search);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.governateId) queryParams.append('governateId', params.governateId);
    
    const url = queryParams.toString() 
      ? `${API_BASE_URL}/places?${queryParams.toString()}`
      : `${API_BASE_URL}/places`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch places: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete place with images
  deletePlace: async (placeId) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete place: ${response.statusText}`);
    }

    return response.json();
  },

  // Get place by ID
  getPlaceById: async (placeId) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch place: ${response.statusText}`);
    }

    return response.json();
  },

  // Search places
  searchPlaces: async (query) => {
    const response = await fetch(`${API_BASE_URL}/places/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to search places: ${response.statusText}`);
    }

    return response.json();
  }
};

// API service for categories and governates
const metaService = {
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  getGovernates: async () => {
    const response = await fetch(`${API_BASE_URL}/governates`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// Delete confirmation modal component
const DeleteConfirmModal = ({ place, isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen || !place) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Place</h3>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            Are you sure you want to delete "<strong>{place.name_en}</strong>"?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will permanently delete:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
              <li>The place and all its data</li>
              <li>All associated images ({place.images?.length || 0} images)</li>
              <li>All content sections ({place.content_sections?.length || 0} sections)</li>
              <li>All reviews and ratings</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(place.id)}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Place
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Place card component
const PlaceCard = ({ place, onEdit, onDelete, onView }) => {
  const [showActions, setShowActions] = useState(false);
  
  const primaryImage = place.images?.find(img => img.is_primary) || place.images?.[0];
  const imageCount = place.images?.length || 0;
  const sectionCount = place.content_sections?.length || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {primaryImage ? (
          <img 
            src={primaryImage.image_url} 
            alt={primaryImage.alt_text || place.name_en}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileImage className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Image count badge */}
        {imageCount > 0 && (
          <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
            <FileImage className="w-3 h-3" />
            {imageCount}
          </div>
        )}

        {/* Actions dropdown */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border py-1 min-w-32 z-10">
                <button
                  onClick={() => {
                    onView(place);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => {
                    onEdit(place);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(place);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
              {place.name_en}
            </h3>
            <p className="text-sm text-gray-600 mb-1">{place.name_ar}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {place.description_en}
        </p>

        {/* Location */}
        {(place.governate || place.wilayah) && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin className="w-4 h-4" />
            <span>
              {place.wilayah?.name_en || ''}{place.wilayah && place.governate ? ', ' : ''}{place.governate?.name_en || ''}
            </span>
          </div>
        )}

        {/* Categories */}
        {place.categories && place.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {place.categories.slice(0, 2).map((category) => (
              <span 
                key={category.id}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {category.name_en}
              </span>
            ))}
            {place.categories.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{place.categories.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileImage className="w-3 h-3" />
              {imageCount} images
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {sectionCount} sections
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(place.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
export default function ManagePlaces() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGovernate, setSelectedGovernate] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [governates, setGovernates] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadPlaces();
    loadCategories();
    loadGovernates();
  }, []);

  // Load places
  const loadPlaces = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await placeService.getAllPlaces(params);
      
      if (response.success) {
        setPlaces(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load places');
      }
    } catch (err) {
      console.error('Error loading places:', err);
      setError(err.message);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await metaService.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Load governates
  const loadGovernates = async () => {
    try {
      const response = await metaService.getGovernates();
      if (response.success) {
        setGovernates(response.data || []);
      }
    } catch (err) {
      console.error('Error loading governates:', err);
    }
  };

  // Search places
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      await loadPlaces({ search: query, categoryId: selectedCategory, governateId: selectedGovernate });
    } else {
      await loadPlaces({ categoryId: selectedCategory, governateId: selectedGovernate });
    }
  };

  // Filter places
  const handleFilter = async () => {
    await loadPlaces({ 
      search: searchQuery, 
      categoryId: selectedCategory, 
      governateId: selectedGovernate 
    });
  };

  // Reset filters
  const resetFilters = async () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedGovernate('');
    await loadPlaces();
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await loadPlaces({ 
      search: searchQuery, 
      categoryId: selectedCategory, 
      governateId: selectedGovernate 
    });
    setRefreshing(false);
  };

  // Handle place deletion
  const handleDeletePlace = async (placeId) => {
    try {
      setDeleting(placeId);
      const response = await placeService.deletePlace(placeId);
      
      if (response.success) {
        // Remove from local state
        setPlaces(places.filter(place => place.id !== placeId));
        setDeleteConfirm(null);
        
        // Show success message (you can add a toast notification here)
        console.log('Place deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete place');
      }
    } catch (err) {
      console.error('Error deleting place:', err);
      alert(`Failed to delete place: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  // Handle actions
  const handleView = (place) => {
    // Navigate to place view page
    window.open(`/places/${place.id}`, '_blank');
  };

  const handleEdit = (place) => {
    // Navigate to place edit page
    window.location.href = `/admin/places/edit/${place.id}`;
  };

  const handleCreate = () => {
    // Navigate to place creation page
    window.location.href = '/admin/places/create';
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedGovernate;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Places</h1>
              <p className="text-gray-600 mt-1">Create, edit, and manage tourist places</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Place
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search places..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Governate</label>
                  <select
                    value={selectedGovernate}
                    onChange={(e) => setSelectedGovernate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Governates</option>
                    {governates.map((governate) => (
                      <option key={governate.id} value={governate.id}>
                        {governate.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={handleFilter}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Apply Filters
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-600">
            {loading ? (
              'Loading places...'
            ) : error ? (
              <span className="text-red-600">Error loading places</span>
            ) : (
              <>
                {places.length} place{places.length !== 1 ? 's' : ''} found
                {hasActiveFilters && ' (filtered)'}
              </>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error loading places</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={() => loadPlaces()}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && places.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No places found' : 'No places yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your search filters to find places.'
                : 'Get started by creating your first place.'
              }
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Place
              </button>
            )}
          </div>
        )}

        {/* Places Grid */}
        {!loading && !error && places.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={(place) => setDeleteConfirm(place)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        place={deleteConfirm}
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeletePlace}
        isDeleting={deleting === deleteConfirm?.id}
      />
    </div>
  );
}