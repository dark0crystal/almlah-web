"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Settings, Save, X, AlertTriangle, Globe, Eye, Search } from 'lucide-react';

// API service functions
const API_HOST = 'http://127.0.0.1:9000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const governateAPI = {
  getAll: async () => {
    try {
      console.log('Fetching governorates from:', `${API_HOST}/api/v1/governates`);
      const response = await fetch(`${API_HOST}/api/v1/governates`, {
        headers: getAuthHeaders()
      });
      console.log('Get all response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Get all response data:', data);
      
      if (!data.success) throw new Error(data.error || 'Failed to fetch governorates');
      return data.data;
    } catch (error) {
      console.error('API getAll error:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_HOST}/api/v1/governates/${id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch governate');
      return data.data;
    } catch (error) {
      console.error('API getById error:', error);
      throw error;
    }
  },

  create: async (governateData) => {
    console.log('Creating governate with data:', governateData);
    try {
      const response = await fetch(`${API_HOST}/api/v1/governates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(governateData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data.success) throw new Error(data.error || 'Failed to create governate');
      return data.data;
    } catch (error) {
      console.error('API create error:', error);
      throw error;
    }
  },

  update: async (id, governateData) => {
    try {
      const response = await fetch(`${API_HOST}/api/v1/governates/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(governateData)
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to update governate');
      return data.data;
    } catch (error) {
      console.error('API update error:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_HOST}/api/v1/governates/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete governate');
      return data.data;
    } catch (error) {
      console.error('API delete error:', error);
      throw error;
    }
  },

  getWilayahs: async (id) => {
    try {
      const response = await fetch(`${API_HOST}/api/v1/governates/${id}/wilayahs`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch wilayahs');
      return data.data;
    } catch (error) {
      console.error('API getWilayahs error:', error);
      throw error;
    }
  }
};

// Utility functions
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to get display name based on current language
const getDisplayName = (item, currentLang) => {
  if (!item) return '';
  return currentLang === 'ar' ? item.name_ar : item.name_en;
};

const getDisplayDescription = (item, currentLang) => {
  if (!item) return '';
  return currentLang === 'ar' ? item.description_ar : item.description_en;
};

// Simple Login Modal Component
const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Mock login for demo - replace with your actual authentication logic
      if (credentials.username === 'admin' && credentials.password === 'password') {
        const mockToken = 'mock-jwt-token-12345';
        localStorage.setItem('authToken', mockToken);
        onLogin(mockToken);
        onClose();
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Login Required</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            <strong>Demo credentials:</strong><br />
            Username: admin<br />
            Password: password
          </p>
        </div>
      </div>
    </div>
  );
};

// Governate Form Modal Component
const GovernateFormModal = ({ isOpen, onClose, governate, onSave, currentLang }) => {
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    latitude: '',
    longitude: '',
    sort_order: 0
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (governate) {
      setFormData({
        name_ar: governate.name_ar || '',
        name_en: governate.name_en || '',
        slug: governate.slug || '',
        description_ar: governate.description_ar || '',
        description_en: governate.description_en || '',
        latitude: governate.latitude || '',
        longitude: governate.longitude || '',
        sort_order: governate.sort_order || 0
      });
    } else {
      setFormData({
        name_ar: '',
        name_en: '',
        slug: '',
        description_ar: '',
        description_en: '',
        latitude: '',
        longitude: '',
        sort_order: 0
      });
    }
    setErrors({});
  }, [governate, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from English name
    if (name === 'name_en' && !governate) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name_ar.trim()) newErrors.name_ar = 'Arabic name is required';
    if (!formData.name_en.trim()) newErrors.name_en = 'English name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';

    // Validate numeric fields
    if (formData.latitude && (isNaN(formData.latitude) || Math.abs(parseFloat(formData.latitude)) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude && (isNaN(formData.longitude) || Math.abs(parseFloat(formData.longitude)) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = { ...formData };
      
      // Convert numeric fields
      if (submitData.latitude) submitData.latitude = parseFloat(submitData.latitude);
      if (submitData.longitude) submitData.longitude = parseFloat(submitData.longitude);
      if (submitData.sort_order) submitData.sort_order = parseInt(submitData.sort_order) || 0;

      // Remove empty strings
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          delete submitData[key];
        }
      });

      console.log('Submitting form data:', submitData);

      if (governate) {
        await onSave(governate.id, submitData);
      } else {
        await onSave(null, submitData);
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {governate ? 'Edit Governate' : 'Add New Governate'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={16} />
              <span className="text-red-700 text-sm">{errors.general}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arabic Name *
              </label>
              <input
                type="text"
                name="name_ar"
                value={formData.name_ar}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name_ar ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="الاسم بالعربية"
                dir="rtl"
              />
              {errors.name_ar && <p className="text-red-500 text-sm mt-1">{errors.name_ar}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Name *
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name_en ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Governate name in English"
              />
              {errors.name_en && <p className="text-red-500 text-sm mt-1">{errors.name_en}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.slug ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="governate-slug"
            />
            {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arabic Description
              </label>
              <textarea
                name="description_ar"
                value={formData.description_ar}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="الوصف بالعربية"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Description
              </label>
              <textarea
                name="description_en"
                value={formData.description_en}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description in English"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="0.000001"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.latitude ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.000000"
              />
              {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="0.000001"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.longitude ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.000000"
              />
              {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p className="text-sm text-gray-500 mt-1">
              Lower numbers appear first. Use this to control the display order.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
              disabled={loading}
            >
              <Save className="mr-2" size={16} />
              {loading ? 'Saving...' : 'Save Governate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, governate, onConfirm, loading, currentLang }) => {
  if (!isOpen || !governate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" size={24} />
          <h2 className="text-lg font-semibold">Delete Governate</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Are you sure you want to delete <strong>"{getDisplayName(governate, currentLang)}"</strong>?
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
            <p className="text-yellow-800 text-sm font-medium">⚠️ This action cannot be undone.</p>
          </div>

          {governate.wilayah_count > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm font-medium">
                🏘️ This governate has {governate.wilayah_count} wilayahs that will also be deleted.
              </p>
            </div>
          )}

          {governate.place_count > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-3">
              <p className="text-orange-700 text-sm">
                📍 This governate is associated with {governate.place_count} places.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />
                Delete Governate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Governate Card Component
const GovernateCard = ({ governate, onEdit, onDelete, onViewWilayahs, currentLang }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {getDisplayName(governate, currentLang)}
            </h3>
            <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
              {governate.slug}
            </p>
            {governate.latitude && governate.longitude && (
              <p className="text-sm text-gray-600 mt-2">
                <MapPin className="inline mr-1" size={14} />
                {governate.latitude.toFixed(4)}, {governate.longitude.toFixed(4)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-1 text-xs rounded-full ${
              governate.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {governate.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          {getDisplayDescription(governate, currentLang) && (
            <p className="italic">{getDisplayDescription(governate, currentLang)}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Wilayahs:</span>
            <span className="ml-1 font-medium">{governate.wilayah_count || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Places:</span>
            <span className="ml-1 font-medium">{governate.place_count || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Sort Order:</span>
            <span className="ml-1 font-medium">{governate.sort_order || 0}</span>
          </div>
        </div>

        {currentLang === 'both' && (
          <div className="text-xs text-gray-500 mb-4 space-y-1 p-2 bg-gray-50 rounded">
            <div><strong>AR:</strong> {governate.name_ar}</div>
            <div><strong>EN:</strong> {governate.name_en}</div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => onViewWilayahs(governate)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <Eye size={14} className="mr-1" />
            View Wilayahs ({governate.wilayah_count || 0})
          </button>
          
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(governate)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
              title="Edit governate"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(governate)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
              title="Delete governate"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main ManageGovernorate Component
export default function ManageGovernorate() {
  const [governorates, setGovernorates] = useState([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedGovernate, setSelectedGovernate] = useState(null);
  const [currentLang, setCurrentLang] = useState('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [apiStatus, setApiStatus] = useState('testing'); // 'testing', 'connected', 'error'
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Test API connection on component mount
  useEffect(() => {
    testApiConnection();
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const testApiConnection = async () => {
    try {
      setApiStatus('testing');
      const response = await fetch(`${API_HOST}/api/v1/governates`, { 
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log('API Test Response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      if (response.ok) {
        setApiStatus('connected');
        loadGovernorates();
      } else {
        setApiStatus('error');
        setError(`API Connection Failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('API Connection Test Failed:', err);
      setApiStatus('error');
      setError(`Cannot connect to API: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter governorates based on search term
    if (searchTerm.trim()) {
      const filtered = governorates.filter(gov => 
        gov.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gov.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gov.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGovernorates(filtered);
    } else {
      setFilteredGovernorates(governorates);
    }
  }, [searchTerm, governorates]);

  const loadGovernorates = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      const data = await governateAPI.getAll();
      console.log('Loaded governorates:', data);
      setGovernorates(data || []);
      setFilteredGovernorates(data || []);
    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error loading governorates:', err);
      setGovernorates([]);
      setFilteredGovernorates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token) => {
    setIsAuthenticated(true);
    localStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
  };

  const handleAuthError = (error) => {
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      setShowLoginModal(true);
    }
  };

  const handleSaveGovernate = async (id, governateData) => {
    try {
      if (id) {
        await governateAPI.update(id, governateData);
      } else {
        await governateAPI.create(governateData);
      }
      await loadGovernorates();
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  };

  const handleDeleteGovernate = async () => {
    if (!selectedGovernate) return;
    
    try {
      setLoading(true);
      await governateAPI.delete(selectedGovernate.id);
      await loadGovernorates();
      setShowDeleteModal(false);
      setSelectedGovernate(null);
    } catch (err) {
      handleAuthError(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWilayahs = async (governate) => {
    try {
      const wilayahs = await governateAPI.getWilayahs(governate.id);
      console.log('Wilayahs for', governate.name_en, ':', wilayahs);
      // You could open a modal or navigate to a new page here
      alert(`Found ${wilayahs.length} wilayahs for ${governate.name_en}`);
    } catch (err) {
      console.error('Error fetching wilayahs:', err);
      setError('Failed to load wilayahs');
    }
  };

  if (loading || apiStatus === 'testing') {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <div className="text-gray-600 mb-4">
          {apiStatus === 'testing' ? 'Testing API connection...' : 'Loading governorates...'}
        </div>
        {apiStatus === 'testing' && (
          <div className="text-sm text-gray-500 text-center">
            <p>Connecting to: {API_HOST}/api/v1/governates</p>
            <div className="mt-2">
              <button 
                onClick={testApiConnection}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (apiStatus === 'error') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            <h2 className="text-lg font-semibold text-red-700">API Connection Error</h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>API Host:</strong> {API_HOST}</p>
            <p><strong>Endpoint:</strong> /api/v1/governates</p>
          </div>
          <div className="space-y-2">
            <button 
              onClick={testApiConnection}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 mr-2"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => {
                setError('');
                setApiStatus('connected');
                setGovernorates([]);
                setFilteredGovernorates([]);
                setLoading(false);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Continue Offline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Manage Governorates</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                isAuthenticated 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isAuthenticated ? '🔒 Authenticated' : '🔓 Not Authenticated'}
              </span>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Login
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                  return;
                }
                setSelectedGovernate(null);
                setShowModal(true);
              }}
              className={`px-4 py-2 rounded-md flex items-center ${
                isAuthenticated 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
              disabled={!isAuthenticated}
            >
              <Plus className="mr-2" size={20} />
              Add Governorate
            </button>
          </div>
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
              <Search className="text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search governorates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Globe className="text-gray-500" size={16} />
              <label className="text-sm font-medium text-gray-700">Language:</label>
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="both">Both Languages</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {searchTerm ? (
              <span>
                Found {filteredGovernorates.length} of {governorates.length} governorates
              </span>
            ) : (
              <span>Total: {governorates.length} governorates</span>
            )}
          </div>
        </div>
      </div>

      {filteredGovernorates.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredGovernorates.map(governate => (
            <GovernateCard
              key={governate.id}
              governate={governate}
              onEdit={(gov) => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                  return;
                }
                setSelectedGovernate(gov);
                setShowModal(true);
              }}
              onDelete={(gov) => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                  return;
                }
                setSelectedGovernate(gov);
                setShowDeleteModal(true);
              }}
              onViewWilayahs={handleViewWilayahs}
              currentLang={currentLang}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {searchTerm ? (
            <div className="text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No governorates found matching "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="text-gray-500">
              <Settings size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No governorates found. Create your first governorate to get started.</p>
              {!isAuthenticated && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Login to add governorates
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      <GovernateFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedGovernate(null);
          setError('');
        }}
        governate={selectedGovernate}
        onSave={handleSaveGovernate}
        currentLang={currentLang}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGovernate(null);
        }}
        governate={selectedGovernate}
        onConfirm={handleDeleteGovernate}
        loading={loading}
        currentLang={currentLang}
      />
    </div>
  );
}