/**
 * Firebase Services Entry Point
 * Centralized exports for all Firebase functionality
 */

// Firebase Configuration
export {
  firebaseApp,
  auth,
  db,
  storage,
  getFirebaseConfig,
} from './config'

// Authentication Services
export {
  registerUser,
  signInUser,
  signOutUser,
  resetPassword,
  updateUserProfile,
  getCurrentUser,
  onAuthStateChange,
  isAuthenticated,
} from './auth'

// Firestore Database Services
export {
  createProperty,
  getProperty,
  getUserProperties,
  updateProperty,
  deleteProperty,
  createRepairEstimate,
  getRepairEstimate,
  getPropertyRepairEstimates,
  updateRepairEstimate,
  deleteRepairEstimate,
} from './firestore'

// Storage Services
export {
  type UploadProgressCallback,
  uploadPropertyPhoto,
  uploadPropertyPhotos,
  getPropertyPhotos,
  deletePropertyPhoto,
  uploadRepairPhoto,
  uploadUserAvatar,
  deleteFile,
} from './storage'

// Re-export types from shared
export type {
  AuthUser,
  Property,
  RepairEstimate,
  RepairItem,
  FileUploadResult,
} from '../../shared/types'

// Firebase Error Handling Utility
export const handleFirebaseError = (error: any): string => {
  if (error?.code) {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No user found with this email address'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/email-already-in-use':
        return 'Email is already registered'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters'
      case 'auth/invalid-email':
        return 'Invalid email address'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later'
      case 'permission-denied':
        return 'You do not have permission to perform this action'
      case 'not-found':
        return 'The requested resource was not found'
      case 'already-exists':
        return 'The resource already exists'
      default:
        return error.message || 'An unknown error occurred'
    }
  }
  return error.message || 'An unknown error occurred'
}

// Firebase Connection Status
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Import here to avoid circular dependency
    const { getFirebaseConfig } = await import('./config')
    const config = getFirebaseConfig()
    return !!config.projectId
  } catch (error) {
    console.error('Firebase connection check failed:', error)
    return false
  }
}

// Export Firebase types for convenience
export type {
  User,
  UserCredential,
  AuthError,
} from 'firebase/auth'

export type {
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
} from 'firebase/firestore'

export type {
  StorageReference,
  UploadTask,
  FullMetadata,
} from 'firebase/storage'
