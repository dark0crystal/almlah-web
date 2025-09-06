/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus, 
  Shield, 
  Mail, 
  Check, 
  X, 
  Lock, 
  Unlock,
  Calendar,
  MoreVertical
} from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:9000/api/v1';

// Enhanced API utility function
const apiCall = async (endpoint: string, options: Record<string, unknown> = {}) => {
  const token = localStorage.getItem('authToken');
  
  try {
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
      let errorMessage = 'API request failed';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Fixed API functions for user management
const userApi = {
  getUsers: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/admin/users${queryString ? `?${queryString}` : ''}`);
      
      // Handle different response structures
      if (response.data && response.data.users) {
        return response.data.users; // Paginated response
      } else if (Array.isArray(response.data)) {
        return response.data; // Direct array in data
      } else if (Array.isArray(response)) {
        return response; // Direct array response
      } else {
        console.warn('Unexpected users response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  getUserById: async (id) => {
    try {
      const response = await apiCall(`/admin/users/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiCall('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response.data || response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await apiCall(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      return response.data || response;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      await apiCall(`/admin/users/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  toggleUserStatus: async (id, isActive) => {
    try {
      const response = await apiCall(`/admin/users/${id}/toggle-status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      });
      return response.data || response;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  getRoles: async () => {
    try {
      const response = await apiCall('/admin/roles');
      
      // Handle different response structures  
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        console.warn('Unexpected roles response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  },

  getUserRoles: async (userId) => {
    try {
      const response = await apiCall(`/admin/users/${userId}/roles`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  },

  assignRoleToUser: async (userId, roleId) => {
    try {
      await apiCall(`/admin/users/${userId}/roles/assign`, {
        method: 'POST',
        body: JSON.stringify({ role_id: roleId }),
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  removeRoleFromUser: async (userId, roleId) => {
    try {
      await apiCall(`/admin/users/${userId}/roles/remove`, {
        method: 'POST',
        body: JSON.stringify({ role_id: roleId }),
      });
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  },

  bulkAssignRoles: async (userIds, roleIds) => {
    try {
      await apiCall('/admin/users/bulk-assign-roles', {
        method: 'POST',
        body: JSON.stringify({ user_ids: userIds, role_ids: roleIds }),
      });
    } catch (error) {
      console.error('Error bulk assigning roles:', error);
      throw error;
    }
  },

  getUserStats: async () => {
    try {
      const response = await apiCall('/admin/users/stats');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {};
    }
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading data...');
      
      const [usersData, rolesData, statsData] = await Promise.all([
        userApi.getUsers(),
        userApi.getRoles(),
        userApi.getUserStats()
      ]);
      
      console.log('=== API RESPONSES ===');
      console.log('usersData:', usersData);
      console.log('usersData type:', typeof usersData);
      console.log('usersData isArray:', Array.isArray(usersData));
      console.log('rolesData:', rolesData);
      console.log('statsData:', statsData);
      console.log('==================');
      
      // Ensure arrays
      const finalUsers = Array.isArray(usersData) ? usersData : [];
      const finalRoles = Array.isArray(rolesData) ? rolesData : [];
      
      console.log('Final users array:', finalUsers);
      console.log('Final users length:', finalUsers.length);
      console.log('Final roles array:', finalRoles);
      
      setUsers(finalUsers);
      setRoles(finalRoles);
      setStats(statsData || {});
      
    } catch (error) {
      console.error('Error loading data:', error);
      
      // If backend is not available, show dummy data for testing
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        setError('Cannot connect to backend server. Showing dummy data for testing.');
        
        // Set dummy data for UI testing
        setUsers([
          {
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
            user_type: 'regular',
            provider: 'email',
            is_active: true,
            is_verified: true,
            created_at: '2024-01-01T00:00:00Z',
            roles: [{ id: 'role1', name: 'admin', display_name: 'Administrator' }]
          },
          {
            id: '2',
            username: 'testuser',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            user_type: 'regular',
            provider: 'google',
            is_active: false,
            is_verified: false,
            created_at: '2024-01-02T00:00:00Z',
            roles: []
          }
        ]);
        
        setRoles([
          {
            id: 'role1',
            name: 'admin',
            display_name: 'Administrator',
            description: 'Full system access',
            is_active: true
          },
          {
            id: 'role2',
            name: 'user',
            display_name: 'Regular User',
            description: 'Basic user access',
            is_active: true
          }
        ]);
        
        setStats({
          total_users: 2,
          active_users: 1,
          verified_users: 1,
          new_users_month: 2
        });
      } else {
        setError(`Failed to load data: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(message);
      setSuccess(null);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await userApi.createUser(userData);
      setShowCreateModal(false);
      await loadData();
      showMessage('User created successfully');
    } catch (error) {
      showMessage(`Failed to create user: ${error.message}`, 'error');
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await userApi.updateUser(editingUser.id, userData);
      setShowEditModal(false);
      setEditingUser(null);
      await loadData();
      showMessage('User updated successfully');
    } catch (error) {
      showMessage(`Failed to update user: ${error.message}`, 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userApi.deleteUser(id);
        await loadData();
        showMessage('User deleted successfully');
      } catch (error) {
        showMessage(`Failed to delete user: ${error.message}`, 'error');
      }
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      await userApi.toggleUserStatus(user.id, !user.is_active);
      await loadData();
      showMessage(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      showMessage(`Failed to update user status: ${error.message}`, 'error');
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      await userApi.assignRoleToUser(userId, roleId);
      await loadData();
      showMessage('Role assigned successfully');
    } catch (error) {
      showMessage(`Failed to assign role: ${error.message}`, 'error');
    }
  };

  const handleRemoveRole = async (userId, roleId) => {
    try {
      await userApi.removeRoleFromUser(userId, roleId);
      await loadData();
      showMessage('Role removed successfully');
    } catch (error) {
      showMessage(`Failed to remove role: ${error.message}`, 'error');
    }
  };

  // Safe filtering with proper error handling
  const filteredUsers = (() => {
    if (!Array.isArray(users)) {
      console.log('Users is not an array:', users, typeof users);
      return [];
    }

    return users.filter(user => {
      if (!user || typeof user !== 'object') {
        console.warn('Invalid user object:', user);
        return false;
      }
      
      const matchesSearch = !searchTerm || 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.is_active) ||
        (filterStatus === 'inactive' && !user.is_active);

      const matchesRole = filterRole === 'all' || 
        (user.roles && Array.isArray(user.roles) && user.roles.some(role => role.id === filterRole));

      return matchesSearch && matchesStatus && matchesRole;
    });
  })();

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    const validUsers = Array.isArray(filteredUsers) ? filteredUsers : [];
    if (selectedUsers.size === validUsers.length && validUsers.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(validUsers.map(user => user.id)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_users || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Check className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_users || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Mail className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.verified_users || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.new_users_month || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-r flex items-start">
            <X className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-r flex items-start">
            <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Success</p>
              <p className="text-sm">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    {Array.isArray(roles) && roles.map(role => (
                      <option key={role.id} value={role.id}>{role.display_name || role.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedUsers.size > 0 && (
                  <button
                    onClick={() => setShowRoleModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Bulk Assign Roles
                  </button>
                )}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>

            {/* Selection Info */}
            {selectedUsers.size > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedUsers.size} user(s) selected
                </span>
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {users.length === 0 ? 'No users found. Try connecting to your backend server.' : 'No users match your filters.'}
                </p>
                {users.length === 0 && (
                  <button
                    onClick={loadData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Retry Loading
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelected={selectedUsers.has(user.id)}
                      onSelect={() => handleSelectUser(user.id)}
                      onEdit={(user) => {
                        setEditingUser(user);
                        setShowEditModal(true);
                      }}
                      onDelete={handleDeleteUser}
                      onToggleStatus={handleToggleUserStatus}
                      onManageRoles={(user) => {
                        setSelectedUser(user);
                        setShowRoleModal(true);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreateUser}
            roles={roles}
          />
        )}

        {showEditModal && editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => {
              setShowEditModal(false);
              setEditingUser(null);
            }}
            onSave={handleUpdateUser}
          />
        )}

        {showRoleModal && (
          <RoleManagementModal
            user={selectedUser}
            users={selectedUsers.size > 0 ? filteredUsers.filter(u => selectedUsers.has(u.id)) : [selectedUser]}
            roles={roles}
            onClose={() => {
              setShowRoleModal(false);
              setSelectedUser(null);
            }}
            onAssignRole={handleAssignRole}
            onRemoveRole={handleRemoveRole}
            onBulkAssign={async (userIds, roleIds) => {
              try {
                await userApi.bulkAssignRoles(userIds, roleIds);
                await loadData();
                setSelectedUsers(new Set());
                showMessage('Roles assigned successfully');
              } catch (error) {
                showMessage(`Failed to assign roles: ${error.message}`, 'error');
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

// User Row Component
const UserRow = ({ 
  user, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onManageRoles
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const safeUser = user || {};

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 relative">
            {safeUser.profile_picture ? (
              <Image
                className="rounded-full"
                src={safeUser.profile_picture}
                alt={safeUser.username || 'User'}
                fill
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {safeUser.first_name && safeUser.last_name 
                ? `${safeUser.first_name} ${safeUser.last_name}` 
                : safeUser.username || 'Unknown User'}
            </div>
            <div className="text-sm text-gray-500">@{safeUser.username || 'unknown'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{safeUser.email || 'No email'}</div>
        <div className="text-sm text-gray-500 flex items-center">
          {safeUser.provider === 'google' && <span className="mr-1">🔗</span>}
          {safeUser.is_verified ? (
            <span className="text-green-600 flex items-center">
              <Check className="w-3 h-3 mr-1" />
              Verified
            </span>
          ) : (
            <span className="text-red-600">Unverified</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {safeUser.roles && Array.isArray(safeUser.roles) && safeUser.roles.length > 0 ? (
            safeUser.roles.slice(0, 2).map(role => (
              <span
                key={role.id}
                className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800"
              >
                {role.display_name || role.name}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">No roles</span>
          )}
          {safeUser.roles && safeUser.roles.length > 2 && (
            <span className="text-xs text-gray-500">+{safeUser.roles.length - 2} more</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          safeUser.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {safeUser.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(safeUser.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(user)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onManageRoles(user)}
            className="text-purple-600 hover:text-purple-900"
            title="Manage Roles"
          >
            <Shield className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleStatus(user)}
            className={`${safeUser.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
            title={safeUser.is_active ? 'Deactivate User' : 'Activate User'}
          >
            {safeUser.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-gray-600 hover:text-gray-900"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={() => {
                    onDelete(safeUser.id);
                    setShowDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Delete User
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

// Create User Modal
const CreateUserModal = ({ onClose, onSave, roles }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'regular',
    is_active: true,
    roles: []
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const safeRoles = Array.isArray(roles) ? roles : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type
              </label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="regular">Regular</option>
                <option value="premium">Premium</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Roles
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                {safeRoles.length > 0 ? safeRoles.map(role => (
                  <label key={role.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role.id)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...formData.roles, role.id]
                          : formData.roles.filter(id => id !== role.id);
                        setFormData({ ...formData, roles: newRoles });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{role.display_name || role.name}</span>
                  </label>
                )) : (
                  <p className="text-sm text-gray-500">No roles available</p>
                )}
              </div>
            </div>

            <div>
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
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal
const EditUserModal = ({ user, onClose, onSave }) => {
  const safeUser = user || {};
  const [formData, setFormData] = useState({
    username: safeUser.username || '',
    email: safeUser.email || '',
    first_name: safeUser.first_name || '',
    last_name: safeUser.last_name || '',
    user_type: safeUser.user_type || 'regular',
    is_active: safeUser.is_active ?? true
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type
              </label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="regular">Regular</option>
                <option value="premium">Premium</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div>
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
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              {saving ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Role Management Modal
const RoleManagementModal = ({ 
  user, 
  users, 
  roles, 
  onClose, 
  onAssignRole, 
  onRemoveRole, 
  onBulkAssign 
}) => {
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const isBulkMode = users && users.length > 1;
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safeUsers = Array.isArray(users) ? users : [];

  useEffect(() => {
    if (!isBulkMode && user?.roles) {
      setSelectedRoles(new Set(user.roles.map(role => role.id)));
    }
  }, [user, isBulkMode]);

  const toggleRole = (roleId) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isBulkMode) {
        await onBulkAssign(safeUsers.map(u => u.id), Array.from(selectedRoles));
      } else {
        // Handle individual user role assignment
        const currentRoles = new Set(user.roles?.map(role => role.id) || []);
        const toAdd = Array.from(selectedRoles).filter(id => !currentRoles.has(id));
        const toRemove = Array.from(currentRoles).filter(id => !selectedRoles.has(id));

        for (const roleId of toAdd) {
          await onAssignRole(user.id, roleId);
        }
        for (const roleId of toRemove) {
          await onRemoveRole(user.id, roleId);
        }
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {isBulkMode 
              ? `Assign Roles to ${safeUsers.length} Users` 
              : `Manage Roles for ${user?.username || 'User'}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isBulkMode && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              Selected users: {safeUsers.map(u => u.username).join(', ')}
            </p>
          </div>
        )}

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {safeRoles.length > 0 ? safeRoles.map(role => {
            const isSelected = selectedRoles.has(role.id);
            return (
              <label
                key={role.id}
                className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRole(role.id)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {role.display_name || role.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {role.description}
                  </div>
                  <div className="text-xs text-gray-400">
                    {role.permissions?.length || 0} permissions
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </label>
            );
          }) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No roles available</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            {selectedRoles.size} role(s) selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              {saving ? 'Saving...' : 'Save Roles'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;