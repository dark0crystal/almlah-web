"use client"
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Users, Mountain, Droplets, Eye, Filter, X, Save, AlertCircle } from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

// Utility function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Utility function to create headers
const createHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Utility function to handle API responses
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Handle different response structures from your backend
  // Your backend might return: { success: true, data: [...] } or just [...]
  if (data.success !== undefined) {
    return data.data || [];
  }
  
  if (data.data !== undefined) {
    return data.data;
  }
  
  // If the response is directly an array or object
  return data || [];
};

// API functions for Wilayah operations
const api = {
  async getAllWilayahs() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wilayahs`, {
        method: 'GET',
        headers: createHeaders(false),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching wilayahs:', error);
      throw error;
    }
  },

  async getAllGovernates() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/governates`, {
        method: 'GET',
        headers: createHeaders(false),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching governates:', error);
      throw error;
    }
  },

  async getWilayahById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wilayahs/${id}`, {
        method: 'GET',
        headers: createHeaders(false),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching wilayah:', error);
      throw error;
    }
  },

  async createWilayah(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wilayahs`, {
        method: 'POST',
        headers: createHeaders(true),
        body: JSON.stringify(data),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error creating wilayah:', error);
      throw error;
    }
  },

  async updateWilayah(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wilayahs/${id}`, {
        method: 'PUT',
        headers: createHeaders(true),
        body: JSON.stringify(data),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error updating wilayah:', error);
      throw error;
    }
  },

  async deleteWilayah(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wilayahs/${id}`, {
        method: 'DELETE',
        headers: createHeaders(true),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error deleting wilayah:', error);
      throw error;
    }
  },

  async searchWilayahs(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wilayahs/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: createHeaders(false),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error searching wilayahs:', error);
      throw error;
    }
  },

  async getWilayahsByGovernate(governateId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wilayahs/governate/${governateId}`, {
        method: 'GET',
        headers: createHeaders(false),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching wilayahs by governate:', error);
      throw error;
    }
  }
};

export default function ManageWilayah() {
  const [wilayahs, setWilayahs] = useState([]);
  const [governates, setGovernates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGovernate, setSelectedGovernate] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWilayah, setEditingWilayah] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    governate_id: '',
    name_ar: '',
    name_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    area: '',
    population: '',
    latitude: '',
    longitude: '',
    postal_code: '',
    is_capital: false,
    is_coastal: false,
    elevation: '',
    climate_type: '',
    sort_order: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wilayahsData, governatesData] = await Promise.all([
        api.getAllWilayahs(),
        api.getAllGovernates()
      ]);
      
      // Ensure wilayahsData is an array
      setWilayahs(Array.isArray(wilayahsData) ? wilayahsData : []);
      setGovernates(Array.isArray(governatesData) ? governatesData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
      // Set empty arrays on error
      setWilayahs([]);
      setGovernates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWilayahs = Array.isArray(wilayahs) ? wilayahs.filter(wilayah => {
    const matchesSearch = wilayah.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wilayah.name_ar?.includes(searchTerm) ||
                         wilayah.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGovernate = !selectedGovernate || wilayah.governate_id === selectedGovernate;
    const matchesActive = !showActiveOnly || wilayah.is_active;
    
    return matchesSearch && matchesGovernate && matchesActive;
  }) : [];

  const resetForm = () => {
    setFormData({
      governate_id: '',
      name_ar: '',
      name_en: '',
      slug: '',
      description_ar: '',
      description_en: '',
      area: '',
      population: '',
      latitude: '',
      longitude: '',
      postal_code: '',
      is_capital: false,
      is_coastal: false,
      elevation: '',
      climate_type: '',
      sort_order: ''
    });
    setErrors({});
    setEditingWilayah(null);
  };

  const openModal = (wilayah = null) => {
    if (wilayah) {
      setEditingWilayah(wilayah);
      setFormData({
        governate_id: wilayah.governate_id,
        name_ar: wilayah.name_ar,
        name_en: wilayah.name_en,
        slug: wilayah.slug,
        description_ar: wilayah.description_ar || '',
        description_en: wilayah.description_en || '',
        area: wilayah.area?.toString() || '',
        population: wilayah.population?.toString() || '',
        latitude: wilayah.latitude?.toString() || '',
        longitude: wilayah.longitude?.toString() || '',
        postal_code: wilayah.postal_code || '',
        is_capital: wilayah.is_capital,
        is_coastal: wilayah.is_coastal,
        elevation: wilayah.elevation?.toString() || '',
        climate_type: wilayah.climate_type || '',
        sort_order: wilayah.sort_order?.toString() || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.governate_id) newErrors.governate_id = 'Governate is required';
    if (!formData.name_ar.trim()) newErrors.name_ar = 'Arabic name is required';
    if (!formData.name_en.trim()) newErrors.name_en = 'English name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitLoading(true);
    setError(null);
    
    try {
      // Prepare data according to your backend DTOs
      const submitData = {
        governate_id: formData.governate_id,
        name_ar: formData.name_ar.trim(),
        name_en: formData.name_en.trim(),
        slug: formData.slug.trim(),
        description_ar: formData.description_ar.trim() || '',
        description_en: formData.description_en.trim() || '',
        area: formData.area ? parseFloat(formData.area) : 0,
        population: formData.population ? parseInt(formData.population) : 0,
        latitude: formData.latitude ? parseFloat(formData.latitude) : 0,
        longitude: formData.longitude ? parseFloat(formData.longitude) : 0,
        postal_code: formData.postal_code.trim() || '',
        is_capital: formData.is_capital,
        is_coastal: formData.is_coastal,
        elevation: formData.elevation ? parseFloat(formData.elevation) : 0,
        climate_type: formData.climate_type.trim() || '',
        sort_order: formData.sort_order ? parseInt(formData.sort_order) : 0
      };

      let result;
      if (editingWilayah) {
        // For updates, only include changed fields
        const updateData = {};
        Object.keys(submitData).forEach(key => {
          if (key !== 'governate_id') { // governate_id is not updatable
            updateData[key] = submitData[key];
          }
        });
        
        result = await api.updateWilayah(editingWilayah.id, updateData);
        
        // Update the wilayah in the list
        setWilayahs(prev => Array.isArray(prev) ? prev.map(w => 
          w.id === editingWilayah.id 
            ? { ...w, ...result }
            : w
        ) : []);
        
        setSuccess('Wilayah updated successfully!');
      } else {
        result = await api.createWilayah(submitData);
        
        // Add the new wilayah to the list
        const newWilayah = Array.isArray(result) ? result[0] : result;
        setWilayahs(prev => Array.isArray(prev) ? [...prev, newWilayah] : [newWilayah]);
        
        setSuccess('Wilayah created successfully!');
      }

      closeModal();
      
      // Refresh the data to get the latest information
      await fetchData();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'An error occurred while saving the wilayah');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (wilayah) => {
    setDeleteLoading(true);
    setError(null);
    
    try {
      await api.deleteWilayah(wilayah.id);
      setWilayahs(prev => Array.isArray(prev) ? prev.filter(w => w.id !== wilayah.id) : []);
      setDeleteConfirm(null);
      setSuccess('Wilayah deleted successfully!');
    } catch (error) {
      console.error('Error deleting wilayah:', error);
      setError(error.message || 'Failed to delete wilayah. It may have associated places.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Auto-generate slug from English name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  // Handle name_en change and auto-generate slug
  const handleNameEnChange = (value) => {
    setFormData(prev => ({
      ...prev,
      name_en: value,
      slug: prev.slug || generateSlug(value)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Wilayah Management</h1>
          <p className="text-gray-600">Manage administrative divisions and their details</p>
          
          {/* Success/Error Messages */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-5 h-5 text-green-600 flex-shrink-0">✓</div>
              <div>
                <p className="text-green-800 font-medium">Success</p>
                <p className="text-green-700 text-sm">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search wilayahs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Governate Filter */}
              <select
                value={selectedGovernate}
                onChange={(e) => setSelectedGovernate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Governates</option>
                {governates.map(gov => (
                  <option key={gov.id} value={gov.id}>{gov.name_en}</option>
                ))}
              </select>

              {/* Active Filter */}
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Active only
              </label>
            </div>

            {/* Add Button */}
            <button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Add Wilayah
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredWilayahs.length} of {Array.isArray(wilayahs) ? wilayahs.length : 0} wilayahs
          </p>
        </div>

        {/* Wilayahs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWilayahs.map(wilayah => (
            <div key={wilayah.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{wilayah.name_en}</h3>
                    <p className="text-gray-600 text-lg mb-2" dir="rtl">{wilayah.name_ar}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">{wilayah.governate?.name_en}</span>
                      {wilayah.is_capital && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">
                          Capital
                        </span>
                      )}
                      {wilayah.is_coastal && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                          Coastal
                        </span>
                      )}
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
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Population</p>
                      <p className="text-sm font-semibold">{wilayah.population?.toLocaleString() || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Places</p>
                      <p className="text-sm font-semibold">{wilayah.place_count}</p>
                    </div>
                  </div>
                  {wilayah.area > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 text-gray-400 flex items-center justify-center">📏</div>
                      <div>
                        <p className="text-xs text-gray-500">Area</p>
                        <p className="text-sm font-semibold">{wilayah.area} km²</p>
                      </div>
                    </div>
                  )}
                  {wilayah.elevation > 0 && (
                    <div className="flex items-center gap-2">
                      <Mountain className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Elevation</p>
                        <p className="text-sm font-semibold">{wilayah.elevation}m</p>
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
                    onClick={() => openModal(wilayah)}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(wilayah)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredWilayahs.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No wilayahs found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or add a new wilayah.</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingWilayah ? 'Edit Wilayah' : 'Add New Wilayah'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Governate Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Governate *
                  </label>
                  <select
                    value={formData.governate_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, governate_id: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.governate_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a governate</option>
                    {governates.map(gov => (
                      <option key={gov.id} value={gov.id}>{gov.name_en}</option>
                    ))}
                  </select>
                  {errors.governate_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.governate_id}</p>
                  )}
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arabic Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name_ar}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.name_ar ? 'border-red-300' : 'border-gray-300'
                      }`}
                      dir="rtl"
                    />
                    {errors.name_ar && (
                      <p className="text-red-500 text-sm mt-1">{errors.name_ar}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      English Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) => handleNameEnChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.name_en ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.name_en && (
                      <p className="text-red-500 text-sm mt-1">{errors.name_en}</p>
                    )}
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.slug ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.slug && (
                    <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                  )}
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arabic Description
                    </label>
                    <textarea
                      value={formData.description_ar}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      English Description
                    </label>
                    <textarea
                      value={formData.description_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Numeric Fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (km²)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.area}
                      onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Population
                    </label>
                    <input
                      type="number"
                      value={formData.population}
                      onChange={(e) => setFormData(prev => ({ ...prev, population: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Elevation (m)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.elevation}
                      onChange={(e) => setFormData(prev => ({ ...prev, elevation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Coordinates and Postal Code */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Climate Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Climate Type
                  </label>
                  <select
                    value={formData.climate_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, climate_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select climate type</option>
                    <option value="Desert">Desert</option>
                    <option value="Tropical">Tropical</option>
                    <option value="Arid">Arid</option>
                    <option value="Semi-Arid">Semi-Arid</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Mountain">Mountain</option>
                  </select>
                </div>

                {/* Boolean Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_capital"
                      checked={formData.is_capital}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_capital: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <label htmlFor="is_capital" className="text-sm font-medium text-gray-700">
                      Is Capital of Governate
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_coastal"
                      checked={formData.is_coastal}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_coastal: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <label htmlFor="is_coastal" className="text-sm font-medium text-gray-700">
                      Is Coastal Area
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    {submitLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingWilayah ? 'Update' : 'Create'} Wilayah
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Wilayah</h3>
                    <p className="text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Wilayah:</strong> {deleteConfirm.name_en} ({deleteConfirm.name_ar})
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Governate:</strong> {deleteConfirm.governate?.name_en}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Places:</strong> {deleteConfirm.place_count} associated places
                  </p>
                </div>

                {deleteConfirm.place_count > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Warning: This wilayah has {deleteConfirm.place_count} associated places. 
                      Deletion may fail if there are dependencies.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={deleteLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {deleteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}