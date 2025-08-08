"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Shield, Search, Check, X, Save, UserCheck } from 'lucide-react';

// API configuration
const API_BASE_URL = 'http://localhost:9000/api/v1'; // Update with your backend URL

// API utility function
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken'); // Assuming you store JWT token in localStorage
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
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

// Real API functions using your existing RBAC endpoints
const api = {
  getRoles: async () => {
    const response = await apiCall('/rbac/roles');
    return response.data;
  },

  getPermissions: async () => {
    const response = await apiCall('/rbac/permissions');
    return response.data;
  },

  createRole: async (roleData) => {
    const response = await apiCall('/rbac/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
    return response.data;
  },

  updateRole: async (id, roleData) => {
    const response = await apiCall(`/rbac/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
    return response.data;
  },

  deleteRole: async (id) => {
    await apiCall(`/rbac/roles/${id}`, {
      method: 'DELETE',
    });
  },

  assignPermissionsToRole: async (roleId, permissionIds) => {
    await apiCall(`/rbac/role-permissions/bulk-assign`, {
      method: 'POST',
      body: JSON.stringify({
        role_id: roleId,
        permission_ids: permissionIds,
      }),
    });
  },

  removePermissionsFromRole: async (roleId, permissionIds) => {
    // Remove existing permissions by assigning only the new ones
    // First get current role to see which permissions to remove
    const currentRole = await apiCall(`/rbac/roles/${roleId}`);
    const currentPermissionIds = currentRole.data.permissions.map(p => p.id);
    
    // Remove permissions that are no longer selected
    const toRemove = currentPermissionIds.filter(id => !permissionIds.includes(id));
    
    for (const permissionId of toRemove) {
      await apiCall(`/rbac/role-permissions/remove`, {
        method: 'POST',
        body: JSON.stringify({
          role_id: roleId,
          permission_id: permissionId,
        }),
      });
    }
    
    // Add new permissions
    const toAdd = permissionIds.filter(id => !currentPermissionIds.includes(id));
    for (const permissionId of toAdd) {
      await apiCall(`/rbac/role-permissions/assign`, {
        method: 'POST',
        body: JSON.stringify({
          role_id: roleId,
          permission_id: permissionId,
        }),
      });
    }
  },

  getRoleStats: async () => {
    const response = await apiCall('/rbac/stats');
    return response.data;
  }
};

const RBACManagement = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        api.getRoles(),
        api.getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      setError(error.message);
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  const handleCreateRole = async (roleData) => {
    try {
      await api.createRole(roleData);
      setShowCreateRole(false);
      await loadData();
      showMessage('Role created successfully');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleUpdateRole = async (roleData) => {
    try {
      await api.updateRole(editingRole.id, roleData);
      setEditingRole(null);
      await loadData();
      showMessage('Role updated successfully');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await api.deleteRole(id);
        await loadData();
        showMessage('Role deleted successfully');
      } catch (error) {
        showMessage(error.message, 'error');
      }
    }
  };

  const handleAssignPermissions = async (permissionIds) => {
    try {
      await api.assignPermissionsToRole(selectedRole.id, permissionIds);
      setShowPermissionModal(false);
      setSelectedRole(null);
      await loadData();
      showMessage('Permissions updated successfully');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RBAC Management</h1>
          <p className="text-gray-600">Manage roles, permissions, and user access control</p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('roles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'roles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Roles
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserCheck className="w-4 h-4 inline mr-2" />
                Permissions
              </button>
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {activeTab === 'roles' && (
                <button
                  onClick={() => setShowCreateRole(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : activeTab === 'roles' ? (
              <RolesTable 
                roles={filteredRoles} 
                onEdit={setEditingRole}
                onDelete={handleDeleteRole}
                onManagePermissions={(role) => {
                  setSelectedRole(role);
                  setShowPermissionModal(true);
                }}
              />
            ) : (
              <PermissionsTable permissions={filteredPermissions} />
            )}
          </div>
        </div>

        {/* Modals */}
        {showCreateRole && (
          <RoleModal
            onClose={() => setShowCreateRole(false)}
            onSave={handleCreateRole}
          />
        )}

        {editingRole && (
          <RoleModal
            role={editingRole}
            onClose={() => setEditingRole(null)}
            onSave={handleUpdateRole}
          />
        )}

        {showPermissionModal && selectedRole && (
          <PermissionAssignmentModal
            role={selectedRole}
            permissions={permissions}
            onClose={() => {
              setShowPermissionModal(false);
              setSelectedRole(null);
            }}
            onSave={handleAssignPermissions}
          />
        )}
      </div>
    </div>
  );
};

const RolesTable = ({ roles, onEdit, onDelete, onManagePermissions }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Users
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Permissions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {roles.map((role) => (
            <tr key={role.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{role.display_name}</div>
                  <div className="text-sm text-gray-500">{role.name}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-xs truncate">{role.description}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-900">{role.user_count || 0}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{role.permissions?.length || 0} permissions</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  role.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {role.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onManagePermissions(role)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Manage Permissions"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(role)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit Role"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(role.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PermissionsTable = ({ permissions }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Permission
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Resource
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {permissions.map((permission) => (
            <tr key={permission.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{permission.display_name}</div>
                  <div className="text-sm text-gray-500">{permission.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {permission.resource}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                  {permission.action}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  permission.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {permission.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RoleModal = ({ role, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    display_name: role?.display_name || '',
    description: role?.description || '',
    is_active: role?.is_active ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {role ? 'Edit Role' : 'Create Role'}
        </h2>
        
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
              disabled={role} // Don't allow editing role name
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3">
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
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : role ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PermissionAssignmentModal = ({ role, permissions, onClose, onSave }) => {
  const [selectedPermissions, setSelectedPermissions] = useState(
    new Set(role.permissions?.map(p => p.id) || [])
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {});

  const togglePermission = (permissionId) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(selectedPermissions));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Manage Permissions for {role.display_name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-96 mb-6">
          {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
            <div key={resource} className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 capitalize">
                {resource} Permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {resourcePermissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {permission.display_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {permission.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Action: {permission.action}
                      </div>
                    </div>
                    {selectedPermissions.has(permission.id) && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedPermissions.size} permissions selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACManagement;