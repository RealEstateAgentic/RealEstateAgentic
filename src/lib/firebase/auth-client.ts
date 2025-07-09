/**
 * Firebase Client Authentication Service
 * Handles client-specific authentication and profile management for buyers and sellers
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
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './config'
import type {
  ClientProfile,
  ClientRegistrationData,
} from '../../shared/types'
import { getCurrentUser } from './auth'

/**
 * Register a new client (buyer or seller) with email, password, and details
 */
export const registerClient = async (
  registrationData: ClientRegistrationData
): Promise<ClientProfile> => {
  try {
    const { email, password, displayName, role, phoneNumber, agentId } =
      registrationData

    // Validate role
    if (role !== 'buyer' && role !== 'seller') {
      throw new Error('Invalid role. Must be buyer or seller.')
    }

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

    // Create client profile document in Firestore
    const now = serverTimestamp()
    const clientProfile: Omit<ClientProfile, 'uid'> = {
      email: userCredential.user.email,
      displayName,
      emailVerified: userCredential.user.emailVerified,
      role,
      phoneNumber,
      agentId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save to Firestore users collection
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...clientProfile,
      createdAt: now,
      updatedAt: now,
    })

    return {
      uid: userCredential.user.uid,
      ...clientProfile,
    }
  } catch (error: any) {
    throw new Error(`Client registration failed: ${error.message}`)
  }
}

/**
 * Sign in a client with email and password
 */
export const signInClient = async (
  email: string,
  password: string
): Promise<ClientProfile> => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )

    // Get client profile from Firestore
    const clientProfile = await getClientProfile(userCredential.user.uid)

    if (!clientProfile) {
      throw new Error('Client profile not found')
    }

    if (clientProfile.role !== 'buyer' && clientProfile.role !== 'seller') {
      throw new Error('Invalid user type. Client credentials required.')
    }

    if (!clientProfile.isActive) {
      throw new Error(
        'Client account is deactivated. Please contact your agent.'
      )
    }

    return clientProfile
  } catch (error: any) {
    throw new Error(`Client sign in failed: ${error.message}`)
  }
}

/**
 * Get client profile by user ID
 */
export const getClientProfile = async (
  uid: string
): Promise<ClientProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))

    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data()

    // Verify this is a client profile
    if (userData.role !== 'buyer' && userData.role !== 'seller') {
      return null
    }

    return {
      uid: userDoc.id,
      ...userData,
      createdAt:
        userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt,
      updatedAt:
        userData.updatedAt?.toDate?.()?.toISOString() || userData.updatedAt,
    } as ClientProfile
  } catch (error: any) {
    throw new Error(`Failed to get client profile: ${error.message}`)
  }
}

/**
 * Update client profile information
 */
export const updateClientProfile = async (
  uid: string,
  updates: Partial<Omit<ClientProfile, 'uid' | 'email' | 'role' | 'createdAt'>>
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid)

    // Verify user exists and is a client
    const userDoc = await getDoc(userDocRef)
    if (!userDoc.exists()) {
      throw new Error('Client profile not found')
    }

    const userData = userDoc.data()
    if (userData.role !== 'buyer' && userData.role !== 'seller') {
      throw new Error('Client profile not found')
    }

    // Update profile with timestamp
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(`Failed to update client profile: ${error.message}`)
  }
}

/**
 * Get current authenticated client profile
 */
export const getCurrentClientProfile =
  async (): Promise<ClientProfile | null> => {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        return null
      }

      return await getClientProfile(currentUser.uid)
    } catch (error) {
      console.error('Failed to get current client profile:', error)
      return null
    }
  }

/**
 * Get all clients for a specific agent
 */
export const getAgentClients = async (
  agentId: string
): Promise<ClientProfile[]> => {
  try {
    const clientsQuery = query(
      collection(db, 'users'),
      where('agentId', '==', agentId),
      where('role', 'in', ['buyer', 'seller'])
    )

    const querySnapshot = await getDocs(clientsQuery)
    const clients: ClientProfile[] = []

    for (const doc of querySnapshot.docs) {
      const userData = doc.data()
      clients.push({
        uid: doc.id,
        ...userData,
        createdAt:
          userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt,
        updatedAt:
          userData.updatedAt?.toDate?.()?.toISOString() || userData.updatedAt,
      } as ClientProfile)
    }

    return clients.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (error: any) {
    throw new Error(`Failed to get agent clients: ${error.message}`)
  }
}

/**
 * Assign an agent to a client
 */
export const assignAgentToClient = async (
  clientId: string,
  agentId: string
): Promise<void> => {
  try {
    await updateClientProfile(clientId, { agentId })
  } catch (error: any) {
    throw new Error(`Failed to assign agent to client: ${error.message}`)
  }
}

/**
 * Remove agent assignment from client
 */
export const removeAgentFromClient = async (
  clientId: string
): Promise<void> => {
  try {
    await updateClientProfile(clientId, { agentId: undefined })
  } catch (error: any) {
    throw new Error(`Failed to remove agent from client: ${error.message}`)
  }
}

/**
 * Update client preferences
 */
export const updateClientPreferences = async (
  clientId: string,
  preferences: ClientProfile['preferences']
): Promise<void> => {
  try {
    await updateClientProfile(clientId, { preferences })
  } catch (error: any) {
    throw new Error(`Failed to update client preferences: ${error.message}`)
  }
}

/**
 * Deactivate client account
 */
export const deactivateClient = async (uid: string): Promise<void> => {
  try {
    await updateClientProfile(uid, { isActive: false })
  } catch (error: any) {
    throw new Error(`Failed to deactivate client: ${error.message}`)
  }
}

/**
 * Reactivate client account
 */
export const reactivateClient = async (uid: string): Promise<void> => {
  try {
    await updateClientProfile(uid, { isActive: true })
  } catch (error: any) {
    throw new Error(`Failed to reactivate client: ${error.message}`)
  }
}
