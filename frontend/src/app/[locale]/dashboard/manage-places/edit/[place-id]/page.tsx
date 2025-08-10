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
  Star
} from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api/v1';

// API Services
const placeService = {
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

  updatePlace: async (placeId, data) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update place: ${response.statusText}`);
    }

    return response.json();
  },

  uploadImages: async (placeId, images) => {
    const formData = new FormData();
    
    // Add the JSON data
    formData.append('data', JSON.stringify({ images }));
    
    // Add image files
    images.forEach((image, index) => {
      if (image.file) {
        formData.append(`images[${index}]`, image.file);
      }
    });

    const response = await fetch(`${API_BASE_URL}/places/${placeId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload images: ${response.statusText}`);
    }

    return response.json();
  },

  deleteImage: async (imageId) => {
    const response = await fetch(`${API_BASE_URL}/places/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }

    return response.json();
  },

  createContentSection: async (placeId, sectionData) => {
    const response = await fetch(`${API_BASE_URL}/places/${placeId}/content-sections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete content section: ${response.statusText}`);
    }

    return response.json();
  }
};

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
  },

  getWilayahs: async (governateId) => {
    const response = await fetch(`${API_BASE_URL}/wilayahs?governate_id=${governateId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// Image Management Component
const ImageManager = ({ images, onImagesChange, onImageDelete }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files) => {
    const newImages = Array.from(files).map((file, index) => ({
      id: `temp_${Date.now()}_${index}`,
      file,
      imageUrl: URL.createObjectURL(file),
      altText: '',
      isPrimary: images.length === 0 && index === 0,
      displayOrder: images.length + index + 1,
      isNew: true
    }));

    onImagesChange([...images, ...newImages]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const updateImage = (imageId, updates) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    );
    onImagesChange(updatedImages);
  };

  const setPrimaryImage = (imageId) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Images</h3>
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          <Upload className="w-4 h-4" />
          Upload Images
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </label>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
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
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </label>
        </p>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden">
              <div className="relative">
                <img
                  src={image.imageUrl || image.image_url}
                  alt={image.altText || 'Place image'}
                  className="w-full h-32 object-cover"
                />
                
                {/* Primary badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Primary
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!image.isPrimary && (
                    <button
                      onClick={() => setPrimaryImage(image.id)}
                      className="w-7 h-7 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100"
                      title="Set as primary"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onImageDelete(image.id)}
                    className="w-7 h-7 bg-red-500 bg-opacity-90 text-white rounded-full flex items-center justify-center hover:bg-opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <input
                  type="text"
                  placeholder="Alt text"
                  value={image.altText || ''}
                  onChange={(e) => updateImage(image.id, { altText: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Content Section Component
const ContentSectionEditor = ({ sections, onSectionsChange }) => {
  const addSection = () => {
    const newSection = {
      id: `temp_${Date.now()}`,
      sectionType: 'history',
      titleAr: '',
      titleEn: '',
      contentAr: '',
      contentEn: '',
      sortOrder: sections.length + 1,
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

  const deleteSection = (sectionId) => {
    const updatedSections = sections.filter(section => section.id !== sectionId);
    onSectionsChange(updatedSections);
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
        <h3 className="text-lg font-medium">Content Sections</h3>
        <button
          onClick={addSection}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {sections.map((section, index) => (
        <div key={section.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <select
                value={section.sectionType}
                onChange={(e) => updateSection(section.id, { sectionType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {sectionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">Section {index + 1}</span>
            </div>
            <button
              onClick={() => deleteSection(section.id)}
              className="text-red-600 hover:text-red-800"
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
                value={section.titleAr}
                onChange={(e) => updateSection(section.id, { titleAr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="العنوان بالعربية"
              />
              
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                Content (Arabic)
              </label>
              <textarea
                value={section.contentAr}
                onChange={(e) => updateSection(section.id, { contentAr: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                value={section.titleEn}
                onChange={(e) => updateSection(section.id, { titleEn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Title in English"
              />
              
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                Content (English)
              </label>
              <textarea
                value={section.contentEn}
                onChange={(e) => updateSection(section.id, { contentEn: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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

  const [images, setImages] = useState([]);
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
        
        // Set form data
        setFormData({
          nameAr: placeData.name_ar || '',
          nameEn: placeData.name_en || '',
          descriptionAr: placeData.description_ar || '',
          descriptionEn: placeData.description_en || '',
          subtitleAr: placeData.subtitle_ar || '',
          subtitleEn: placeData.subtitle_en || '',
          governateId: placeData.governate_id || '',
          wilayahId: placeData.wilayah_id || '',
          latitude: placeData.latitude || '',
          longitude: placeData.longitude || '',
          phone: placeData.phone || '',
          email: placeData.email || '',
          website: placeData.website || '',
          categoryIds: placeData.categories?.map(cat => cat.id) || []
        });

        setImages(placeData.images || []);
        setContentSections(placeData.content_sections || []);
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

  const handleImageDelete = async (imageId) => {
    try {
      if (imageId.toString().startsWith('temp_')) {
        // Remove temporary image
        setImages(images.filter(img => img.id !== imageId));
      } else {
        // Delete from server
        await placeService.deleteImage(imageId);
        setImages(images.filter(img => img.id !== imageId));
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image');
    }
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

      // Update place
      await placeService.updatePlace(placeId, updateData);

      // Handle new images
      const newImages = images.filter(img => img.isNew);
      if (newImages.length > 0) {
        const imageData = newImages.map(img => ({
          imageUrl: img.imageUrl,
          altText: img.altText,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder
        }));
        await placeService.uploadImages(placeId, imageData);
      }

      // Handle content sections
      for (const section of contentSections) {
        const sectionData = {
          section_type: section.sectionType,
          title_ar: section.titleAr,
          title_en: section.titleEn,
          content_ar: section.contentAr,
          content_en: section.contentEn,
          sort_order: section.sortOrder
        };

        if (section.isNew) {
          await placeService.createContentSection(placeId, sectionData);
        } else {
          await placeService.updateContentSection(placeId, section.id, sectionData);
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload place data
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
                    Name (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => handleInputChange('nameAr', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="اسم المكان بالعربية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => handleInputChange('nameEn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Place name in English"
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
                    onChange={(e) => handleInputChange('governateId', e.target.value)}
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
              <ImageManager
                images={images}
                onImagesChange={setImages}
                onImageDelete={handleImageDelete}
              />
            </div>

            {/* Content Sections */}
            <div className="bg-white rounded-lg border p-6">
              <ContentSectionEditor
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
            </div>

            {/* Place Stats */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-medium mb-4">Place Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Images</span>
                  <span className="text-sm font-medium">{images.length}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}