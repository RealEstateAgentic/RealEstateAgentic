/**
 * Role Management Utilities and Middleware
 * Provides access control and user role validation utilities for agents
 */

import { getCurrentUserProfile } from './auth'
import type { UserRole, UserProfile, AgentProfile } from '../../shared/types'

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

    throw new RoleAccessError('Access denied. Insufficient permissions')
  }
}

/**
 * Check if user can access a route based on their role
 */
export const canAccessRoute = async (
  route: string,
  requiredRoles?: UserRole[]
): Promise<boolean> => {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }

  try {
    const profile = await getCurrentUserProfile()
    if (!profile) {
      return false
    }

    return requiredRoles.includes(profile.role)
  } catch {
    return false
  }
}

/**
 * Get user role information
 */
export const getUserRoleInfo = async () => {
  try {
    const profile = await getCurrentUserProfile()
    if (!profile) {
      return null
    }

    return {
      role: profile.role,
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
    }
  } catch {
    return null
  }
}

/**
 * Client functions - not supported (removed for agent-only mode)
 */
export const requireClient = async () => {
  throw new RoleAccessError(
    'Client functionality has been removed - agent-only mode'
  )
}

export const requireBuyer = async () => {
  throw new RoleAccessError(
    'Client functionality has been removed - agent-only mode'
  )
}

export const requireSeller = async () => {
  throw new RoleAccessError(
    'Client functionality has been removed - agent-only mode'
  )
}

export const requireClientAccess = (clientId: string) => {
  return async () => {
    throw new RoleAccessError(
      'Client functionality has been removed - agent-only mode'
    )
  }
}
