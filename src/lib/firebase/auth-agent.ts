/**
 * Firebase Agent Authentication Service
 * Handles agent-specific authentication and profile management
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  type UserCredential,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './config'
import { debugAgentAuth } from './debug-auth'
import type { AgentProfile, AgentRegistrationData } from '../../shared/types'
import { getCurrentUser } from './auth'

/**
 * Register a new agent with email, password, and professional details
 */
export const registerAgent = async (
  registrationData: AgentRegistrationData
): Promise<AgentProfile> => {
  try {
    const { email, password, displayName, ...agentDetails } = registrationData

    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    // Update Firebase Auth profile
    await updateProfile(userCredential.user, { displayName })

    // Send email verification
    await sendEmailVerification(userCredential.user)

    // Create agent profile document in Firestore
    const now = serverTimestamp()
    const agentProfile: Omit<AgentProfile, 'uid'> = {
      email: userCredential.user.email,
      displayName,
      emailVerified: userCredential.user.emailVerified,
      role: 'agent' as const,
      licenseNumber: agentDetails.licenseNumber,
      brokerage: agentDetails.brokerage,
      phoneNumber: agentDetails.phoneNumber,
      specialties: agentDetails.specialties,
      yearsExperience: agentDetails.yearsExperience,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save to Firestore users collection
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...agentProfile,
      createdAt: now,
      updatedAt: now,
    })

    return {
      uid: userCredential.user.uid,
      ...agentProfile,
    }
  } catch (error: any) {
    throw new Error(`Agent registration failed: ${error.message}`)
  }
}

/**
 * Sign in an agent with email and password
 */
export const signInAgent = async (
  email: string,
  password: string
): Promise<AgentProfile> => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )

    // Get agent profile from Firestore
    const agentProfile = await getAgentProfile(userCredential.user.uid)

    if (!agentProfile) {
      console.log('⚠️ Agent profile not found, attempting debug and auto-fix...')
      // Use debug function to diagnose and fix the issue
      const debugResult = await debugAgentAuth(email, password)
      return debugResult as AgentProfile
    }

    if (agentProfile.role !== 'agent') {
      throw new Error('Invalid user type. Agent credentials required.')
    }

    if (!agentProfile.isActive) {
      throw new Error('Agent account is deactivated. Please contact support.')
    }

    return agentProfile
  } catch (error: any) {
    // If normal sign in fails, try debug function for detailed diagnosis
    if (error.message.includes('Agent profile not found')) {
      console.log('🔧 Attempting to debug and fix authentication issue...')
      try {
        const debugResult = await debugAgentAuth(email, password)
        return debugResult as AgentProfile
      } catch (debugError: any) {
        throw new Error(`Agent sign in failed: ${debugError.message}`)
      }
    }
    throw new Error(`Agent sign in failed: ${error.message}`)
  }
}

/**
 * Get agent profile by user ID
 */
export const getAgentProfile = async (
  uid: string
): Promise<AgentProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))

    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data()

    // Verify this is an agent profile
    if (userData.role !== 'agent') {
      return null
    }

    return {
      uid: userDoc.id,
      ...userData,
      createdAt:
        userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt,
      updatedAt:
        userData.updatedAt?.toDate?.()?.toISOString() || userData.updatedAt,
    } as AgentProfile
  } catch (error: any) {
    throw new Error(`Failed to get agent profile: ${error.message}`)
  }
}

/**
 * Update agent profile information
 */
export const updateAgentProfile = async (
  uid: string,
  updates: Partial<Omit<AgentProfile, 'uid' | 'email' | 'role' | 'createdAt'>>
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid)

    // Verify user exists and is an agent
    const userDoc = await getDoc(userDocRef)
    if (!userDoc.exists() || userDoc.data().role !== 'agent') {
      throw new Error('Agent profile not found')
    }

    // Update profile with timestamp
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(`Failed to update agent profile: ${error.message}`)
  }
}

/**
 * Get current authenticated agent profile
 */
export const getCurrentAgentProfile =
  async (): Promise<AgentProfile | null> => {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        return null
      }

      return await getAgentProfile(currentUser.uid)
    } catch (error) {
      console.error('Failed to get current agent profile:', error)
      return null
    }
  }

/**
 * Deactivate agent account
 */
export const deactivateAgent = async (uid: string): Promise<void> => {
  try {
    await updateAgentProfile(uid, { isActive: false })
  } catch (error: any) {
    throw new Error(`Failed to deactivate agent: ${error.message}`)
  }
}

/**
 * Reactivate agent account
 */
export const reactivateAgent = async (uid: string): Promise<void> => {
  try {
    await updateAgentProfile(uid, { isActive: true })
  } catch (error: any) {
    throw new Error(`Failed to reactivate agent: ${error.message}`)
  }
}
