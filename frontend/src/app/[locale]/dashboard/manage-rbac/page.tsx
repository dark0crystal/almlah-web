"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, Save, X, AlertTriangle, Users, Shield, Key, Search, Filter } from 'lucide-react';

// API Configuration
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

// Enhanced API service
const rbacAPI = {
  // Roles
  getRoles: async () => {
    try {
      const response = await fetch(`${API_HOST}/api/v1/admin/roles`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('API getRoles error:', error);
      throw error;
    }
  },

  createRole: async (roleData: any) => {
    try {
      const payload = {
        name: roleData.name?.trim(),
        display_name: roleData.display_name?.trim(),
        description: roleData.description?.trim() || '',
        is_active: roleData.is_active !== undefined ? roleData.is_active : true
      };

      if (!payload.name || !payload.display_name) {
        throw new Error('Name and display name are required');
      }

      const response = await fetch(`${API_HOST}/api/v1/admin/roles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create role');
      return data.data;
    } catch (error) {
      console.error('API createRole error:', error);
      throw error;
    }
  },

  updateRole: async (id: string, roleData: any) => {
    try {
      const payload = {
        display_name: roleData.display_name?.trim(),
        description: roleData.description?.trim() || '',
        is_active: roleData.is_active !== undefined ? roleData.is_active : true
      };

      const response = await fetch(`${API_HOST}/api/v1/admin/roles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to update role');
      return data.data;
    } catch (error) {
      console.error('API updateRole error:', error);
      throw error;
    }
  },

  deleteRole: async (id: string) => {
    try {
      const response = await fetch(`${API_HOST}/api/v1/admin/roles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete role');
      return data.data;
    } catch (error) {
      console.error('API deleteRole error:', error);
      throw error;
    }
  },

  // Permissions
  getPermissions: async () => {
    try {
      const response = await fetch(`${API_HOST}/api/v1/admin/permissions`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('API getPermissions error:', error);
      throw error;
    }
  },

  createPermission: async (permissionData: any) => {
    try {
      const name = permissionData.name?.trim() || 
                  `can_${permissionData.action?.trim()}_${permissionData.resource?.trim()}`;
      
      const payload = {
        name: name,
        display_name: permissionData.display_name?.trim(),
        description: permissionData.description?.trim() || '',
        resource: permissionData.resource?.trim(),
        action: permissionData.action?.trim(),
        is_active: permissionData.is_active !== undefined ? permissionData.is_active : true
      };

      if (!payload.display_name || !payload.resource || !payload.action) {
        throw new Error('Display name, resource, and action are required');
      }

      const response = await fetch(`${API_HOST}/api/v1/admin/permissions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create permission');
      return data.data;
    } catch (error) {
      console.error('API createPermission error:', error);
      throw error;
    }
  },

  updatePermission: async (id: string, permissionData: any) => {
    try {
      const payload = {
        display_name: permissionData.display_name?.trim(),
        description: permissionData.description?.trim() || '',
        is_active: permissionData.is_active !== undefined ? permissionData.is_active : true
      };

      const response = await fetch(`${API_HOST}/api/v1/admin/permissions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to update permission');
      return data.data;
    } catch (error) {
      console.error('API updatePermission error:', error);
      throw error;
    }
  },

  deletePermission: async (id: string) => {
    try {
      const response = await fetch(`${API_HOST}/api/v1/admin/permissions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete permission');
      return data.data;
    } catch (error) {
      console.error('API deletePermission error:', error);
      throw error;
    }
  },

  // Role-Permission Management
  bulkAssignPermissions: async (roleId: string, permissionIds: string[]) => {
    try {
      const payload = {
        permission_ids: permissionIds
      };

      const response = await fetch(`${API_HOST}/api/v1/admin/roles/${roleId}/permissions/bulk-assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to assign permissions');
      return data.data;
    } catch (error) {
      console.error('API bulkAssignPermissions error:', error);
      throw error;
    }
  },

  
  bulkRemovePermissions: async (roleId: string, permissionIds: string[]) => {
  try {
    const payload = {
      role_id: roleId, // Include role_id here too
      permission_ids: permissionIds
    };

    const response = await fetch(`${API_HOST}/api/v1/admin/roles/${roleId}/permissions/bulk-remove`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to remove permissions');
    return data.data;
  } catch (error) {
    console.error('API bulkRemovePermissions error:', error);
    throw error;
  }
}
};

// Constants
const ACTIONS = [
  'create', 'read', 'update', 'delete', 'manage', 'view', 'moderate'
];

const RESOURCES = [
  'place', 'user', 'category', 'review', 'recipe', 'advice', 
  'role', 'property', 'permission', 'system','governate'
];

// Login Modal Component
const LoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (token: string) => void }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (credentials.username === 'admin' && credentials.password === 'password') {
        const mockToken = 'mock-jwt-token-12345';
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

// Role Form Modal
const RoleFormModal = ({ isOpen, onClose, role, onSave }: { 
  isOpen: boolean, 
  onClose: () => void, 
  role: any, 
  onSave: (id: string | null, roleData: any) => Promise<void> 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        display_name: role.display_name || '',
        description: role.description || '',
        is_active: role.is_active !== undefined ? role.is_active : true
      });
    } else {
      setFormData({
        name: '',
        display_name: '',
        description: '',
        is_active: true
      });
    }
    setErrors({});
  }, [role, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (!role && !formData.name.trim()) {
      newErrors.name = 'Role name is required for new roles';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(role?.id || null, formData);
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {role ? 'Edit Role' : 'Create New Role'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {!role && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., content_manager"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.display_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Content Manager"
            />
            {errors.display_name && <p className="text-red-500 text-sm mt-1">{errors.display_name}</p>}
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
              placeholder="Describe what this role can do..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active
            </label>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              disabled={loading}
            >
              <Save className="mr-2" size={16} />
              {loading ? 'Saving...' : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Permission Form Modal
const PermissionFormModal = ({ isOpen, onClose, permission, onSave }: { 
  isOpen: boolean, 
  onClose: () => void, 
  permission: any, 
  onSave: (id: string | null, permissionData: any) => Promise<void> 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    resource: '',
    action: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name || '',
        display_name: permission.display_name || '',
        description: permission.description || '',
        resource: permission.resource || '',
        action: permission.action || '',
        is_active: permission.is_active !== undefined ? permission.is_active : true
      });
    } else {
      setFormData({
        name: '',
        display_name: '',
        description: '',
        resource: '',
        action: '',
        is_active: true
      });
    }
    setErrors({});
  }, [permission, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Auto-generate permission name for new permissions
    if ((name === 'action' || name === 'resource') && !permission) {
      const action = name === 'action' ? newValue : formData.action;
      const resource = name === 'resource' ? newValue : formData.resource;
      if (action && resource) {
        setFormData(prev => ({
          ...prev,
          name: `can_${action}_${resource}`,
          display_name: prev.display_name || `Can ${action.charAt(0).toUpperCase()}${action.slice(1)} ${resource.charAt(0).toUpperCase()}${resource.slice(1)}`
        }));
      }
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (!formData.resource.trim()) {
      newErrors.resource = 'Resource is required';
    }

    if (!formData.action.trim()) {
      newErrors.action = 'Action is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(permission?.id || null, formData);
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {permission ? 'Edit Permission' : 'Create New Permission'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource *
              </label>
              <select
                name="resource"
                value={formData.resource}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.resource ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!!permission}
              >
                <option value="">Select resource</option>
                {RESOURCES.map(resource => (
                  <option key={resource} value={resource}>
                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                  </option>
                ))}
              </select>
              {errors.resource && <p className="text-red-500 text-sm mt-1">{errors.resource}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action *
              </label>
              <select
                name="action"
                value={formData.action}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.action ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!!permission}
              >
                <option value="">Select action</option>
                {ACTIONS.map(action => (
                  <option key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </option>
                ))}
              </select>
              {errors.action && <p className="text-red-500 text-sm mt-1">{errors.action}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permission Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              placeholder="Auto-generated"
              readOnly={!permission}
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated from resource and action</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.display_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Can Create Places"
            />
            {errors.display_name && <p className="text-red-500 text-sm mt-1">{errors.display_name}</p>}
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
              placeholder="Describe what this permission allows..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active
            </label>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              disabled={loading}
            >
              <Save className="mr-2" size={16} />
              {loading ? 'Saving...' : 'Save Permission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, item, itemType, onConfirm, loading }: { 
  isOpen: boolean, 
  onClose: () => void, 
  item: any, 
  itemType: string, 
  onConfirm: () => Promise<void>, 
  loading: boolean 
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" size={24} />
          <h2 className="text-lg font-semibold">Delete {itemType}</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            Are you sure you want to delete <strong>"{item.display_name || item.name}"</strong>?
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-yellow-800 text-sm font-medium">⚠️ This action cannot be undone.</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
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
                Delete {itemType}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Role Permissions Modal
const RolePermissionsModal = ({ isOpen, onClose, role, permissions, onSave }: { 
  isOpen: boolean, 
  onClose: () => void, 
  role: any, 
  permissions: any[], 
  onSave: () => Promise<void> 
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');

  useEffect(() => {
    if (role && role.permissions) {
      setSelectedPermissions(role.permissions.map((p: any) => p.id));
    }
  }, [role]);

  const filteredPermissions = (permissions || []).filter(permission => {
    const matchesSearch = permission?.display_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
                         permission?.name?.toLowerCase()?.includes(searchTerm.toLowerCase());
    const matchesResource = resourceFilter === 'all' || permission?.resource === resourceFilter;
    return matchesSearch && matchesResource;
  });

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = async () => {
  if (!role) return;

  setLoading(true);
  try {
    const currentPermissionIds = (role.permissions || []).map((p: any) => p.id);
    const toAdd = selectedPermissions.filter(id => !currentPermissionIds.includes(id));
    const toRemove = currentPermissionIds.filter(id => !selectedPermissions.includes(id));

    if (toAdd.length > 0) {
      // Pass role.id and toAdd array
      await rbacAPI.bulkAssignPermissions(role.id, toAdd);
    }

    if (toRemove.length > 0) {
      // Pass role.id and toRemove array
      await rbacAPI.bulkRemovePermissions(role.id, toRemove);
    }

    await onSave();
    onClose();
  } catch (error) {
    console.error('Error updating role permissions:', error);
    // You might want to show this error to the user
  } finally {
    setLoading(false);
  }
};

  if (!isOpen || !role) return null;

  const uniqueResources = [...new Set(permissions.map(p => p?.resource))].filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Manage Permissions for "{role.display_name}"
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 flex-1">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Resources</option>
              {uniqueResources.map(resource => (
                <option key={resource} value={resource}>
                  {resource?.charAt(0)?.toUpperCase() + resource?.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Permission List */}
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="grid gap-2">
            {filteredPermissions.map(permission => (
              <div
                key={permission?.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPermissions.includes(permission?.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handlePermissionToggle(permission?.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission?.id)}
                        onChange={() => handlePermissionToggle(permission?.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="font-medium text-gray-900">
                        {permission?.display_name}
                      </span>
                    </div>
                    <div className="ml-6 text-sm text-gray-600">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                        {permission?.name}
                      </span>
                      <span className="text-blue-600">
                        {permission?.resource}
                      </span>
                      <span className="mx-1">•</span>
                      <span className="text-green-600">
                        {permission?.action}
                      </span>
                    </div>
                    {permission?.description && (
                      <p className="ml-6 text-sm text-gray-500 mt-1">
                        {permission.description}
                      </p>
                    )}
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    permission?.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {permission?.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPermissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No permissions found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedPermissions.length} of {permissions.length} permissions selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main RBAC Management Component
export default function RBACManagement() {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRolePermissionsModal, setShowRolePermissionsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleAuthError = (error: any) => {
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      setShowLoginModal(true);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [rolesData, permissionsData] = await Promise.all([
        rbacAPI.getRoles().catch(() => []),
        rbacAPI.getPermissions().catch(() => [])
      ]);
      
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
    } catch (err: any) {
      handleAuthError(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('authToken', token);
    console.log('Token stored:', token);
    loadData();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    setRoles([]);
    setPermissions([]);
  };

  // Role handlers
  const handleSaveRole = async (id: string | null, roleData: any) => {
    try {
      if (id) {
        await rbacAPI.updateRole(id, roleData);
      } else {
        await rbacAPI.createRole(roleData);
      }
      await loadData();
    } catch (err: any) {
      handleAuthError(err);
      throw err;
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedItem) return;
    
    try {
      setLoading(true);
      await rbacAPI.deleteRole(selectedItem.id);
      await loadData();
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (err: any) {
      handleAuthError(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Permission handlers
  const handleSavePermission = async (id: string | null, permissionData: any) => {
    try {
      if (id) {
        await rbacAPI.updatePermission(id, permissionData);
      } else {
        await rbacAPI.createPermission(permissionData);
      }
      await loadData();
    } catch (err: any) {
      handleAuthError(err);
      throw err;
    }
  };

  const handleDeletePermission = async () => {
    if (!selectedItem) return;
    
    try {
      setLoading(true);
      await rbacAPI.deletePermission(selectedItem.id);
      await loadData();
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (err: any) {
      handleAuthError(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search with null checks
  const filteredRoles = (roles || []).filter(role => {
    const nameMatch = role?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
    const displayNameMatch = role?.display_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
    return nameMatch || displayNameMatch;
  });

  const filteredPermissions = (permissions || []).filter(permission => {
    const nameMatch = permission?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
    const displayNameMatch = permission?.display_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
    const resourceMatch = permission?.resource?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
    const actionMatch = permission?.action?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;
    return nameMatch || displayNameMatch || resourceMatch || actionMatch;
  });

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">RBAC Management</h2>
          <p className="text-gray-600 mb-6">You need to be authenticated to access this panel</p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mx-auto"
          >
            <Key className="mr-2" size={20} />
            Login to Continue
          </button>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">RBAC Management</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                🔒 Authenticated
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="text-red-500 mr-2" size={16} />
                <span className="text-red-700">{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'roles'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="mr-2" size={16} />
            Roles ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'permissions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="mr-2" size={16} />
            Permissions ({permissions.length})
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="text-gray-500" size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedItem(null);
            if (activeTab === 'roles') {
              setShowRoleModal(true);
            } else {
              setShowPermissionModal(true);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="mr-2" size={20} />
          Add {activeTab === 'roles' ? 'Role' : 'Permission'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
          <span className="text-gray-600">Loading {activeTab}...</span>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="grid gap-4">
              {filteredRoles.length > 0 ? (
                filteredRoles.map(role => (
                  <div key={role?.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {role?.display_name || 'No display name'}
                          </h3>
                          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {role?.name || 'No name'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            role?.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {role?.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {role?.description && (
                          <p className="text-gray-600 mb-3">{role.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Permissions: {role?.permissions?.length || 0}
                          </span>
                          <span>
                            Created: {role?.created_at ? new Date(role.created_at).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(role);
                            setShowRolePermissionsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title="Manage permissions"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(role);
                            setShowRoleModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                          title="Edit role"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(role);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Delete role"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No roles found{searchTerm && ` matching "${searchTerm}"`}</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="grid gap-4">
              {filteredPermissions.length > 0 ? (
                filteredPermissions.map(permission => (
                  <div key={permission?.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {permission?.display_name || 'No display name'}
                          </h3>
                          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {permission?.name || 'No name'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            permission?.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {permission?.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {permission?.description && (
                          <p className="text-gray-600 mb-3">{permission.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {permission?.resource || 'No resource'}
                          </span>
                          <span className="text-green-600 bg-green-100 px-2 py-1 rounded">
                            {permission?.action || 'No action'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(permission);
                            setShowPermissionModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                          title="Edit permission"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(permission);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Delete permission"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No permissions found{searchTerm && ` matching "${searchTerm}"`}</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <RoleFormModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedItem(null);
        }}
        role={selectedItem}
        onSave={handleSaveRole}
      />

      <PermissionFormModal
        isOpen={showPermissionModal}
        onClose={() => {
          setShowPermissionModal(false);
          setSelectedItem(null);
        }}
        permission={selectedItem}
        onSave={handleSavePermission}
      />

      <RolePermissionsModal
        isOpen={showRolePermissionsModal}
        onClose={() => {
          setShowRolePermissionsModal(false);
          setSelectedItem(null);
        }}
        role={selectedItem}
        permissions={permissions}
        onSave={loadData}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        itemType={activeTab === 'roles' ? 'Role' : 'Permission'}
        onConfirm={activeTab === 'roles' ? handleDeleteRole : handleDeletePermission}
        loading={loading}
      />
    </div>
  );
}