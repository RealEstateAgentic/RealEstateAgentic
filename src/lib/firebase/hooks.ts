/**
 * Firebase React Hooks
 * Custom hooks for Firebase authentication and data management
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  AuthUser, 
  onAuthStateChange, 
  signInUser, 
  signOutUser, 
  registerUser,
  Property,
  getUserProperties,
  RepairEstimate,
  getPropertyRepairEstimates,
  handleFirebaseError
} from './index'

/**
 * Hook for managing authentication state
 */
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      const user = await signInUser(email, password)
      setUser(user)
      return user
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      await signOutUser()
      setUser(null)
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      setError(null)
      setLoading(true)
      const user = await registerUser(email, password, displayName)
      setUser(user)
      return user
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    register,
    isAuthenticated: !!user
  }
}

/**
 * Hook for managing user properties
 */
export const useUserProperties = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProperties = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const userProperties = await getUserProperties()
      setProperties(userProperties)
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  const refreshProperties = useCallback(() => {
    loadProperties()
  }, [loadProperties])

  return {
    properties,
    loading,
    error,
    refreshProperties
  }
}

/**
 * Hook for managing property repair estimates
 */
export const usePropertyRepairEstimates = (propertyId: string) => {
  const [estimates, setEstimates] = useState<RepairEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEstimates = useCallback(async () => {
    if (!propertyId) return
    
    try {
      setError(null)
      setLoading(true)
      const propertyEstimates = await getPropertyRepairEstimates(propertyId)
      setEstimates(propertyEstimates)
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    loadEstimates()
  }, [loadEstimates])

  const refreshEstimates = useCallback(() => {
    loadEstimates()
  }, [loadEstimates])

  return {
    estimates,
    loading,
    error,
    refreshEstimates
  }
}

/**
 * Hook for managing loading states across multiple operations
 */
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeAsync = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    try {
      setError(null)
      setLoading(true)
      const result = await operation()
      return result
    } catch (error) {
      const errorMessage = handleFirebaseError(error)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    executeAsync,
    clearError
  }
}

/**
 * Hook for managing form state with validation
 */
export const useFormState = <T extends Record<string, any>>(initialState: T) => {
  const [values, setValues] = useState<T>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const markFieldTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialState)
    setErrors({})
    setTouched({})
  }, [initialState])

  const isValid = Object.keys(errors).length === 0
  const isDirty = Object.keys(touched).length > 0

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    markFieldTouched,
    reset,
    isValid,
    isDirty
  }
} 