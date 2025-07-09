/**
 * Firebase Access Control Utilities
 * Provides application-layer access control that works with Firebase security rules
 * for role-based permissions between agents, buyers, and sellers
 */

import { getCurrentUserProfile } from './auth'
import type {
  UserProfile,
  AgentProfile,
  ClientProfile,
  UserRole,
} from '../../shared/types'

// ========== ACCESS CONTROL TYPES ==========

export interface AccessControlContext {
  user: UserProfile
  resource: {
    type: ResourceType
    agentId?: string
    clientId?: string
    ownerId?: string
    permissions?: ResourcePermissions
  }
}

export interface ResourcePermissions {
  canView: string[]
  canEdit: string[]
  canShare: string[]
  canDelete: string[]
  isPublic: boolean
}

export type ResourceType =
  | 'offer'
  | 'negotiation'
  | 'document'
  | 'market_data'
  | 'user_profile'
  | 'template'
  | 'report'

export type AccessLevel = 'none' | 'read' | 'write' | 'admin'

export interface AccessResult {
  allowed: boolean
  level: AccessLevel
  reason?: string
}

// ========== ACCESS CONTROL SERVICE ==========

/**
 * Check if agent has relationship with client
 * This is a simplified version - in production, you'd query the database
 */
const hasAgentClientRelationship = (
  agentProfile: AgentProfile,
  clientId: string
): boolean => {
  // This would typically check a database relationship
  // For now, we'll assume the relationship exists if the agent profile
  // has a clientIds field (this would be populated during registration)
  return (agentProfile as any).clientIds?.[clientId] === true
}

/**
 * Evaluate access to offers and negotiations
 */
const evaluateOfferNegotiationAccess = (
  context: AccessControlContext,
  action: 'create' | 'read' | 'update' | 'delete'
): AccessResult => {
  const { user, resource } = context

  // Check if user is the agent for this resource
  if (user.role === 'agent' && user.uid === resource.agentId) {
    return { allowed: true, level: action === 'delete' ? 'admin' : 'write' }
  }

  // Check if user is the client for this resource
  if (
    (user.role === 'buyer' || user.role === 'seller') &&
    user.uid === resource.clientId
  ) {
    // Clients can read and update their own resources, but not delete
    if (action === 'delete') {
      return {
        allowed: false,
        level: 'write',
        reason: 'Clients cannot delete resources',
      }
    }
    if (action === 'create') {
      return {
        allowed: false,
        level: 'read',
        reason: 'Only agents can create offers/negotiations',
      }
    }
    return { allowed: true, level: action === 'read' ? 'read' : 'write' }
  }

  // Check agent-client relationship
  if (user.role === 'agent' && resource.clientId) {
    const agentProfile = user as AgentProfile
    // Note: This would need to be enhanced with actual client relationship checking
    if (hasAgentClientRelationship(agentProfile, resource.clientId)) {
      return { allowed: true, level: action === 'delete' ? 'admin' : 'write' }
    }
  }

  return {
    allowed: false,
    level: 'none',
    reason: 'No relationship to resource',
  }
}

/**
 * Evaluate access to documents with granular permissions
 */
const evaluateDocumentAccess = (
  context: AccessControlContext,
  action: 'create' | 'read' | 'update' | 'delete'
): AccessResult => {
  const { user, resource } = context

  // Check document-specific permissions if they exist
  if (resource.permissions) {
    switch (action) {
      case 'read':
        if (
          resource.permissions.isPublic ||
          resource.permissions.canView.includes(user.uid)
        ) {
          return { allowed: true, level: 'read' }
        }
        break

      case 'update':
        if (resource.permissions.canEdit.includes(user.uid)) {
          return { allowed: true, level: 'write' }
        }
        break

      case 'delete':
        if (resource.permissions.canDelete.includes(user.uid)) {
          return { allowed: true, level: 'admin' }
        }
        break

      case 'create':
        // Anyone can create documents (will be owned by them)
        return { allowed: true, level: 'write' }
    }
  }

  // Fall back to agent/client relationship rules
  return evaluateOfferNegotiationAccess(context, action)
}

/**
 * Evaluate access to market data (generally public for authenticated users)
 */
const evaluateMarketDataAccess = (
  context: AccessControlContext,
  action: 'create' | 'read' | 'update' | 'delete'
): AccessResult => {
  const { user } = context

  // Read access for all authenticated users
  if (action === 'read') {
    return { allowed: true, level: 'read' }
  }

  // Write access only for agents
  if (user.role === 'agent') {
    return { allowed: true, level: 'write' }
  }

  return {
    allowed: false,
    level: 'read',
    reason: 'Only agents can modify market data',
  }
}

/**
 * Evaluate access to user profiles
 */
const evaluateUserProfileAccess = (
  context: AccessControlContext,
  action: 'create' | 'read' | 'update' | 'delete'
): AccessResult => {
  const { user, resource } = context

  // Users can always access their own profile
  if (user.uid === resource.ownerId) {
    return { allowed: true, level: action === 'delete' ? 'admin' : 'write' }
  }

  // Agents can read their clients' basic profile info
  if (user.role === 'agent' && resource.clientId) {
    if (hasAgentClientRelationship(user as AgentProfile, resource.clientId)) {
      return {
        allowed: action === 'read',
        level: 'read',
        reason:
          action !== 'read'
            ? 'Agents can only read client profiles'
            : undefined,
      }
    }
  }

  return {
    allowed: false,
    level: 'none',
    reason: 'No access to other user profiles',
  }
}

/**
 * Evaluate access to templates
 */
const evaluateTemplateAccess = (
  context: AccessControlContext,
  action: 'create' | 'read' | 'update' | 'delete'
): AccessResult => {
  const { user } = context

  // All authenticated users can read templates
  if (action === 'read') {
    return { allowed: true, level: 'read' }
  }

  // Only agents can modify templates
  if (user.role === 'agent') {
    return { allowed: true, level: 'write' }
  }

  return {
    allowed: false,
    level: 'read',
    reason: 'Only agents can modify templates',
  }
}

/**
 * Evaluate access to reports
 */
const evaluateReportAccess = (
  context: AccessControlContext,
  action: 'create' | 'read' | 'update' | 'delete'
): AccessResult => {
  const { user, resource } = context

  // Agent owns the report
  if (user.role === 'agent' && user.uid === resource.agentId) {
    return { allowed: true, level: 'write' }
  }

  // Client can read reports created for them
  if (
    (user.role === 'buyer' || user.role === 'seller') &&
    user.uid === resource.clientId &&
    action === 'read'
  ) {
    return { allowed: true, level: 'read' }
  }

  return { allowed: false, level: 'none', reason: 'No access to report' }
}

/**
 * Core access evaluation logic
 */
const evaluateAccess = (
  context: AccessControlContext,
  action: 'create' | 'read' | 'update' | 'delete'
): AccessResult => {
  const { user, resource } = context

  // Admin override (if implemented in the future)
  // Currently user.role is 'agent' | 'buyer' | 'seller'
  // Admin functionality would need to be added to UserRole type
  if ((user as any).role === 'admin') {
    return { allowed: true, level: 'admin' }
  }

  // Route to specific resource type handler
  switch (resource.type) {
    case 'offer':
    case 'negotiation':
      return evaluateOfferNegotiationAccess(context, action)

    case 'document':
      return evaluateDocumentAccess(context, action)

    case 'market_data':
      return evaluateMarketDataAccess(context, action)

    case 'user_profile':
      return evaluateUserProfileAccess(context, action)

    case 'template':
      return evaluateTemplateAccess(context, action)

    case 'report':
      return evaluateReportAccess(context, action)

    default:
      return {
        allowed: false,
        level: 'none',
        reason: 'Unknown resource type',
      }
  }
}

/**
 * Check if user has access to a resource
 */
export const checkAccess = async (
  resourceType: ResourceType,
  resourceData: any,
  action: 'create' | 'read' | 'update' | 'delete' = 'read'
): Promise<AccessResult> => {
  try {
    const user = await getCurrentUserProfile()

    if (!user) {
      return {
        allowed: false,
        level: 'none',
        reason: 'User not authenticated',
      }
    }

    const context: AccessControlContext = {
      user,
      resource: {
        type: resourceType,
        agentId: resourceData.agentId,
        clientId: resourceData.clientId,
        ownerId: resourceData.ownerId || resourceData.userId,
        permissions: resourceData.permissions,
      },
    }

    return evaluateAccess(context, action)
  } catch (error) {
    return {
      allowed: false,
      level: 'none',
      reason: `Access check failed: ${error}`,
    }
  }
}

// ========== CONVENIENCE FUNCTIONS ==========

/**
 * Quick access check for offers
 */
export const canAccessOffer = async (
  offerData: any,
  action: 'create' | 'read' | 'update' | 'delete' = 'read'
): Promise<boolean> => {
  const result = await checkAccess('offer', offerData, action)
  return result.allowed
}

/**
 * Quick access check for negotiations
 */
export const canAccessNegotiation = async (
  negotiationData: any,
  action: 'create' | 'read' | 'update' | 'delete' = 'read'
): Promise<boolean> => {
  const result = await checkAccess('negotiation', negotiationData, action)
  return result.allowed
}

/**
 * Quick access check for documents
 */
export const canAccessDocument = async (
  documentData: any,
  action: 'create' | 'read' | 'update' | 'delete' = 'read'
): Promise<boolean> => {
  const result = await checkAccess('document', documentData, action)
  return result.allowed
}

/**
 * Quick access check for market data
 */
export const canAccessMarketData = async (
  marketData: any,
  action: 'create' | 'read' | 'update' | 'delete' = 'read'
): Promise<boolean> => {
  const result = await checkAccess('market_data', marketData, action)
  return result.allowed
}

// ========== MIDDLEWARE FUNCTIONS ==========

/**
 * Middleware to enforce access control in API routes/IPC handlers
 */
export const withAccessControl = (
  resourceType: ResourceType,
  action: 'create' | 'read' | 'update' | 'delete' = 'read'
) => {
  return async (resourceData: any) => {
    const accessResult = await checkAccess(resourceType, resourceData, action)

    if (!accessResult.allowed) {
      throw new Error(
        `Access denied: ${accessResult.reason || 'Insufficient permissions'}`
      )
    }

    return accessResult
  }
}

/**
 * Role-based access decorator
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async () => {
    const user = await getCurrentUserProfile()

    if (!user) {
      throw new Error('Authentication required')
    }

    if (!allowedRoles.includes(user.role)) {
      throw new Error(
        `Access denied: requires role ${allowedRoles.join(' or ')}`
      )
    }

    return user
  }
}

/**
 * Agent-only access decorator
 */
export const requireAgent = requireRole(['agent'])

/**
 * Client-only access decorator
 */
export const requireClient = requireRole(['buyer', 'seller'])

/**
 * Multi-role access decorator
 */
export const requireAgentOrClient = requireRole(['agent', 'buyer', 'seller'])

// ========== PERMISSION UTILITIES ==========

/**
 * Get effective permissions for a user on a resource
 */
export const getEffectivePermissions = async (
  resourceType: ResourceType,
  resourceData: any
): Promise<{
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  level: AccessLevel
}> => {
  const [readResult, writeResult, deleteResult] = await Promise.all([
    checkAccess(resourceType, resourceData, 'read'),
    checkAccess(resourceType, resourceData, 'update'),
    checkAccess(resourceType, resourceData, 'delete'),
  ])

  return {
    canRead: readResult.allowed,
    canWrite: writeResult.allowed,
    canDelete: deleteResult.allowed,
    level: deleteResult.allowed
      ? 'admin'
      : writeResult.allowed
        ? 'write'
        : readResult.allowed
          ? 'read'
          : 'none',
  }
}

/**
 * Filter resources based on user permissions
 */
export const filterAccessibleResources = async <
  T extends { agentId?: string; clientId?: string },
>(
  resourceType: ResourceType,
  resources: T[]
): Promise<T[]> => {
  const user = await getCurrentUserProfile()
  if (!user) return []

  const accessibleResources: T[] = []

  for (const resource of resources) {
    const canAccess = await checkAccess(resourceType, resource, 'read')
    if (canAccess.allowed) {
      accessibleResources.push(resource)
    }
  }

  return accessibleResources
}

/**
 * Create resource with proper ownership
 */
export const createResourceWithOwnership = async <T>(
  resourceType: ResourceType,
  resourceData: Partial<T>,
  explicitOwnership?: { agentId?: string; clientId?: string }
): Promise<T> => {
  const user = await getCurrentUserProfile()
  if (!user) {
    throw new Error('Authentication required to create resource')
  }

  // Set ownership based on user role
  const ownership = explicitOwnership || {}

  if (user.role === 'agent') {
    ownership.agentId = user.uid
  } else if (user.role === 'buyer' || user.role === 'seller') {
    ownership.clientId = user.uid
    // Clients need an agent - this would be set during client registration
    if (!(user as ClientProfile).agentId) {
      throw new Error('Client must be associated with an agent')
    }
    ownership.agentId = (user as ClientProfile).agentId
  }

  const resourceWithOwnership = {
    ...resourceData,
    ...ownership,
  } as T

  // Verify the user can create this resource
  const canCreate = await checkAccess(
    resourceType,
    resourceWithOwnership,
    'create'
  )
  if (!canCreate.allowed) {
    throw new Error(`Cannot create resource: ${canCreate.reason}`)
  }

  return resourceWithOwnership
}

// ========== EXPORT ACCESS CONTROL SERVICE ==========

export const AccessControlService = {
  checkAccess,
  canAccessOffer,
  canAccessNegotiation,
  canAccessDocument,
  canAccessMarketData,
  withAccessControl,
  requireRole,
  requireAgent,
  requireClient,
  requireAgentOrClient,
  getEffectivePermissions,
  filterAccessibleResources,
  createResourceWithOwnership,
}

export default AccessControlService
