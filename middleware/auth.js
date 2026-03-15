/**
 *  Here we are creating an centralized Access Control System, solving the problem of a single point of failure, 
 * where permissions are defined in one place and enforced consistently across the application. 
 * This approach follows security best practices and ensures that access control is robust and maintainable.
 * 
 * This system is designed with the following principles in mind:
 * - Single source of truth for permissions, all permissions are defined in one place and referenced throughout the application.
 * - Permission-based access, not role-based
 * - Deny by default, were users must explicitly have permissions to access resources
 * - Every request passes through access control, ensuring consistent enforcement of permissions
 * - Clear separation of concerns, where authentication and authorization are handled in dedicated middleware
 * - Logging of unauthorized access attempts for security monitoring
 * 
 */

const db = require('../Database');
const { log, securityLog, getClientIp } = require('../logger');
const PERMISSIONS = {
  
  // User permissions
  'VIEW_PROFILES': 'view_profiles',
  'EDIT_OWN_PROFILE': 'edit_own_profile',
  'DELETE_OWN_PROFILE': 'delete_own_profile',
  'VIEW_MESSAGES': 'view_messages',
  'SEND_MESSAGES': 'send_messages',
  'SEND_MESSAGE_REQUEST': 'send_message_request',
  
  // Admin permissions
  'VIEW_ADMIN_PANEL': 'view_admin_panel',
  'MANAGE_USERS': 'manage_users',
  'VIEW_ALL_USERS': 'view_all_users',
  'EDIT_USER': 'edit_user',
  'DELETE_USER': 'delete_user',
  'CREATE_USER': 'create_user'
};

// Next we define role-permission mapping
// NOTE: the Admin dose NOT get profile/message permissions, they should not be able to access thoughs user features
const ROLE_PERMISSIONS = {
  'admin': [
    PERMISSIONS.VIEW_ADMIN_PANEL,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.CREATE_USER
  ],
  'player': [
    PERMISSIONS.VIEW_PROFILES,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.DELETE_OWN_PROFILE,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.SEND_MESSAGE_REQUEST
  ],
  'dm': [
    PERMISSIONS.VIEW_PROFILES,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.DELETE_OWN_PROFILE,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.SEND_MESSAGE_REQUEST
  ],
  'both': [
    PERMISSIONS.VIEW_PROFILES,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.DELETE_OWN_PROFILE,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.SEND_MESSAGE_REQUEST
  ]
};

/**
 * Centralized permission checker that
 * Checks if user has the required permission
 */
function hasPermission(user, permission) {
  // Deny by default, if no user, deny
  if (!user) {
    return false;
  }

  // Admin users can only access admin permissions, NOT user permissions
  // This ensures admins can't access profiles/messages
  if (user.is_admin) {
    const adminPermissions = [
      PERMISSIONS.VIEW_ADMIN_PANEL,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.VIEW_ALL_USERS,
      PERMISSIONS.EDIT_USER,
      PERMISSIONS.DELETE_USER,
      PERMISSIONS.CREATE_USER
    ];
    return adminPermissions.includes(permission);
  }

  // Get user's role
  const userRole = user.user_type || 'player';
  
  // Get permissions for role
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  
  // Check if permission exists
  return rolePerms.includes(permission);
}

/**
 * Here we are creating middleware factory for permission checking, which can be used to protect routes based on permissions.
 * so for an example, if we want to protect the admin panel route, we can use requirePermission(PERMISSIONS.VIEW_ADMIN_PANEL) middleware,
 *  which will check if the user has the VIEW_ADMIN_PANEL permission before allowing access to the route.
 */
function requirePermission(permission) {
  return function(req, res, next) {
    // Get user from session
    const user = req.session && req.session.user;
    
    // Deny by default, we check permission
    if (!hasPermission(user, permission)) {
      // Log unauthorized access attempt to security log
      securityLog('authz_fail', `userid=${user ? user.user_id : 'anonymous'}, resource=${req.path}, ip=${getClientIp(req)}`);
      
      return res.status(403).render('../views/error', { 
        statusCode: 403,
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
}

/**
 * here we are creating middleware to check if user is logged in, which can be used to protect routes that require authentication.
 * This middleware checks if there is a user object in the session, and if not, it redirects to the login page.
 */
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
}

/**
 * Here we are creating middleware to check if user is an admin, which can be used to protect routes that require admin access.
 * This middleware checks if there is a user object in the session and if the user has the VIEW_ADMIN_PANEL permission, which is only granted to admins.
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  
  if (!hasPermission(req.session.user, PERMISSIONS.VIEW_ADMIN_PANEL)) {
    return res.status(403).render('../views/error', { 
      statusCode: 403,
      message: 'Admin access required'
    });
  }
  
  next();
}

/**
 * Here we are creating a function to check if the user is the owner of a resource,
 *  which can be used to protect routes that require ownership. 
 */
function isOwner(resourceOwnerId, user) {
  // Admin users can access all resources, but they should not be able to access user features, so we return false for admins
  if (user && user.is_admin) {
    return true;
  }
  return user && user.user_id === resourceOwnerId;
}

/**
 * Here we are creating middleware factory for ownership checking, which can be used to protect routes based on resource ownership.
 * This middleware checks if the user is the owner of the resource by comparing the user ID from the session with the owner ID of the resource.
 * If the user is not the owner, it denies access and renders a 403 error page.
 */
function requireOwner(getOwnerId) {
  return function(req, res, next) {
    const user = req.session && req.session.user;
    const ownerId = getOwnerId(req);
    
    if (!isOwner(ownerId, user)) {
      console.log(`SECURITY: OWNERSHIP_DENIED - User ${user ? user.name : 'anonymous'} denied resource ownership check`);
      
      return res.status(403).render('../views/error', { 
        statusCode: 403,
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
}

// here we are creating a function to get the user ID from the session
function getUserId(req) {
  if (req.session && req.session.user && req.session.user.user_id) {
    return req.session.user.user_id;
  }
  return null;
}

// Get user from session
function getUser(req) {
  return req.session && req.session.user ? req.session.user : null;
}

module.exports = {
  PERMISSIONS,
  hasPermission,
  requirePermission,
  requireLogin,
  requireAdmin,
  isOwner,
  requireOwner,
  getUserId,
  getUser
};
