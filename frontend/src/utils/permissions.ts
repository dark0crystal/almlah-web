// utils/permissions.ts
// Permission constants that match your backend permissions

export const PERMISSIONS = {
  // Place permissions
  PLACE_CREATE: 'can_create_place',
  PLACE_EDIT: 'can_edit_place',
  PLACE_DELETE: 'can_delete_place',
  PLACE_VIEW: 'can_view_place',
  PLACE_MANAGE: 'can_manage_place',
  PLACE_MODERATE: 'can_moderate_place',

  // User permissions
  USER_CREATE: 'can_create_user',
  USER_EDIT: 'can_edit_user',
  USER_DELETE: 'can_delete_user',
  USER_VIEW: 'can_view_user',
  USER_MANAGE: 'can_manage_user',

  // Category permissions
  CATEGORY_CREATE: 'can_create_category',
  CATEGORY_EDIT: 'can_edit_category',
  CATEGORY_DELETE: 'can_delete_category',
  CATEGORY_MANAGE: 'can_manage_category',

  // Review permissions
  REVIEW_CREATE: 'can_create_review',
  REVIEW_EDIT: 'can_edit_review',
  REVIEW_DELETE: 'can_delete_review',
  REVIEW_MODERATE: 'can_moderate_review',

  // Role and Permission management
  ROLE_MANAGE: 'can_manage_role',
  PERMISSION_MANAGE: 'can_manage_permission',

  // System permissions
  SYSTEM_MANAGE: 'can_manage_system',

  // Property permissions
  PROPERTY_CREATE: 'can_create_property',
  PROPERTY_EDIT: 'can_edit_property',
  PROPERTY_DELETE: 'can_delete_property',
  PROPERTY_VIEW: 'can_view_property',
  PROPERTY_MANAGE: 'can_manage_property',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
} as const;

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  PLACE_BASIC: [PERMISSIONS.PLACE_VIEW, PERMISSIONS.PLACE_CREATE, PERMISSIONS.PLACE_EDIT],
  PLACE_ADVANCED: [PERMISSIONS.PLACE_MANAGE, PERMISSIONS.PLACE_DELETE, PERMISSIONS.PLACE_MODERATE],
  USER_BASIC: [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_EDIT],
  USER_ADVANCED: [PERMISSIONS.USER_MANAGE, PERMISSIONS.USER_DELETE],
  ADMIN_ONLY: [PERMISSIONS.ROLE_MANAGE, PERMISSIONS.PERMISSION_MANAGE, PERMISSIONS.SYSTEM_MANAGE],
} as const;

// Utility functions
export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};