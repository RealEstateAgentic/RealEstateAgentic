/**
 * Firebase Authentication Service
 * Handles user authentication for the Real Estate Agentic application
 * Updated with role-based authentication support
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'
import type {
  AuthUser,
  UserProfile,
  AgentProfile,
  ClientProfile,
  UserRole,
  AgentRegistrationData,
  ClientRegistrationData,
} from '../../shared/types'
import { registerAgent, signInAgent } from './auth-agent'
import { registerClient, signInClient } from './auth-client'

/**
 * Register a new agent
 */
export const registerUserAsAgent = async (
  registrationData: AgentRegistrationData
): Promise<AgentProfile> => {
  return await registerAgent(registrationData)
}

/**
 * Register a new client (buyer or seller)
 */
export const registerUserAsClient = async (
  registrationData: ClientRegistrationData
): Promise<ClientProfile> => {
  return await registerClient(registrationData)
}

/**
 * Sign in with role-based authentication
 */
export const signInUserWithRole = async (
  email: string,
  password: string,
  expectedRole?: UserRole
): Promise<UserProfile> => {
  try {
    // First, get the user's role from Firestore
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))

    if (!userDoc.exists()) {
      throw new Error('User profile not found')
    }

    const userData = userDoc.data()
    const userRole = userData.role

    // Validate expected role if provided
    if (expectedRole && userRole !== expectedRole) {
      throw new Error(
        `Invalid user type. Expected ${expectedRole} credentials.`
      )
    }

    // Sign out and re-sign in with role-specific service
    await signOut(auth)

    if (userRole === 'agent') {
      return await signInAgent(email, password)
    } else if (userRole === 'buyer' || userRole === 'seller') {
      return await signInClient(email, password)
    } else {
      throw new Error('Invalid user role')
    }
  } catch (error: any) {
    throw new Error(`Role-based sign in failed: ${error.message}`)
  }
}

/**
 * Legacy register function - deprecated, use role-specific registration
 * @deprecated Use registerUserAsAgent or registerUserAsClient instead
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> => {
  throw new Error(
    'Legacy registration deprecated. Use registerUserAsAgent or registerUserAsClient.'
  )
}

/**
 * Legacy sign in function - deprecated, use role-based sign in
 * @deprecated Use signInUserWithRole instead
 */
export const signInUser = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  throw new Error('Legacy sign in deprecated. Use signInUserWithRole instead.')
}

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error) {
    throw new Error(`Sign out failed: ${error}`)
  }
}

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    throw new Error(`Password reset failed: ${error}`)
  }
}

/**
 * Update user profile
 */
export const updateUserProfile = async (updates: {
  displayName?: string
}): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('No authenticated user')
    }

    await updateProfile(user, updates)
  } catch (error) {
    throw new Error(`Profile update failed: ${error}`)
  }
}

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

/**
 * Listen to authentication state changes with role-based user profiles
 */
export const onAuthStateChange = (
  callback: (user: UserProfile | null) => void
) => {
  return onAuthStateChanged(auth, async user => {
    if (user) {
      try {
        // Get user profile from Firestore to determine role
        const userDoc = await getDoc(doc(db, 'users', user.uid))

        if (!userDoc.exists()) {
          callback(null)
          return
        }

        const userData = userDoc.data()
        const userRole = userData.role

        // Return role-based profile
        const baseProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          role: userRole,
          createdAt:
            userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt,
          updatedAt:
            userData.updatedAt?.toDate?.()?.toISOString() || userData.updatedAt,
        }

        if (userRole === 'agent') {
          callback({
            ...baseProfile,
            licenseNumber: userData.licenseNumber,
            brokerage: userData.brokerage,
            phoneNumber: userData.phoneNumber,
            profileImageUrl: userData.profileImageUrl,
            bio: userData.bio,
            specialties: userData.specialties || [],
            yearsExperience: userData.yearsExperience,
            isActive: userData.isActive,
          } as AgentProfile)
        } else if (userRole === 'buyer' || userRole === 'seller') {
          callback({
            ...baseProfile,
            phoneNumber: userData.phoneNumber,
            profileImageUrl: userData.profileImageUrl,
            agentId: userData.agentId,
            preferences: userData.preferences,
            isActive: userData.isActive,
          } as ClientProfile)
        } else {
          callback(null)
        }
      } catch (error) {
        console.error('Error getting user profile:', error)
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}

/**
 * Legacy auth state change - deprecated
 * @deprecated Use the updated onAuthStateChange instead
 */
export const onLegacyAuthStateChange = (
  callback: (user: AuthUser | null) => void
) => {
  throw new Error(
    'Legacy auth state change deprecated. Use updated onAuthStateChange.'
  )
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null
}

/**
 * Get current user profile with role information
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return null
    }

    const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data()
    const userRole = userData.role

    const baseProfile = {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      emailVerified: currentUser.emailVerified,
      role: userRole,
      createdAt:
        userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt,
      updatedAt:
        userData.updatedAt?.toDate?.()?.toISOString() || userData.updatedAt,
    }

    if (userRole === 'agent') {
      return {
        ...baseProfile,
        licenseNumber: userData.licenseNumber,
        brokerage: userData.brokerage,
        phoneNumber: userData.phoneNumber,
        profileImageUrl: userData.profileImageUrl,
        bio: userData.bio,
        specialties: userData.specialties || [],
        yearsExperience: userData.yearsExperience,
        isActive: userData.isActive,
      } as AgentProfile
    } else if (userRole === 'buyer' || userRole === 'seller') {
      return {
        ...baseProfile,
        phoneNumber: userData.phoneNumber,
        profileImageUrl: userData.profileImageUrl,
        agentId: userData.agentId,
        preferences: userData.preferences,
        isActive: userData.isActive,
      } as ClientProfile
    }

    return null
  } catch (error) {
    console.error('Failed to get current user profile:', error)
    return null
  }
}

/**
 * Check if current user has specific role
 */
export const hasRole = async (role: UserRole): Promise<boolean> => {
  try {
    const profile = await getCurrentUserProfile()
    return profile?.role === role
  } catch (error) {
    return false
  }
}

/**
 * Check if current user is an agent
 */
export const isAgent = async (): Promise<boolean> => {
  return await hasRole('agent')
}

/**
 * Check if current user is a buyer
 */
export const isBuyer = async (): Promise<boolean> => {
  return await hasRole('buyer')
}

/**
 * Check if current user is a seller
 */
export const isSeller = async (): Promise<boolean> => {
  return await hasRole('seller')
}

/**
 * Check if current user is a client (buyer or seller)
 */
export const isClient = async (): Promise<boolean> => {
  const profile = await getCurrentUserProfile()
  return profile?.role === 'buyer' || profile?.role === 'seller'
}
