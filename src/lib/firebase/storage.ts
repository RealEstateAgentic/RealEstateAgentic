/**
 * Firebase Storage Service
 * Handles file uploads and management for the Real Estate Agentic application
 */

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  UploadTask,
  StorageReference,
  FullMetadata
} from 'firebase/storage'
import { storage } from './config'
import { getCurrentUser } from './auth'

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progress: number) => void

/**
 * File upload result
 */
export interface FileUploadResult {
  url: string
  path: string
  fileName: string
  size: number
  contentType: string
  uploadedAt: Date
}

/**
 * Storage paths for different file types
 */
const STORAGE_PATHS = {
  PROPERTY_PHOTOS: 'property-photos',
  PROPERTY_DOCUMENTS: 'property-documents',
  USER_AVATARS: 'user-avatars',
  REPAIR_PHOTOS: 'repair-photos'
} as const

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

/**
 * Generate unique file name
 */
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  return `${timestamp}_${randomString}.${extension}`
}

/**
 * Validate file type
 */
const validateFileType = (file: File, allowedTypes: string[]): void => {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`)
  }
}

/**
 * Validate file size
 */
const validateFileSize = (file: File, maxSizeInMB: number): void => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    throw new Error(`File size exceeds ${maxSizeInMB}MB limit`)
  }
}

// ========== PROPERTY PHOTO OPERATIONS ==========

/**
 * Upload property photo
 */
export const uploadPropertyPhoto = async (
  propertyId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<FileUploadResult> => {
  try {
    const userId = getCurrentUserId()
    
    // Validate file
    validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])
    validateFileSize(file, 10) // 10MB limit
    
    // Generate file path
    const fileName = generateFileName(file.name)
    const filePath = `${STORAGE_PATHS.PROPERTY_PHOTOS}/${userId}/${propertyId}/${fileName}`
    const storageRef = ref(storage, filePath)
    
    // Upload file
    let downloadURL: string
    
    if (onProgress) {
      // Use resumable upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file)
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            onProgress(progress)
          },
          (error) => {
            reject(new Error(`Upload failed: ${error.message}`))
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref)
              const metadata = await getMetadata(uploadTask.snapshot.ref)
              
              resolve({
                url,
                path: filePath,
                fileName,
                size: metadata.size,
                contentType: metadata.contentType || '',
                uploadedAt: new Date(metadata.timeCreated)
              })
            } catch (error) {
              reject(new Error(`Failed to get download URL: ${error}`))
            }
          }
        )
      })
    } else {
      // Simple upload without progress tracking
      const snapshot = await uploadBytes(storageRef, file)
      downloadURL = await getDownloadURL(snapshot.ref)
      const metadata = await getMetadata(snapshot.ref)
      
      return {
        url: downloadURL,
        path: filePath,
        fileName,
        size: metadata.size,
        contentType: metadata.contentType || '',
        uploadedAt: new Date(metadata.timeCreated)
      }
    }
  } catch (error) {
    throw new Error(`Failed to upload property photo: ${error}`)
  }
}

/**
 * Upload multiple property photos
 */
export const uploadPropertyPhotos = async (
  propertyId: string,
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<FileUploadResult[]> => {
  try {
    const results: FileUploadResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const progressCallback = onProgress ? (progress: number) => onProgress(i, progress) : undefined
      
      const result = await uploadPropertyPhoto(propertyId, file, progressCallback)
      results.push(result)
    }
    
    return results
  } catch (error) {
    throw new Error(`Failed to upload property photos: ${error}`)
  }
}

/**
 * Get all property photos
 */
export const getPropertyPhotos = async (propertyId: string): Promise<FileUploadResult[]> => {
  try {
    const userId = getCurrentUserId()
    const folderPath = `${STORAGE_PATHS.PROPERTY_PHOTOS}/${userId}/${propertyId}`
    const folderRef = ref(storage, folderPath)
    
    const listResult = await listAll(folderRef)
    const photos: FileUploadResult[] = []
    
    for (const itemRef of listResult.items) {
      const [url, metadata] = await Promise.all([
        getDownloadURL(itemRef),
        getMetadata(itemRef)
      ])
      
      photos.push({
        url,
        path: itemRef.fullPath,
        fileName: itemRef.name,
        size: metadata.size,
        contentType: metadata.contentType || '',
        uploadedAt: new Date(metadata.timeCreated)
      })
    }
    
    return photos.sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
  } catch (error) {
    throw new Error(`Failed to get property photos: ${error}`)
  }
}

/**
 * Delete property photo
 */
export const deletePropertyPhoto = async (filePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath)
    await deleteObject(fileRef)
  } catch (error) {
    throw new Error(`Failed to delete property photo: ${error}`)
  }
}

// ========== REPAIR PHOTO OPERATIONS ==========

/**
 * Upload repair photo
 */
export const uploadRepairPhoto = async (
  propertyId: string,
  repairEstimateId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<FileUploadResult> => {
  try {
    const userId = getCurrentUserId()
    
    // Validate file
    validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])
    validateFileSize(file, 10) // 10MB limit
    
    // Generate file path
    const fileName = generateFileName(file.name)
    const filePath = `${STORAGE_PATHS.REPAIR_PHOTOS}/${userId}/${propertyId}/${repairEstimateId}/${fileName}`
    const storageRef = ref(storage, filePath)
    
    // Upload file
    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file)
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            onProgress(progress)
          },
          (error) => {
            reject(new Error(`Upload failed: ${error.message}`))
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref)
              const metadata = await getMetadata(uploadTask.snapshot.ref)
              
              resolve({
                url,
                path: filePath,
                fileName,
                size: metadata.size,
                contentType: metadata.contentType || '',
                uploadedAt: new Date(metadata.timeCreated)
              })
            } catch (error) {
              reject(new Error(`Failed to get download URL: ${error}`))
            }
          }
        )
      })
    } else {
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      const metadata = await getMetadata(snapshot.ref)
      
      return {
        url: downloadURL,
        path: filePath,
        fileName,
        size: metadata.size,
        contentType: metadata.contentType || '',
        uploadedAt: new Date(metadata.timeCreated)
      }
    }
  } catch (error) {
    throw new Error(`Failed to upload repair photo: ${error}`)
  }
}

// ========== USER AVATAR OPERATIONS ==========

/**
 * Upload user avatar
 */
export const uploadUserAvatar = async (
  file: File,
  onProgress?: UploadProgressCallback
): Promise<FileUploadResult> => {
  try {
    const userId = getCurrentUserId()
    
    // Validate file
    validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])
    validateFileSize(file, 5) // 5MB limit for avatars
    
    // Generate file path
    const fileName = `avatar_${Date.now()}.${file.name.split('.').pop()}`
    const filePath = `${STORAGE_PATHS.USER_AVATARS}/${userId}/${fileName}`
    const storageRef = ref(storage, filePath)
    
    // Upload file
    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file)
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            onProgress(progress)
          },
          (error) => {
            reject(new Error(`Upload failed: ${error.message}`))
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref)
              const metadata = await getMetadata(uploadTask.snapshot.ref)
              
              resolve({
                url,
                path: filePath,
                fileName,
                size: metadata.size,
                contentType: metadata.contentType || '',
                uploadedAt: new Date(metadata.timeCreated)
              })
            } catch (error) {
              reject(new Error(`Failed to get download URL: ${error}`))
            }
          }
        )
      })
    } else {
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      const metadata = await getMetadata(snapshot.ref)
      
      return {
        url: downloadURL,
        path: filePath,
        fileName,
        size: metadata.size,
        contentType: metadata.contentType || '',
        uploadedAt: new Date(metadata.timeCreated)
      }
    }
  } catch (error) {
    throw new Error(`Failed to upload user avatar: ${error}`)
  }
}

/**
 * Delete file by path
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath)
    await deleteObject(fileRef)
  } catch (error) {
    throw new Error(`Failed to delete file: ${error}`)
  }
} 