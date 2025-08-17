"use client"
import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, X, AlertCircle } from 'lucide-react';
import WilayahModal from './WilayahModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import WilayahCard from './WilayahCard';
import { SupabaseStorageService } from '@/services/supabaseStorage';
import { ExistingImage } from '@/types/image';

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

  // Image-related API calls
  async uploadWilayahImages(wilayahId, imageData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wilayahs/${wilayahId}/images`, {
        method: 'POST',
        headers: createHeaders(true),
        body: JSON.stringify(imageData),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error uploading wilayah images:', error);
      throw error;
    }
  },

  async updateWilayahImage(wilayahId, imageId, imageData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wilayahs/${wilayahId}/images/${imageId}`, {
        method: 'PUT',
        headers: createHeaders(true),
        body: JSON.stringify(imageData),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error updating wilayah image:', error);
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
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  // Image management states
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    governate_id: '',
    name_ar: '',
    name_en: '',
    subtitle_ar: '',
    subtitle_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    latitude: '',
    longitude: '',
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
      
      setWilayahs(Array.isArray(wilayahsData) ? wilayahsData : []);
      setGovernates(Array.isArray(governatesData) ? governatesData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
      setWilayahs([]);
      setGovernates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWilayahs = Array.isArray(wilayahs) ? wilayahs.filter(wilayah => {
    const matchesSearch = wilayah.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wilayah.name_ar?.includes(searchTerm) ||
                         wilayah.subtitle_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wilayah.subtitle_ar?.includes(searchTerm) ||
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
      subtitle_ar: '',
      subtitle_en: '',
      slug: '',
      description_ar: '',
      description_en: '',
      latitude: '',
      longitude: '',
      sort_order: ''
    });
    setErrors({});
    setEditingWilayah(null);
    setExistingImages([]);
    setNewImageFiles([]);
    setImageUploadProgress(0);
  };

  const openModal = (wilayah = null) => {
    if (wilayah) {
      setEditingWilayah(wilayah);
      setFormData({
        governate_id: wilayah.governate_id,
        name_ar: wilayah.name_ar,
        name_en: wilayah.name_en,
        subtitle_ar: wilayah.subtitle_ar || '',
        subtitle_en: wilayah.subtitle_en || '',
        slug: wilayah.slug,
        description_ar: wilayah.description_ar || '',
        description_en: wilayah.description_en || '',
        latitude: wilayah.latitude?.toString() || '',
        longitude: wilayah.longitude?.toString() || '',
        sort_order: wilayah.sort_order?.toString() || ''
      });
      
      // Load existing images from API response or legacy format
      const images: ExistingImage[] = wilayah.images?.map(img => ({
        id: img.id,
        path: img.image_url ? img.image_url.replace(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_STORAGE_BUCKET}/`, '') : '',
        alt_text: img.alt_text || '',
        caption: '', // Wilayah images don't have captions
        is_primary: img.is_primary || false,
        display_order: img.display_order || 0,
        url: img.image_url
      })) || [];
      
      setExistingImages(images);
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

  // Upload new images to Supabase
  const uploadNewImages = async (wilayahId: string): Promise<ExistingImage[]> => {
    if (newImageFiles.length === 0) return [];

    const uploadedImages: ExistingImage[] = [];
    const totalFiles = newImageFiles.length;
    
    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i];
      
      try {
        const imagesToUpload = [{
          file,
          isPrimary: i === 0 && existingImages.length === 0, // First image is primary if no existing images
          altText: '',
          displayOrder: existingImages.length + i
        }];

        const result = await SupabaseStorageService.uploadWilayahImages(wilayahId, imagesToUpload);
        
        if (result.length > 0) {
          const uploadedImage: ExistingImage = {
            id: `temp-${Date.now()}-${i}`, // Temporary ID, will be replaced by backend
            path: result[0].path,
            alt_text: result[0].altText,
            caption: '',
            is_primary: result[0].isPrimary,
            display_order: result[0].displayOrder,
            url: result[0].url
          };
          
          uploadedImages.push(uploadedImage);
        }

        // Update progress
        const progress = ((i + 1) / totalFiles) * 100;
        setImageUploadProgress(progress);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files
      }
    }

    return uploadedImages;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitLoading(true);
    setError(null);
    setImageUploadProgress(0);
    
    try {
      // Prepare basic wilayah data
      const submitData = {
        governate_id: formData.governate_id,
        name_ar: formData.name_ar.trim(),
        name_en: formData.name_en.trim(),
        subtitle_ar: formData.subtitle_ar.trim() || '',
        subtitle_en: formData.subtitle_en.trim() || '',
        slug: formData.slug.trim(),
        description_ar: formData.description_ar.trim() || '',
        description_en: formData.description_en.trim() || '',
        latitude: formData.latitude ? parseFloat(formData.latitude) : 0,
        longitude: formData.longitude ? parseFloat(formData.longitude) : 0,
        sort_order: formData.sort_order ? parseInt(formData.sort_order) : 0
      };

      let result;
      let wilayahId;

      if (editingWilayah) {
        // Update existing wilayah
        const updateData = {};
        Object.keys(submitData).forEach(key => {
          if (key !== 'governate_id') { // governate_id is not updatable
            updateData[key] = submitData[key];
          }
        });
        
        result = await api.updateWilayah(editingWilayah.id, updateData);
        wilayahId = editingWilayah.id;
      } else {
        // Create new wilayah
        result = await api.createWilayah(submitData);
        wilayahId = result.id || result[0]?.id;
      }

      if (!wilayahId) {
        throw new Error('Failed to get wilayah ID from response');
      }

      // Upload new images if any
      let uploadedImages: ExistingImage[] = [];
      if (newImageFiles.length > 0) {
        uploadedImages = await uploadNewImages(wilayahId);
        
        // Send image metadata to backend
        if (uploadedImages.length > 0) {
          const imageData = uploadedImages.map(img => ({
            image_url: img.url,
            alt_text: img.alt_text,
            is_primary: img.is_primary,
            display_order: img.display_order
          }));
          
          await api.uploadWilayahImages(wilayahId, { images: imageData });
        }
      }

      // Update existing images metadata if changed
      if (editingWilayah && existingImages.length > 0) {
        for (const img of existingImages) {
          if (img.id && !img.id.startsWith('temp-')) {
            try {
              await api.updateWilayahImage(wilayahId, img.id, {
                alt_text: img.alt_text,
                is_primary: img.is_primary,
                display_order: img.display_order
              });
            } catch (error) {
              console.warn('Failed to update image metadata:', error);
            }
          }
        }
      }

      // Update the wilayah in the list
      if (editingWilayah) {
        setWilayahs(prev => Array.isArray(prev) ? prev.map(w => 
          w.id === editingWilayah.id 
            ? { ...w, ...result, images: [...existingImages, ...uploadedImages] }
            : w
        ) : []);
        
        setSuccess('Wilayah updated successfully!');
      } else {
        const newWilayah = Array.isArray(result) ? result[0] : result;
        setWilayahs(prev => Array.isArray(prev) ? [...prev, { ...newWilayah, images: uploadedImages }] : [newWilayah]);
        
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
      setImageUploadProgress(0);
    }
  };

  const handleDelete = async (wilayah) => {
    setDeleteLoading(true);
    setError(null);
    
    try {
      // Delete associated images from storage
      if (wilayah.images && wilayah.images.length > 0) {
        for (const image of wilayah.images) {
          const imagePath = image.image_url ? image.image_url.replace(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_STORAGE_BUCKET}/`, '') : '';
          if (imagePath) {
            await SupabaseStorageService.deleteFile(process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'media-bucket', imagePath);
          }
        }
      }

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

  // Handle form data changes
  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle image changes from SimpleImageSelector
  const handleExistingImagesChange = (images: ExistingImage[]) => {
    setExistingImages(images);
  };

  const handleNewImagesChange = (files: File[]) => {
    setNewImageFiles(files);
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
            <WilayahCard
              key={wilayah.id}
              wilayah={wilayah}
              onEdit={openModal}
              onDelete={setDeleteConfirm}
            />
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

        {/* Modals */}
        <WilayahModal
          showModal={showModal}
          editingWilayah={editingWilayah}
          formData={formData}
          errors={errors}
          governates={governates}
          existingImages={existingImages}
          submitLoading={submitLoading}
          imageUploadProgress={imageUploadProgress}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          onNameEnChange={handleNameEnChange}
          onExistingImagesChange={handleExistingImagesChange}
          onNewImagesChange={handleNewImagesChange}
        />

        <DeleteConfirmationModal
          deleteConfirm={deleteConfirm}
          deleteLoading={deleteLoading}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}