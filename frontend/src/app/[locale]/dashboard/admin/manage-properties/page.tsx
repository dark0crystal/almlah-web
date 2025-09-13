/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Tag, BarChart3, X, Save, AlertTriangle, CheckCircle } from 'lucide-react';

// API configuration
const API_BASE_URL = 'http://localhost:9000/api/v1';

const apiCall = async (endpoint: string, options: Record<string, unknown> = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers && typeof options.headers === 'object' ? options.headers : {}),
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// API functions
const propertyAPI = {
  getProperties: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiCall(`/properties?${params}`);
    return response.data;
  },

  getProperty: async (id) => {
    const response = await apiCall(`/properties/${id}`);
    return response.data;
  },

  createProperty: async (propertyData) => {
    const response = await apiCall('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
    return response.data;
  },

  updateProperty: async (id, propertyData) => {
    const response = await apiCall(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
    return response.data;
  },

  deleteProperty: async (id) => {
    await apiCall(`/properties/${id}`, {
      method: 'DELETE',
    });
  },

  // FIXED: Only fetch primary categories for property management
  getPrimaryCategories: async () => {
    const response = await apiCall('/categories/primary');
    // DEBUG: Log the full response to see the structure
    console.log('Primary Categories API Response:', response);
    console.log('Primary Categories Data:', response.data);
    return response.data;
  },

  getPropertyStats: async () => {
    const response = await apiCall('/properties/stats');
    return response.data;
  },
};

const ManageProperties = () => {
  const [properties, setProperties] = useState([]);
  const [primaryCategories, setPrimaryCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    has_icon: '',
    page: 1,
    limit: 20
  });

  // FIXED: Wrap loadData in useCallback to prevent unnecessary re-renders
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [propertiesData, categoriesData] = await Promise.all([
        propertyAPI.getProperties(filters),
        propertyAPI.getPrimaryCategories()
      ]);
      
      // DEBUG: Log the data to see what we're getting
      console.log('Properties Data:', propertiesData);
      console.log('Categories Data:', categoriesData);
      
      setProperties(propertiesData);
      setPrimaryCategories(categoriesData);
      
      // DEBUG: Log each category to see its structure
      if (categoriesData && Array.isArray(categoriesData)) {
        categoriesData.forEach((category, index) => {
          console.log(`Category ${index}:`, category);
          console.log(`Category ${index} name_en:`, category.name_en);
          console.log(`Category ${index} name_ar:`, category.name_ar);
        });
      }
      
    } catch (error) {
      console.error('Load data error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Add filters as dependency

  useEffect(() => {
    loadData();
  }, [loadData]); // Now loadData is stable and won't cause infinite re-renders

  const loadStats = async () => {
    try {
      const statsData = await propertyAPI.getPropertyStats();
      setStats(statsData);
    } catch (error) {
      setError(error.message);
    }
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCreateProperty = async (propertyData) => {
    try {
      await propertyAPI.createProperty(propertyData);
      setShowCreateModal(false);
      await loadData();
      showMessage('Property created successfully');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleUpdateProperty = async (propertyData) => {
    try {
      await propertyAPI.updateProperty(editingProperty.id, propertyData);
      setEditingProperty(null);
      await loadData();
      showMessage('Property updated successfully');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyAPI.deleteProperty(id);
        await loadData();
        showMessage('Property deleted successfully');
      } catch (error) {
        showMessage(error.message, 'error');
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category_id: '',
      has_icon: '',
      page: 1,
      limit: 20
    });
  };

  return (
    <div className="min-h-screen p-6" style={{backgroundColor: '#f3f3eb'}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Management</h1>
          <p className="text-gray-600">Manage properties and their assignments to places</p>
        </div>

        {/* DEBUG INFO - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <h3 className="font-semibold">Debug Info:</h3>
            <p>Primary Categories Count: {primaryCategories?.length || 0}</p>
            <p>First Category: {JSON.stringify(primaryCategories?.[0] || 'None')}</p>
            <p>Categories Array: {JSON.stringify(primaryCategories)}</p>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {success}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            {/* Filters and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category Filter - FIXED: Only show primary categories */}
                <select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Primary Categories</option>
                  {primaryCategories && primaryCategories.map(category => {
                    // DEBUG: Log each category being rendered
                    console.log('Rendering category option:', category);
                    
                    // Try multiple possible name fields
                    const displayName = category.name_en || category.NameEn || category.display_name || category.name || 'Unnamed Category';
                    const arabicName = category.name_ar || category.NameAr || category.name_arabic || '';
                    
                    return (
                      <option key={category.id} value={category.id}>
                        {displayName} {arabicName && `(${arabicName})`}
                      </option>
                    );
                  })}
                </select>

                {/* Icon Filter */}
                <select
                  value={filters.has_icon}
                  onChange={(e) => handleFilterChange('has_icon', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Properties</option>
                  <option value="true">With Icon</option>
                  <option value="false">Without Icon</option>
                </select>

                {/* Clear Filters */}
                {(filters.search || filters.category_id || filters.has_icon) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    loadStats();
                    setShowStatsModal(true);
                  }}
                  className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </button>
              </div>
            </div>
          </div>

          {/* Properties Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading properties...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Icon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties && properties.length > 0 ? properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {property.name_en}
                          </div>
                          <div className="text-sm text-gray-500" dir="rtl">
                            {property.name_ar}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {property.category?.icon && (
                            <span className="text-lg mr-2">{property.category.icon}</span>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {property.category?.name_en || property.category?.NameEn || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500" dir="rtl">
                              {property.category?.name_ar || property.category?.NameAr || 'لا يوجد اسم'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {property.icon ? (
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{property.icon}</span>
                            <span className="text-sm text-green-600">Has icon</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No icon</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(property.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingProperty(property)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Property"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Property"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        {loading ? 'Loading...' : 'No properties found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Empty State */}
          {!loading && properties && properties.length === 0 && (
            <div className="p-8 text-center">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No properties found</p>
              <p className="text-sm text-gray-400">
                {filters.search || filters.category_id || filters.has_icon
                  ? 'Try adjusting your filters'
                  : 'Create your first property to get started'
                }
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreateModal && (
          <PropertyModal
            title="Create Property"
            categories={primaryCategories}
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreateProperty}
          />
        )}

        {editingProperty && (
          <PropertyModal
            title="Edit Property"
            property={editingProperty}
            categories={primaryCategories}
            onClose={() => setEditingProperty(null)}
            onSave={handleUpdateProperty}
          />
        )}

        {showStatsModal && stats && (
          <StatsModal
            stats={stats}
            onClose={() => setShowStatsModal(false)}
          />
        )}
      </div>
    </div>
  );
};

const PropertyModal = ({ title, property, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name_ar: property?.name_ar || '',
    name_en: property?.name_en || '',
    category_id: property?.category_id || '',
    icon: property?.icon || ''
  });
  const [saving, setSaving] = useState(false);

  // DEBUG: Log categories in modal
  console.log('PropertyModal categories:', categories);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = {
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        category_id: formData.category_id,
      };
      
      // Only include icon if it's not empty
      if (formData.icon.trim()) {
        payload.icon = formData.icon;
      }
      
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                English Name *
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arabic Name *
              </label>
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                dir="rtl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Primary Category</option>
                {categories && categories.map(category => {
                  // DEBUG: Log category being rendered
                  console.log('Modal option category:', category);
                  
                  // Try multiple possible name fields
                  const displayName = category.name_en || category.NameEn || category.display_name || category.name || 'Unnamed Category';
                  const arabicName = category.name_ar || category.NameAr || category.name_arabic || '';
                  
                  return (
                    <option key={category.id} value={category.id}>
                      {displayName} {arabicName && `(${arabicName})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon (Optional)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="🏷️ or icon name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if no icon is needed
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !formData.name_en || !formData.name_ar || !formData.category_id}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsModal = ({ stats, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Property Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total_properties}</div>
              <div className="text-sm text-gray-600">Total Properties</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.properties_with_icon}</div>
              <div className="text-sm text-gray-600">With Icons</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Properties by Primary Category</h3>
            <div className="space-y-2">
              {Object.entries(stats.properties_per_category || {}).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{category}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageProperties;