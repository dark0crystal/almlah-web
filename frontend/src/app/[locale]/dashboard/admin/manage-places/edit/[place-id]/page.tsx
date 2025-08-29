
"use client"
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload,
  FileImage,
  MapPin,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Eye,
  Move,
  Star,
  RefreshCw,
  Edit
} from 'lucide-react';

// Import the enhanced services from the previous component
import { placeService } from '../../ManagePlaces'; // Adjust import path as needed
import SimpleImageManager from '../../SimpleImageManager';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api/v1';

const metaService = {
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  getGovernates: async () => {
    const response = await fetch(`${API_BASE_URL}/governates`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  getWilayahs: async (governateId) => {
    const response = await fetch(`${API_BASE_URL}/wilayahs?governate_id=${governateId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// Content Section Services
const contentSectionService = {
  createContentSection: async (placeId, sectionData) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}/content-sections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sectionData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create content section: ${response.statusText}`);
    }

    return response.json();
  },

  updateContentSection: async (placeId, sectionId, sectionData) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}/content-sections/${sectionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sectionData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update content section: ${response.statusText}`);
    }

    return response.json();
  },

  deleteContentSection: async (placeId, sectionId) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}/content-sections/${sectionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete content section: ${response.statusText}`);
    }

    return response.json();
  }
};

// Enhanced Image Manager Component for Place Edit
const PlaceImageManager = ({ placeId, onImageCountChange }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (placeId) {
      loadImages();
    }
  }, [placeId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await placeService.getPlaceImages(placeId);
      if (response.success) {
        const imageData = response.data || [];
        setImages(imageData);
        onImageCountChange?.(imageData.length);
      }
    } catch (err) {
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const fileArray = Array.from(files);
      
      // Validate files
      for (const file of fileArray) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image.`);
        }
      }

      // Prepare image data
      const imageData = fileArray.map((file, index) => ({
        altText: '',
        isPrimary: images.length === 0 && index === 0,
        displayOrder: images.length + index + 1
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload images
      const response = await placeService.uploadImages(placeId, fileArray, imageData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        // Reload images from backend
        await loadImages();
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      alert(`Failed to upload images: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const updateImageMetadata = async (imageId, updates) => {
    try {
      const response = await placeService.updateImage(placeId, imageId, updates);
      if (response.success) {
        await loadImages();
      }
    } catch (err) {
      console.error('Error updating image:', err);
      alert(`Failed to update image: ${err.message}`);
    }
  };

  const deleteImage = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await placeService.deleteImage(placeId, imageId);
      if (response.success) {
        await loadImages();
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert(`Failed to delete image: ${err.message}`);
    }
  };

  const setPrimaryImage = async (imageId) => {
    try {
      const response = await placeService.updateImage(placeId, imageId, { is_primary: true });
      if (response.success) {
        await loadImages();
      }
    } catch (err) {
      console.error('Error setting primary image:', err);
      alert(`Failed to set primary image: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Images ({images.length})</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadImages}
            disabled={loading || uploading}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50">
            <Upload className="w-4 h-4" />
            Upload Images
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">Uploading images... {uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          Drag and drop images here, or{' '}
          <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
            click to browse
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: JPG, PNG, WebP, GIF (max 10MB each)
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading images...</span>
        </div>
      )}

      {/* Images Grid */}
      {!loading && images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden">
              <div className="relative">
                <img
                  src={image.image_url}
                  alt={image.alt_text || 'Place image'}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
                
                {/* Primary badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Primary
                  </div>
                )}

                {/* Display order badge */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  #{image.display_order}
                </div>

                {/* Actions */}
                <div className="absolute bottom-2 right-2 flex gap-1">
                  {!image.is_primary && (
                    <button
                      onClick={() => setPrimaryImage(image.id)}
                      className="w-7 h-7 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100"
                      title="Set as primary"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="w-7 h-7 bg-red-500 bg-opacity-90 text-white rounded-full flex items-center justify-center hover:bg-opacity-100"
                    title="Delete image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <input
                  type="text"
                  placeholder="Alt text (for accessibility)"
                  value={image.alt_text || ''}
                  onChange={(e) => {
                    // Update local state immediately for better UX
                    setImages(prev => prev.map(img => 
                      img.id === image.id ? { ...img, alt_text: e.target.value } : img
                    ));
                  }}
                  onBlur={(e) => updateImageMetadata(image.id, { alt_text: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Order: {image.display_order}</span>
                  <span>
                    {new Date(image.upload_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && images.length === 0 && (
        <div className="text-center py-8">
          <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-600 mb-4">
            Upload some images to showcase this place
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload First Image
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>
        </div>
      )}
    </div>
  );
};

// Content Section Editor Component
const ContentSectionEditor = ({ placeId, sections, onSectionsChange }) => {
  const [saving, setSaving] = useState(false);

  const addSection = () => {
    const newSection = {
      id: `temp_${Date.now()}`,
      section_type: 'history',
      title_ar: '',
      title_en: '',
      content_ar: '',
      content_en: '',
      sort_order: sections.length + 1,
      is_active: true,
      isNew: true
    };
    onSectionsChange([...sections, newSection]);
  };

  const updateSection = (sectionId, updates) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    onSectionsChange(updatedSections);
  };

  const deleteSection = async (sectionId, isNew = false) => {
    if (!confirm('Are you sure you want to delete this content section?')) return;

    try {
      setSaving(true);

      if (!isNew) {
        // Delete from backend
        await contentSectionService.deleteContentSection(placeId, sectionId);
      }

      // Remove from local state
      const updatedSections = sections.filter(section => section.id !== sectionId);
      onSectionsChange(updatedSections);
    } catch (err) {
      console.error('Error deleting section:', err);
      alert(`Failed to delete section: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const sectionTypes = [
    { value: 'history', label: 'History' },
    { value: 'activities', label: 'Activities' },
    { value: 'facilities', label: 'Facilities' },
    { value: 'location', label: 'Location Info' },
    { value: 'tips', label: 'Tips' },
    { value: 'events', label: 'Events' },
    { value: 'culture', label: 'Culture' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Content Sections ({sections.length})</h3>
        <button
          onClick={addSection}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {sections.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content sections yet</h3>
          <p className="text-gray-600 mb-4">
            Add content sections to provide detailed information about this place
          </p>
          <button
            onClick={addSection}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add First Section
          </button>
        </div>
      )}

      {sections.map((section, index) => (
        <div key={section.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <select
                value={section.section_type}
                onChange={(e) => updateSection(section.id, { section_type: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {sectionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">Section {index + 1}</span>
              {section.isNew && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  New
                </span>
              )}
            </div>
            <button
              onClick={() => deleteSection(section.id, section.isNew)}
              disabled={saving}
              className="text-red-600 hover:text-red-800 disabled:opacity-50"
              title="Delete section"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arabic Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (Arabic)
              </label>
              <input
                type="text"
                value={section.title_ar}
                onChange={(e) => updateSection(section.id, { title_ar: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                placeholder="العنوان بالعربية"
              />
              
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                Content (Arabic)
              </label>
              <textarea
                value={section.content_ar}
                onChange={(e) => updateSection(section.id, { content_ar: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                placeholder="المحتوى بالعربية..."
              />
            </div>

            {/* English Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (English)
              </label>
              <input
                type="text"
                value={section.title_en}
                onChange={(e) => updateSection(section.id, { title_en: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                placeholder="Title in English"
              />
              
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                Content (English)
              </label>
              <textarea
                value={section.content_en}
                onChange={(e) => updateSection(section.id, { content_en: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                placeholder="Content in English..."
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Edit Component
export default function PlaceEdit() {
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    subtitleAr: '',
    subtitleEn: '',
    governateId: '',
    wilayahId: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    website: '',
    categoryIds: []
  });

  const [contentSections, setContentSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [governates, setGovernates] = useState([]);
  const [wilayahs, setWilayahs] = useState([]);

  // Get place ID from URL
  const placeId = window.location.pathname.split('/').pop();

  useEffect(() => {
    loadPlace();
    loadCategories();
    loadGovernates();
  }, []);

  useEffect(() => {
    if (formData.governateId) {
      loadWilayahs(formData.governateId);
    }
  }, [formData.governateId]);

  const loadPlace = async () => {
    try {
      setLoading(true);
      const response = await placeService.getPlaceById(placeId);
      
      if (response.success) {
        const placeData = response.data;
        setPlace(placeData);
        
        // Set form data - handle both snake_case and camelCase
        setFormData({
          nameAr: placeData.name_ar || '',
          nameEn: placeData.name_en || '',
          descriptionAr: placeData.description_ar || '',
          descriptionEn: placeData.description_en || '',
          subtitleAr: placeData.subtitle_ar || '',
          subtitleEn: placeData.subtitle_en || '',
          governateId: placeData.governate?.id || '',
          wilayahId: placeData.wilayah?.id || '',
          latitude: placeData.latitude || '',
          longitude: placeData.longitude || '',
          phone: placeData.phone || '',
          email: placeData.email || '',
          website: placeData.website || '',
          categoryIds: placeData.categories?.map(cat => cat.id) || []
        });

        setContentSections(placeData.content_sections || []);
        setImageCount(placeData.images?.length || 0);
      }
    } catch (err) {
      console.error('Error loading place:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const loadWilayahs = async (governateId) => {
    try {
      const response = await metaService.getWilayahs(governateId);
      if (response.success) {
        setWilayahs(response.data || []);
      }
    } catch (err) {
      console.error('Error loading wilayahs:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (categoryId, checked) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: checked 
        ? [...prev.categoryIds, categoryId]
        : prev.categoryIds.filter(id => id !== categoryId)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare place data
      const updateData = {
        name_ar: formData.nameAr,
        name_en: formData.nameEn,
        description_ar: formData.descriptionAr,
        description_en: formData.descriptionEn,
        subtitle_ar: formData.subtitleAr,
        subtitle_en: formData.subtitleEn,
        governate_id: formData.governateId || null,
        wilayah_id: formData.wilayahId || null,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        category_ids: formData.categoryIds
      };

      // Update place basic info
      await placeService.updatePlace(placeId, updateData);

      // Handle content sections
      for (const section of contentSections) {
        const sectionData = {
          section_type: section.section_type,
          title_ar: section.title_ar,
          title_en: section.title_en,
          content_ar: section.content_ar,
          content_en: section.content_en,
          sort_order: section.sort_order
        };

        if (section.isNew) {
          await contentSectionService.createContentSection(placeId, sectionData);
        } else {
          await contentSectionService.updateContentSection(placeId, section.id, sectionData);
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload place data to get updated content
      await loadPlace();
    } catch (err) {
      console.error('Error saving place:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading place...</p>
        </div>
      </div>
    );
  }

  if (error && !place) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Place</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Edit Place: {place?.name_en}
                </h1>
                <p className="text-sm text-gray-600">{place?.name_ar}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {success && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Saved successfully!</span>
                </div>
              )}
              
              <button
                onClick={() => window.open(`/places/${placeId}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Arabic) *
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => handleInputChange('nameAr', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="اسم المكان بالعربية"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => handleInputChange('nameEn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Place name in English"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitleAr}
                    onChange={(e) => handleInputChange('subtitleAr', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="العنوان الفرعي بالعربية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle (English)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitleEn}
                    onChange={(e) => handleInputChange('subtitleEn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Subtitle in English"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => handleInputChange('descriptionAr', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="وصف المكان بالعربية..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={formData.descriptionEn}
                    onChange={(e) => handleInputChange('descriptionEn', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Place description in English..."
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Governate
                  </label>
                  <select
                    value={formData.governateId}
                    onChange={(e) => {
                      handleInputChange('governateId', e.target.value);
                      handleInputChange('wilayahId', ''); // Reset wilayah when governate changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Governate</option>
                    {governates.map((governate) => (
                      <option key={governate.id} value={governate.id}>
                        {governate.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wilayah
                  </label>
                  <select
                    value={formData.wilayahId}
                    onChange={(e) => handleInputChange('wilayahId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.governateId}
                  >
                    <option value="">Select Wilayah</option>
                    {wilayahs.map((wilayah) => (
                      <option key={wilayah.id} value={wilayah.id}>
                        {wilayah.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="23.5859"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="58.4059"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-medium mb-4">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+968 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="info@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <ExternalLink className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-lg border p-6">
              <PlaceImageManager 
                placeId={placeId}
                onImageCountChange={setImageCount}
              />
            </div>

            {/* Content Sections */}
            <div className="bg-white rounded-lg border p-6">
              <ContentSectionEditor
                placeId={placeId}
                sections={contentSections}
                onSectionsChange={setContentSections}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Categories</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {category.name_en}
                    </span>
                    <span className="ml-1 text-xs text-gray-500">
                      ({category.name_ar})
                    </span>
                  </label>
                ))}
              </div>
              {categories.length === 0 && (
                <p className="text-sm text-gray-500">No categories available</p>
              )}
            </div>

            {/* Place Stats */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Place Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Images</span>
                  <span className="text-sm font-medium">{imageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Content Sections</span>
                  <span className="text-sm font-medium">{contentSections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Categories</span>
                  <span className="text-sm font-medium">{formData.categoryIds.length}</span>
                </div>
                {place && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="text-sm font-medium">
                        {new Date(place.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-medium">
                        {new Date(place.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => window.open(`/places/${placeId}`, '_blank')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  <Eye className="w-4 h-4" />
                  View Place
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/places/${placeId}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  Copy Link
                </button>
                {formData.latitude && formData.longitude && (
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${formData.latitude},${formData.longitude}`, '_blank')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Maps
                  </button>
                )}
              </div>
            </div>

            {/* Save Progress */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Auto-Save</h3>
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  Changes are saved manually. Don't forget to save your progress!
                </p>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save All Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}