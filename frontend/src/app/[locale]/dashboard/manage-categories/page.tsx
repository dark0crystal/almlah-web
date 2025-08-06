"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Folder, Tag, Settings, Save, X, AlertTriangle } from 'lucide-react';

// API service functions with host
const API_HOST = 'http://127.0.0.1:9000';

const categoryAPI = {
  getAll: async () => {
    const response = await fetch(`${API_HOST}/api/v1/categories`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch categories');
    return data.data;
  },

  getHierarchy: async () => {
    const response = await fetch(`${API_HOST}/api/v1/categories/hierarchy`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch hierarchy');
    return data.data;
  },

  getPrimary: async () => {
    const response = await fetch(`${API_HOST}/api/v1/categories/primary`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch primary categories');
    return data.data;
  },

  create: async (categoryData) => {
    console.log('Creating category with data:', categoryData);
    const response = await fetch(`${API_HOST}/api/v1/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}: Failed to create category`);
    }
    if (!data.success) throw new Error(data.error || 'Failed to create category');
    return data.data;
  },

  update: async (id, categoryData) => {
    const response = await fetch(`${API_HOST}/api/v1/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to update category');
    return data.data;
  },

  delete: async (id) => {
    const response = await fetch(`${API_HOST}/api/v1/categories/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete category');
    return data.data;
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

// Category Form Modal Component
const CategoryFormModal = ({ isOpen, onClose, category, primaryCategories, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    type: 'primary',
    parent_id: null,
    sort_order: 0
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        icon: category.icon || '',
        type: category.type || 'primary',
        parent_id: category.parent_id || null,
        sort_order: category.sort_order || 0
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        type: 'primary',
        parent_id: null,
        sort_order: 0
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));

    // Auto-generate slug from name
    if (name === 'name' && !category) {
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

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      type,
      parent_id: type === 'primary' ? null : prev.parent_id
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (formData.type === 'secondary' && !formData.parent_id) {
      newErrors.parent_id = 'Parent category is required for secondary categories';
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
      
      // Ensure primary categories have null parent_id
      if (submitData.type === 'primary') {
        submitData.parent_id = null;
      }
      
      // Convert numeric fields
      if (submitData.sort_order !== null && submitData.sort_order !== '') {
        submitData.sort_order = parseInt(submitData.sort_order, 10) || 0;
      } else {
        submitData.sort_order = 0;
      }
      
      // Convert parent_id to number if it's not null
      if (submitData.parent_id !== null && submitData.parent_id !== '') {
        submitData.parent_id = parseInt(submitData.parent_id, 10);
      }
      
      // Remove empty strings, convert to null
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
        // Trim string values
        if (typeof submitData[key] === 'string') {
          submitData[key] = submitData[key].trim();
        }
      });

      console.log('Submitting form data:', submitData);

      if (category) {
        await onSave(category.id, submitData);
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {category ? 'Edit Category' : 'Add New Category'}
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Category name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
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
              placeholder="category-slug"
            />
            {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Category description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <input
              type="text"
              name="icon"
              value={formData.icon}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Icon name or emoji"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleTypeChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>

          {formData.type === 'secondary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category *
              </label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.parent_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select parent category</option>
                {primaryCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.parent_id && <p className="text-red-500 text-sm mt-1">{errors.parent_id}</p>}
            </div>
          )}

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
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
              disabled={loading}
            >
              <Save className="mr-2" size={16} />
              {loading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, category, onConfirm, loading }) => {
  if (!isOpen || !category) return null;

  const subcategoryCount = category.subcategories ? category.subcategories.length : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" size={24} />
          <h2 className="text-lg font-semibold">Delete Category</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Are you sure you want to delete <strong>"{category.name}"</strong>?
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
            <p className="text-yellow-800 text-sm font-medium">⚠️ This action cannot be undone.</p>
          </div>

          {subcategoryCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm font-medium">
                🗂️ This will also permanently delete all {subcategoryCount} subcategories:
              </p>
              <ul className="mt-2 text-red-600 text-sm list-disc list-inside max-h-24 overflow-y-auto">
                {category.subcategories.map(sub => (
                  <li key={sub.id}>{sub.name}</li>
                ))}
              </ul>
            </div>
          )}

          {category.places && category.places.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-3">
              <p className="text-orange-700 text-sm">
                📍 This category is associated with {category.places.length} places. The places will remain but lose this category association.
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
                Delete {subcategoryCount > 0 ? `All (${subcategoryCount + 1})` : 'Category'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Category Item Component
const CategoryItem = ({ category, level = 0, onEdit, onDelete, expandedCategories, onToggleExpand }) => {
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const isExpanded = expandedCategories.has(category.id);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div 
        className={`flex items-center p-4 hover:bg-gray-50 ${
          level > 0 ? `border-l-4 border-blue-200 ml-${level * 4} bg-gray-50` : ''
        }`}
        style={{ marginLeft: level > 0 ? `${level * 20}px` : '0' }}
      >
        <div className="flex-1 flex items-center">
          {hasSubcategories ? (
            <button
              onClick={() => onToggleExpand(category.id)}
              className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-6 mr-2"></div>
          )}
          
          <div className="flex items-center">
            {category.type === 'primary' ? (
              <Folder className="text-blue-500 mr-2 flex-shrink-0" size={18} />
            ) : (
              <Tag className="text-green-500 mr-2 flex-shrink-0" size={18} />
            )}
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-medium text-gray-900">{category.name}</span>
                {category.icon && (
                  <span className="text-lg">{category.icon}</span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                  category.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                  category.type === 'primary'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {category.type}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                <span className="font-mono bg-gray-100 px-1 rounded">{category.slug}</span>
                {hasSubcategories && (
                  <span className="ml-2">• {category.subcategories.length} subcategories</span>
                )}
                {category.places && category.places.length > 0 && (
                  <span className="ml-2">• {category.places.length} places</span>
                )}
              </div>
              {category.description && (
                <div className="text-sm text-gray-600 mt-1 italic">{category.description}</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-4">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
            title="Edit category"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
            title="Delete category"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {hasSubcategories && isExpanded && (
        <div>
          {category.subcategories.map(subcategory => (
            <CategoryItem
              key={subcategory.id}
              category={subcategory}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedCategories={expandedCategories}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main ManageCategories Component
export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [primaryCategories, setPrimaryCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' or 'flat'

  useEffect(() => {
    loadCategories();
    loadPrimaryCategories();
  }, [viewMode]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = viewMode === 'hierarchy' 
        ? await categoryAPI.getHierarchy()
        : await categoryAPI.getAll();
      
      console.log('Loaded categories data:', data);
      
      if (viewMode === 'hierarchy') {
        // Handle hierarchy data structure
        setCategories(data.primary || data || []);
      } else {
        // Handle flat list data structure  
        setCategories(data || []);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPrimaryCategories = async () => {
    try {
      const data = await categoryAPI.getPrimary();
      setPrimaryCategories(data || []);
    } catch (err) {
      console.error('Failed to load primary categories:', err);
    }
  };

  const handleSaveCategory = async (id, categoryData) => {
    try {
      if (id) {
        await categoryAPI.update(id, categoryData);
      } else {
        await categoryAPI.create(categoryData);
      }
      await loadCategories();
      await loadPrimaryCategories();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      await categoryAPI.delete(selectedCategory.id);
      await loadCategories();
      await loadPrimaryCategories();
      setShowDeleteModal(false);
      setSelectedCategory(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set();
    const addIds = (categories) => {
      categories.forEach(cat => {
        if (cat.subcategories && cat.subcategories.length > 0) {
          allIds.add(cat.id);
          addIds(cat.subcategories);
        }
        if (cat.children && cat.children.length > 0) {
          allIds.add(cat.id);
          addIds(cat.children);
        }
      });
    };
    addIds(categories);
    setExpandedCategories(allIds);
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Helper function to count total categories including subcategories
  const countTotalCategories = (categories) => {
    let total = 0;
    const count = (cats) => {
      cats.forEach(cat => {
        total++;
        if (cat.subcategories && cat.subcategories.length > 0) {
          count(cat.subcategories);
        }
      });
    };
    count(categories);
    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Add Category
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={16} />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="hierarchy">Hierarchy</option>
                <option value="flat">Flat List</option>
              </select>
            </div>
            
            {viewMode === 'hierarchy' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600">
            Total: {viewMode === 'hierarchy' ? countTotalCategories(categories) : categories.length} categories
            {viewMode === 'hierarchy' && categories.length > 0 && (
              <span className="ml-2">({categories.length} primary)</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {categories.length > 0 ? (
          <div>
            {categories.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                onEdit={(cat) => {
                  setSelectedCategory(cat);
                  setShowModal(true);
                }}
                onDelete={(cat) => {
                  setSelectedCategory(cat);
                  setShowDeleteModal(true);
                }}
                expandedCategories={expandedCategories}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Settings size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No categories found. Create your first category to get started.</p>
          </div>
        )}
      </div>

      <CategoryFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedCategory(null);
          setError('');
        }}
        category={selectedCategory}
        primaryCategories={primaryCategories}
        onSave={handleSaveCategory}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onConfirm={handleDeleteCategory}
        loading={loading}
      />
    </div>
  );
}