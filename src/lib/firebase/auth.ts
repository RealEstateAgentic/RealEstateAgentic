/**
 * Firebase Authentication Service
 * Handles user authentication for the Real Estate Agentic application
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { auth } from './config'
import type { AuthUser } from '../../shared/types'

/**
 * Register a new user with email and password
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, { displayName })
    }

    // Send email verification
    await sendEmailVerification(userCredential.user)

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      emailVerified: userCredential.user.emailVerified,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    throw new Error(`Registration failed: ${error}`)
  }
}

/**
 * Sign in user with email and password
 */
export const signInUser = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      emailVerified: userCredential.user.emailVerified,
      createdAt:
        userCredential.user.metadata.creationTime || new Date().toISOString(),
    }
  } catch (error) {
    throw new Error(`Sign in failed: ${error}`)
  }
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
 * Listen to authentication state changes
 */
export const onAuthStateChange = (
  callback: (user: AuthUser | null) => void
) => {
  return onAuthStateChanged(auth, user => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime || new Date().toISOString(),
      })
    } else {
      callback(null)
    }
  })
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null
}
