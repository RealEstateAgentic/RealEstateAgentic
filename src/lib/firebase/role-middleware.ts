/**
 * Role Management Utilities and Middleware
 * Provides access control and user role validation utilities
 */

import { getCurrentUserProfile } from './auth'
import type {
  UserRole,
  UserProfile,
  AgentProfile,
  ClientProfile,
} from '../../shared/types'

/**
 * Role-based access control error
 */
export class RoleAccessError extends Error {
  constructor(
    message: string,
    public requiredRole?: UserRole,
    public userRole?: UserRole
  ) {
    super(message)
    this.name = 'RoleAccessError'
  }
}

/**
 * Middleware function to require specific user role
 */
export const requireRole = (requiredRole: UserRole) => {
  return async (): Promise<UserProfile> => {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      throw new RoleAccessError('Authentication required')
    }

    if (profile.role !== requiredRole) {
      throw new RoleAccessError(
        `Access denied. Required role: ${requiredRole}`,
        requiredRole,
        profile.role
      )
    }

    return profile
  }
}

/**
 * Middleware function to require agent role
 */
export const requireAgent = async (): Promise<AgentProfile> => {
  const profile = await requireRole('agent')()
  return profile as AgentProfile
}

/**
 * Middleware function to require buyer role
 */
export const requireBuyer = async (): Promise<ClientProfile> => {
  const profile = await requireRole('buyer')()
  return profile as ClientProfile
}

/**
 * Middleware function to require seller role
 */
export const requireSeller = async (): Promise<ClientProfile> => {
  const profile = await requireRole('seller')()
  return profile as ClientProfile
}

/**
 * Middleware function to require client role (buyer or seller)
 */
export const requireClient = async (): Promise<ClientProfile> => {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    throw new RoleAccessError('Authentication required')
  }

  if (profile.role !== 'buyer' && profile.role !== 'seller') {
    throw new RoleAccessError(
      'Access denied. Client role required',
      'buyer',
      profile.role
    )
  }

  return profile as ClientProfile
}

/**
 * Middleware function to require any of the specified roles
 */
export const requireAnyRole = (roles: UserRole[]) => {
  return async (): Promise<UserProfile> => {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      throw new RoleAccessError('Authentication required')
    }

    if (!roles.includes(profile.role)) {
      throw new RoleAccessError(
        `Access denied. Required roles: ${roles.join(', ')}`,
        roles[0],
        profile.role
      )
    }

    return profile
  }
}

/**
 * Check if user has permission to access resource
 */
export const hasPermission = async (
  requiredRole: UserRole
): Promise<boolean> => {
  try {
    await requireRole(requiredRole)()
    return true
  } catch {
    return false
  }
}

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = async (roles: UserRole[]): Promise<boolean> => {
  try {
    await requireAnyRole(roles)()
    return true
  } catch {
    return false
  }
}

/**
 * Validate agent-client relationship
 */
export const validateAgentClientRelationship = async (
  agentId: string,
  clientId: string
): Promise<boolean> => {
  try {
    // Get current user profile
    const currentProfile = await getCurrentUserProfile()
    if (!currentProfile) {
      return false
    }

    // If current user is the agent, check if client belongs to them
    if (currentProfile.role === 'agent' && currentProfile.uid === agentId) {
      const clientProfile = await import('./auth-client').then(m =>
        m.getClientProfile(clientId)
      )
      return clientProfile?.agentId === agentId
    }

    // If current user is the client, check if they belong to the agent
    if (
      (currentProfile.role === 'buyer' || currentProfile.role === 'seller') &&
      currentProfile.uid === clientId
    ) {
      const clientProfile = currentProfile as ClientProfile
      return clientProfile.agentId === agentId
    }

    return false
  } catch {
    return false
  }
}

/**
 * Middleware to ensure user can access client data
 */
export const requireClientAccess = (clientId: string) => {
  return async (): Promise<UserProfile> => {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      throw new RoleAccessError('Authentication required')
    }

    // Agent can access their clients
    if (profile.role === 'agent') {
      const agentProfile = profile as AgentProfile
      const hasAccess = await validateAgentClientRelationship(
        agentProfile.uid,
        clientId
      )

      if (!hasAccess) {
        throw new RoleAccessError(
          'Access denied. Client not under your management'
        )
      }

      return profile
    }

    // Client can access their own data
    if (
      (profile.role === 'buyer' || profile.role === 'seller') &&
      profile.uid === clientId
    ) {
      return profile
    }

    throw new RoleAccessError('Access denied. Insufficient permissions')
  }
}

/**
 * Middleware to ensure user can access agent data
 */
export const requireAgentAccess = (agentId: string) => {
  return async (): Promise<UserProfile> => {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      throw new RoleAccessError('Authentication required')
    }

    // Agent can access their own data
    if (profile.role === 'agent' && profile.uid === agentId) {
      return profile
    }

    // Client can access their agent's data
    if (profile.role === 'buyer' || profile.role === 'seller') {
      const clientProfile = profile as ClientProfile
      if (clientProfile.agentId === agentId) {
        return profile
      }
    }

    throw new RoleAccessError('Access denied. Insufficient permissions')
  }
}

/**
 * Get user's accessible resources based on role
 */
export const getAccessibleResources = async (
  resourceType: 'offers' | 'negotiations' | 'documents'
) => {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    throw new RoleAccessError('Authentication required')
  }

  const resources = {
    userId: profile.uid,
    role: profile.role,
    filters: {} as Record<string, any>,
  }

  switch (profile.role) {
    case 'agent': {
      // Agents can access all resources for their clients
      const agentProfile = profile as AgentProfile
      const clients = await import('./auth-client').then(m =>
        m.getAgentClients(agentProfile.uid)
      )
      const clientIds = clients.map(client => client.uid)

      resources.filters = {
        agentId: agentProfile.uid,
        clientIds: [agentProfile.uid, ...clientIds], // Include agent's own resources
      }
      break
    }

    case 'buyer':
    case 'seller': {
      // Clients can only access their own resources
      const clientProfile = profile as ClientProfile
      resources.filters = {
        userId: clientProfile.uid,
        agentId: clientProfile.agentId,
      }
      break
    }

    default:
      throw new RoleAccessError('Invalid user role')
  }

  return resources
}

/**
 * Create a resource access validator
 */
export const createResourceValidator = (resourceType: string) => {
  return async (
    resourceId: string,
    action: 'read' | 'write' | 'delete' = 'read'
  ): Promise<boolean> => {
    try {
      const profile = await getCurrentUserProfile()
      if (!profile) {
        return false
      }

      // Add resource-specific validation logic here
      // This is a placeholder that can be extended based on specific resource types

      return true
    } catch {
      return false
    }
  }
}

/**
 * Role-based navigation guard
 */
export const canAccessRoute = async (
  route: string,
  requiredRoles?: UserRole[]
): Promise<boolean> => {
  try {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return false
    }

    if (requiredRoles && !requiredRoles.includes(profile.role)) {
      return false
    }

    // Add route-specific logic here
    return true
  } catch {
    return false
  }
}

/**
 * Get user role display information
 */
export const getUserRoleInfo = async () => {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return null
  }

  const roleInfo = {
    role: profile.role,
    displayName: profile.displayName,
    email: profile.email,
    isActive: (profile as any).isActive,
  }

  switch (profile.role) {
    case 'agent': {
      const agentProfile = profile as AgentProfile
      return {
        ...roleInfo,
        type: 'Real Estate Agent',
        details: {
          brokerage: agentProfile.brokerage,
          licenseNumber: agentProfile.licenseNumber,
          specialties: agentProfile.specialties,
          yearsExperience: agentProfile.yearsExperience,
        },
      }
    }

    case 'buyer':
      return {
        ...roleInfo,
        type: 'Buyer',
        details: {
          agentId: (profile as ClientProfile).agentId,
          preferences: (profile as ClientProfile).preferences,
        },
      }

    case 'seller':
      return {
        ...roleInfo,
        type: 'Seller',
        details: {
          agentId: (profile as ClientProfile).agentId,
          preferences: (profile as ClientProfile).preferences,
        },
      }

    default:
      return roleInfo
  }
}
