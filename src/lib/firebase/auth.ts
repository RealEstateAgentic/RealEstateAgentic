/**
 * Firebase Authentication Module
 * Handles user authentication, registration, and profile management for agents
 */

import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'
import type {
  AuthUser,
  UserProfile,
  AgentProfile,
  UserRole,
  AgentRegistrationData,
} from '../../shared/types'
import { registerAgent, signInAgent } from './auth-agent'

/**
 * Register a new agent
 */
export const registerUserAsAgent = async (
  registrationData: AgentRegistrationData
): Promise<AgentProfile> => {
  return await registerAgent(registrationData)
}

/**
 * Sign in with role-based authentication - agents only
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
    } else {
      throw new Error('Invalid user role - only agents are supported')
    }
  } catch (error: any) {
    throw new Error(`Role-based sign in failed: ${error.message}`)
  }
}

/**
 * Legacy register function - deprecated, use role-specific registration
 * @deprecated Use registerUserAsAgent instead
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> => {
  throw new Error(
    'Legacy registration deprecated. Use registerUserAsAgent instead.'
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

        // Return role-based profile - only support agents
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
        } else {
          callback(null)
        }
      } catch (error) {
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}

/**
 * Legacy auth state change listener
 * @deprecated Use onAuthStateChange instead
 */
export const onLegacyAuthStateChange = (
  callback: (user: AuthUser | null) => void
) => {
  return onAuthStateChanged(auth, user => {
    if (user) {
      // Convert Firebase User to AuthUser for legacy compatibility
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        role: 'agent', // Default role for legacy compatibility
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      callback(authUser)
    } else {
      callback(null)
    }
  })
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser
}

/**
 * Get current user profile with role information
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = auth.currentUser
    if (!user) {
      return null
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data()
    const userRole = userData.role

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
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Check if user has specific role
 */
export const hasRole = async (role: UserRole): Promise<boolean> => {
  try {
    const profile = await getCurrentUserProfile()
    return profile?.role === role
  } catch {
    return false
  }
}

/**
 * Check if user is an agent
 */
export const isAgent = async (): Promise<boolean> => {
  return await hasRole('agent')
}
