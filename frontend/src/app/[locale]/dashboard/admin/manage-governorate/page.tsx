"use client"
import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Settings, Search, Globe, X } from 'lucide-react';
import { LoginModal } from './LoginModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { GovernateCard } from './GovernateCard';
import { GovernateFormModal } from './GovernateFormModal';

// Type definitions
interface Governate {
  id: string;
  name_ar: string;
  name_en: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  slug: string;
  description_ar?: string;
  description_en?: string;
  latitude?: string;
  longitude?: string;
  sort_order: number;
  images?: GovernateImage[];
  gallery_images?: string;
}

interface GovernateImage {
  id: string;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

interface GovernateFormData {
  name_ar: string;
  name_en: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  slug: string;
  description_ar?: string;
  description_en?: string;
  latitude?: string;
  longitude?: string;
  sort_order: number;
  gallery_images: any[];
}

// API service functions
const API_HOST = 'http://localhost:9000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
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
      console.log('Get all response data:', data);
      
      if (!data.success) throw new Error(data.error || 'Failed to fetch governorates');
      return data.data;
    } catch (error) {
      console.error('API getAll error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
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

  create: async (governateData: GovernateFormData) => {
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
      return data.data; // Return the created governate with ID
    } catch (error) {
      console.error('API create error:', error);
      throw error;
    }
  },

  update: async (id: string, governateData: GovernateFormData) => {
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
      return data.data; // Return the updated governate
    } catch (error) {
      console.error('API update error:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
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

  getWilayahs: async (id: string) => {
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

// Main ManageGovernorate Component
export default function ManageGovernorate() {
  const [governorates, setGovernorates] = useState<Governate[]>([]);
  const [filteredGovernorates, setFilteredGovernorates] = useState<Governate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedGovernate, setSelectedGovernate] = useState<Governate | null>(null);
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
      setError(`Cannot connect to API: ${(err as Error).message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter governorates based on search term
    if (searchTerm.trim()) {
      const filtered = governorates.filter(gov => 
        gov.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gov.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gov.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gov.subtitle_ar && gov.subtitle_ar.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (gov.subtitle_en && gov.subtitle_en.toLowerCase().includes(searchTerm.toLowerCase()))
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
      const errorMessage = (err as Error).message || 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error loading governorates:', err);
      setGovernorates([]);
      setFilteredGovernorates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
  };

  const handleAuthError = (error: Error) => {
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      setShowLoginModal(true);
    }
  };

  const handleSaveGovernate = async (id: string | null, governateData: GovernateFormData) => {
    try {
      let result;
      if (id) {
        result = await governateAPI.update(id, governateData);
      } else {
        result = await governateAPI.create(governateData);
      }
      await loadGovernorates();
      return result; // Return the result so the modal can access the created/updated governate
    } catch (err) {
      handleAuthError(err as Error);
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
      handleAuthError(err as Error);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWilayahs = async (governate: Governate) => {
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