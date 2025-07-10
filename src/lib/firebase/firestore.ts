/**
 * Firestore Database Service
 * Handles database operations for the Real Estate Agentic application
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { getCurrentUser } from './auth'
import type { Property, RepairEstimate, } from '../../shared/types'

/**
 * Collection names
 */
const COLLECTIONS = {
  PROPERTIES: 'properties',
  REPAIR_ESTIMATES: 'repairEstimates',
  USERS: 'users',
} as const

/**
 * Convert Firestore timestamp to Date
 */
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}

/**
 * Get current user ID or throw error
 */
const getCurrentUserId = (): string => {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('User must be authenticated')
  }
  return user.uid
}

// ========== PROPERTY OPERATIONS ==========

/**
 * Create a new property
 */
export const createProperty = async (
  propertyData: Omit<Property, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const userId = getCurrentUserId()
    const now = serverTimestamp()

    const property: Omit<Property, 'id'> = {
      ...propertyData,
      userId,
      createdAt: now as any,
      updatedAt: now as any,
    }

    const docRef = await addDoc(
      collection(db, COLLECTIONS.PROPERTIES),
      property
    )
    return docRef.id
  } catch (error) {
    throw new Error(`Failed to create property: ${error}`)
  }
}

/**
 * Get property by ID
 */
export const getProperty = async (
  propertyId: string
): Promise<Property | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.PROPERTIES, propertyId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Property
  } catch (error) {
    throw new Error(`Failed to get property: ${error}`)
  }
}

/**
 * Get all properties for current user
 */
export const getUserProperties = async (): Promise<Property[]> => {
  try {
    const userId = getCurrentUserId()
    const q = query(
      collection(db, COLLECTIONS.PROPERTIES),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as Property
    })
  } catch (error) {
    throw new Error(`Failed to get user properties: ${error}`)
  }
}

/**
 * Update property
 */
export const updateProperty = async (
  propertyId: string,
  updates: Partial<Property>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.PROPERTIES, propertyId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error(`Failed to update property: ${error}`)
  }
}

/**
 * Delete property
 */
export const deleteProperty = async (propertyId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.PROPERTIES, propertyId)
    await deleteDoc(docRef)
  } catch (error) {
    throw new Error(`Failed to delete property: ${error}`)
  }
}

// ========== REPAIR ESTIMATE OPERATIONS ==========

/**
 * Create a new repair estimate
 */
export const createRepairEstimate = async (
  estimateData: Omit<
    RepairEstimate,
    'id' | 'userId' | 'createdAt' | 'updatedAt'
  >
): Promise<string> => {
  try {
    const userId = getCurrentUserId()
    const now = serverTimestamp()

    const estimate: Omit<RepairEstimate, 'id'> = {
      ...estimateData,
      userId,
      createdAt: now as any,
      updatedAt: now as any,
    }

    const docRef = await addDoc(
      collection(db, COLLECTIONS.REPAIR_ESTIMATES),
      estimate
    )
    return docRef.id
  } catch (error) {
    throw new Error(`Failed to create repair estimate: ${error}`)
  }
}

/**
 * Get repair estimate by ID
 */
export const getRepairEstimate = async (
  estimateId: string
): Promise<RepairEstimate | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.REPAIR_ESTIMATES, estimateId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as RepairEstimate
  } catch (error) {
    throw new Error(`Failed to get repair estimate: ${error}`)
  }
}

/**
 * Get all repair estimates for a property
 */
export const getPropertyRepairEstimates = async (
  propertyId: string
): Promise<RepairEstimate[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.REPAIR_ESTIMATES),
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as RepairEstimate
    })
  } catch (error) {
    throw new Error(`Failed to get property repair estimates: ${error}`)
  }
}

/**
 * Update repair estimate
 */
export const updateRepairEstimate = async (
  estimateId: string,
  updates: Partial<RepairEstimate>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.REPAIR_ESTIMATES, estimateId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error(`Failed to update repair estimate: ${error}`)
  }
}

/**
 * Delete repair estimate
 */
export const deleteRepairEstimate = async (
  estimateId: string
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.REPAIR_ESTIMATES, estimateId)
    await deleteDoc(docRef)
  } catch (error) {
    throw new Error(`Failed to delete repair estimate: ${error}`)
  }
}
