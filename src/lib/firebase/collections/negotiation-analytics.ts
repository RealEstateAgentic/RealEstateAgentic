/**
 * Firebase collection for negotiation analytics data
 *
 * Handles storage, retrieval, and management of negotiation records and analytics
 * with proper user isolation and security controls.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import type {
  DocumentReference,
  Query,
  QuerySnapshot,
  DocumentSnapshot,
  FirestoreError,
} from 'firebase/firestore'
import { db } from '../config'
import type {
  NegotiationRecord,
  FirebaseNegotiationRecord,
  SuccessRateAnalytics,
  AnalyticsQuery,
  AnalyticsCache,
  FirebaseAnalyticsCache,
  AnalyticsResponse,
  NegotiationAnalyticsResponse,
  ValidationResult,
  DataQualityMetrics,
} from '../../../shared/types/analytics'

// ========== COLLECTION REFERENCES ==========

export const COLLECTIONS = {
  NEGOTIATION_RECORDS: 'negotiation_records',
  ANALYTICS_CACHE: 'analytics_cache',
  AGENT_ANALYTICS: 'agent_analytics',
  DATA_QUALITY: 'data_quality_metrics',
} as const

// Collection references
export const negotiationRecordsRef = collection(
  db,
  COLLECTIONS.NEGOTIATION_RECORDS
)
export const analyticsCacheRef = collection(db, COLLECTIONS.ANALYTICS_CACHE)
export const agentAnalyticsRef = collection(db, COLLECTIONS.AGENT_ANALYTICS)
export const dataQualityRef = collection(db, COLLECTIONS.DATA_QUALITY)

// ========== UTILITY FUNCTIONS ==========

/**
 * Convert JavaScript Date to Firebase Timestamp
 */
const toFirebaseTimestamp = (date: string | Date): Timestamp => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return Timestamp.fromDate(dateObj)
}

/**
 * Convert Firebase Timestamp to ISO string
 */
const fromFirebaseTimestamp = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString()
}

/**
 * Convert NegotiationRecord to Firebase format
 */
const toFirebaseRecord = (
  record: Omit<NegotiationRecord, 'id'>
): FirebaseNegotiationRecord => {
  return {
    ...record,
    _createdAt: toFirebaseTimestamp(record.createdAt),
    _updatedAt: toFirebaseTimestamp(record.updatedAt),
  }
}

/**
 * Convert Firebase record to NegotiationRecord
 */
const fromFirebaseRecord = (
  id: string,
  firebaseRecord: FirebaseNegotiationRecord
): NegotiationRecord => {
  const { _createdAt, _updatedAt, ...rest } = firebaseRecord
  return {
    id,
    ...rest,
    createdAt: fromFirebaseTimestamp(_createdAt),
    updatedAt: fromFirebaseTimestamp(_updatedAt),
  }
}

/**
 * Generate cache key for analytics data
 */
const generateCacheKey = (
  agentId: string,
  queryParams: AnalyticsQuery
): string => {
  const params = {
    agentId,
    dateRange: queryParams.dateRange,
    filters: queryParams.filters,
    groupBy: queryParams.groupBy,
    sortBy: queryParams.sortBy,
  }
  return `analytics_${agentId}_${btoa(JSON.stringify(params))}`
}

// ========== VALIDATION FUNCTIONS ==========

/**
 * Validate negotiation record data
 */
export const validateNegotiationRecord = (
  record: Partial<NegotiationRecord>
): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!record.agentId) errors.push('Agent ID is required')
  if (!record.clientId) errors.push('Client ID is required')
  if (!record.propertyId) errors.push('Property ID is required')
  if (!record.negotiationId) errors.push('Negotiation ID is required')

  // Strategy validation
  if (record.strategy) {
    if (typeof record.strategy.initialOfferPercentage !== 'number') {
      errors.push('Initial offer percentage must be a number')
    }
    if (
      record.strategy.initialOfferPercentage < 0 ||
      record.strategy.initialOfferPercentage > 200
    ) {
      warnings.push('Initial offer percentage seems unusual (outside 0-200%)')
    }
  }

  // Context validation
  if (record.context) {
    if (record.context.daysOnMarket < 0) {
      errors.push('Days on market cannot be negative')
    }
    if (record.context.competingOffers < 0) {
      errors.push('Competing offers cannot be negative')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ========== CRUD OPERATIONS ==========

/**
 * Create a new negotiation record
 */
export const createNegotiationRecord = async (
  record: Omit<NegotiationRecord, 'id'>
): Promise<AnalyticsResponse<NegotiationRecord>> => {
  try {
    // Validate record
    const validation = validateNegotiationRecord(record)
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      }
    }

    // Generate document ID
    const docRef = doc(negotiationRecordsRef)
    const recordWithId = { ...record, id: docRef.id }

    // Convert to Firebase format
    const firebaseRecord = toFirebaseRecord(record)

    // Save to Firestore
    await setDoc(docRef, firebaseRecord)

    // Invalidate cache for this agent
    await invalidateAnalyticsCache(record.agentId)

    return {
      success: true,
      data: recordWithId,
    }
  } catch (error) {
    console.error('Error creating negotiation record:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get a negotiation record by ID
 */
export const getNegotiationRecord = async (
  id: string,
  agentId: string
): Promise<AnalyticsResponse<NegotiationRecord>> => {
  try {
    const docRef = doc(negotiationRecordsRef, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Negotiation record not found',
      }
    }

    const firebaseRecord = docSnap.data() as FirebaseNegotiationRecord

    // Security check - ensure agent can only access their own records
    if (firebaseRecord.agentId !== agentId) {
      return {
        success: false,
        error: 'Unauthorized access to negotiation record',
      }
    }

    const record = fromFirebaseRecord(id, firebaseRecord)

    return {
      success: true,
      data: record,
    }
  } catch (error) {
    console.error('Error getting negotiation record:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update a negotiation record
 */
export const updateNegotiationRecord = async (
  id: string,
  updates: Partial<NegotiationRecord>,
  agentId: string
): Promise<AnalyticsResponse<NegotiationRecord>> => {
  try {
    // First verify the record exists and belongs to the agent
    const existingResult = await getNegotiationRecord(id, agentId)
    if (!existingResult.success || !existingResult.data) {
      return existingResult
    }

    // Validate updates
    const validation = validateNegotiationRecord({
      ...existingResult.data,
      ...updates,
    })
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      }
    }

    // Prepare update with timestamp
    const updateData = {
      ...updates,
      _updatedAt: Timestamp.now(),
    }

    // Update in Firestore
    const docRef = doc(negotiationRecordsRef, id)
    await updateDoc(docRef, updateData)

    // Invalidate cache for this agent
    await invalidateAnalyticsCache(agentId)

    // Return updated record
    const updatedRecord = {
      ...existingResult.data,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    return {
      success: true,
      data: updatedRecord,
    }
  } catch (error) {
    console.error('Error updating negotiation record:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a negotiation record
 */
export const deleteNegotiationRecord = async (
  id: string,
  agentId: string
): Promise<AnalyticsResponse<boolean>> => {
  try {
    // First verify the record exists and belongs to the agent
    const existingResult = await getNegotiationRecord(id, agentId)
    if (!existingResult.success) {
      return {
        success: false,
        error: existingResult.error,
      }
    }

    // Delete from Firestore
    const docRef = doc(negotiationRecordsRef, id)
    await deleteDoc(docRef)

    // Invalidate cache for this agent
    await invalidateAnalyticsCache(agentId)

    return {
      success: true,
      data: true,
    }
  } catch (error) {
    console.error('Error deleting negotiation record:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ========== QUERY OPERATIONS ==========

/**
 * Get negotiation records for an agent with filtering
 */
export const getNegotiationRecords = async (
  analyticsQuery: AnalyticsQuery
): Promise<AnalyticsResponse<NegotiationRecord[]>> => {
  try {
    let q: Query = query(
      negotiationRecordsRef,
      where('agentId', '==', analyticsQuery.agentId),
      orderBy('_createdAt', 'desc')
    )

    // Apply date range filter
    if (analyticsQuery.dateRange) {
      const startDate = toFirebaseTimestamp(analyticsQuery.dateRange.startDate)
      const endDate = toFirebaseTimestamp(analyticsQuery.dateRange.endDate)
      q = query(
        q,
        where('_createdAt', '>=', startDate),
        where('_createdAt', '<=', endDate)
      )
    }

    // Apply filters
    if (analyticsQuery.filters) {
      if (
        analyticsQuery.filters.propertyTypes &&
        analyticsQuery.filters.propertyTypes.length > 0
      ) {
        q = query(
          q,
          where(
            'context.propertyType',
            'in',
            analyticsQuery.filters.propertyTypes
          )
        )
      }
      if (
        analyticsQuery.filters.marketConditions &&
        analyticsQuery.filters.marketConditions.length > 0
      ) {
        q = query(
          q,
          where(
            'context.marketConditions',
            'in',
            analyticsQuery.filters.marketConditions
          )
        )
      }
      if (analyticsQuery.filters.successful !== undefined) {
        q = query(
          q,
          where('outcome.successful', '==', analyticsQuery.filters.successful)
        )
      }
    }

    // Apply limit
    if (analyticsQuery.limit) {
      q = query(q, limit(analyticsQuery.limit))
    }

    const querySnapshot = await getDocs(q)
    const records: NegotiationRecord[] = []

    querySnapshot.forEach(doc => {
      const firebaseRecord = doc.data() as FirebaseNegotiationRecord
      const record = fromFirebaseRecord(doc.id, firebaseRecord)
      records.push(record)
    })

    return {
      success: true,
      data: records,
      metadata: {
        totalRecords: querySnapshot.size,
        filteredRecords: records.length,
        calculationTime: 0,
        cacheStatus: 'miss',
      },
    }
  } catch (error) {
    console.error('Error getting negotiation records:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get negotiation records with pagination
 */
export const getNegotiationRecordsPaginated = async (
  analyticsQuery: AnalyticsQuery,
  pageSize: number = 50,
  lastDoc?: DocumentSnapshot
): Promise<
  AnalyticsResponse<{
    records: NegotiationRecord[]
    hasMore: boolean
    lastDoc?: DocumentSnapshot
  }>
> => {
  try {
    let q: Query = query(
      negotiationRecordsRef,
      where('agentId', '==', analyticsQuery.agentId),
      orderBy('_createdAt', 'desc'),
      limit(pageSize)
    )

    // Apply pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const querySnapshot = await getDocs(q)
    const records: NegotiationRecord[] = []

    querySnapshot.forEach(doc => {
      const firebaseRecord = doc.data() as FirebaseNegotiationRecord
      const record = fromFirebaseRecord(doc.id, firebaseRecord)
      records.push(record)
    })

    const hasMore = querySnapshot.size === pageSize
    const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1]

    return {
      success: true,
      data: {
        records,
        hasMore,
        lastDoc: lastDocument,
      },
      metadata: {
        totalRecords: querySnapshot.size,
        filteredRecords: records.length,
        calculationTime: 0,
        cacheStatus: 'miss',
      },
    }
  } catch (error) {
    console.error('Error getting paginated negotiation records:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ========== BATCH OPERATIONS ==========

/**
 * Batch create multiple negotiation records
 */
export const batchCreateNegotiationRecords = async (
  records: Omit<NegotiationRecord, 'id'>[]
): Promise<AnalyticsResponse<NegotiationRecord[]>> => {
  try {
    const batch = writeBatch(db)
    const createdRecords: NegotiationRecord[] = []

    // Validate all records first
    for (const record of records) {
      const validation = validateNegotiationRecord(record)
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed for record: ${validation.errors.join(', ')}`,
        }
      }
    }

    // Create batch operations
    for (const record of records) {
      const docRef = doc(negotiationRecordsRef)
      const firebaseRecord = toFirebaseRecord(record)
      batch.set(docRef, firebaseRecord)
      createdRecords.push({ ...record, id: docRef.id })
    }

    // Commit batch
    await batch.commit()

    // Invalidate cache for all affected agents
    const agentIds = [...new Set(records.map(r => r.agentId))]
    await Promise.all(
      agentIds.map(agentId => invalidateAnalyticsCache(agentId))
    )

    return {
      success: true,
      data: createdRecords,
    }
  } catch (error) {
    console.error('Error batch creating negotiation records:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ========== CACHE OPERATIONS ==========

/**
 * Get cached analytics data
 */
export const getCachedAnalytics = async (
  cacheKey: string,
  agentId: string
): Promise<AnalyticsResponse<any>> => {
  try {
    const docRef = doc(analyticsCacheRef, cacheKey)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Cache miss',
      }
    }

    const cacheData = docSnap.data() as FirebaseAnalyticsCache

    // Security check
    if (cacheData.agentId !== agentId) {
      return {
        success: false,
        error: 'Unauthorized cache access',
      }
    }

    // Check expiration
    const now = Timestamp.now()
    if (cacheData._expiresAt.toMillis() < now.toMillis()) {
      // Clean up expired cache
      await deleteDoc(docRef)
      return {
        success: false,
        error: 'Cache expired',
      }
    }

    return {
      success: true,
      data: cacheData.data,
      metadata: {
        totalRecords: 0,
        filteredRecords: 0,
        calculationTime: 0,
        cacheStatus: 'hit',
      },
    }
  } catch (error) {
    console.error('Error getting cached analytics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Set cached analytics data
 */
export const setCachedAnalytics = async (
  cacheKey: string,
  agentId: string,
  data: any,
  expirationMinutes: number = 60
): Promise<AnalyticsResponse<boolean>> => {
  try {
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + expirationMinutes * 60 * 1000
    )

    const cacheData: FirebaseAnalyticsCache = {
      key: cacheKey,
      agentId,
      data,
      _expiresAt: expiresAt,
      _generatedAt: now,
    }

    const docRef = doc(analyticsCacheRef, cacheKey)
    await setDoc(docRef, cacheData)

    return {
      success: true,
      data: true,
    }
  } catch (error) {
    console.error('Error setting cached analytics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Invalidate analytics cache for an agent
 */
export const invalidateAnalyticsCache = async (
  agentId: string
): Promise<void> => {
  try {
    const q = query(analyticsCacheRef, where('agentId', '==', agentId))
    const querySnapshot = await getDocs(q)

    const batch = writeBatch(db)
    querySnapshot.forEach(doc => {
      batch.delete(doc.ref)
    })

    await batch.commit()
  } catch (error) {
    console.error('Error invalidating analytics cache:', error)
    // Don't throw error - cache invalidation is not critical
  }
}

// ========== ANALYTICS STORAGE ==========

/**
 * Store calculated analytics for an agent
 */
export const storeAgentAnalytics = async (
  agentId: string,
  analytics: SuccessRateAnalytics
): Promise<AnalyticsResponse<boolean>> => {
  try {
    const docRef = doc(agentAnalyticsRef, agentId)
    const analyticsData = {
      ...analytics,
      _calculatedAt: Timestamp.now(),
    }

    await setDoc(docRef, analyticsData)

    return {
      success: true,
      data: true,
    }
  } catch (error) {
    console.error('Error storing agent analytics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get stored analytics for an agent
 */
export const getAgentAnalytics = async (
  agentId: string
): Promise<AnalyticsResponse<SuccessRateAnalytics>> => {
  try {
    const docRef = doc(agentAnalyticsRef, agentId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Agent analytics not found',
      }
    }

    const analyticsData = docSnap.data() as SuccessRateAnalytics & {
      _calculatedAt: Timestamp
    }
    const { _calculatedAt, ...analytics } = analyticsData

    return {
      success: true,
      data: analytics,
    }
  } catch (error) {
    console.error('Error getting agent analytics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ========== DATA QUALITY ==========

/**
 * Store data quality metrics for an agent
 */
export const storeDataQualityMetrics = async (
  agentId: string,
  metrics: DataQualityMetrics
): Promise<AnalyticsResponse<boolean>> => {
  try {
    const docRef = doc(dataQualityRef, agentId)
    const metricsData = {
      ...metrics,
      _lastUpdated: Timestamp.now(),
    }

    await setDoc(docRef, metricsData)

    return {
      success: true,
      data: true,
    }
  } catch (error) {
    console.error('Error storing data quality metrics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get data quality metrics for an agent
 */
export const getDataQualityMetrics = async (
  agentId: string
): Promise<AnalyticsResponse<DataQualityMetrics>> => {
  try {
    const docRef = doc(dataQualityRef, agentId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Data quality metrics not found',
      }
    }

    const metricsData = docSnap.data() as DataQualityMetrics & {
      _lastUpdated: Timestamp
    }
    const { _lastUpdated, ...metrics } = metricsData

    return {
      success: true,
      data: metrics,
    }
  } catch (error) {
    console.error('Error getting data quality metrics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ========== EXPORT FUNCTIONS ==========

export {
  generateCacheKey,
  toFirebaseRecord,
  fromFirebaseRecord,
  toFirebaseTimestamp,
  fromFirebaseTimestamp,
}
