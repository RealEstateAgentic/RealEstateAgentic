/**
 * Firebase Collections Service for Offers
 * Handles all CRUD operations for offer-related data in Firestore
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
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../config'
import { getCurrentUserProfile } from '../auth'
import {
  requireAgent,
  requireClient,
  requireClientAccess,
} from '../role-middleware'
import type {
  Offer,
  OfferComparison,
  CounterOffer,
  OfferDocument,
  OfferWorkflow,
  CreateOfferRequest,
  UpdateOfferRequest,
  GenerateOfferDocumentRequest,
  AnalyzeOffersRequest,
  CreateCounterOfferRequest,
  OfferResponse,
  OfferDocumentResponse,
  OfferAnalysisResponse,
  CounterOfferResponse,
} from '../../../shared/types/offers'
import { v4 as uuidv4 } from 'uuid'

// Collection names
const OFFERS_COLLECTION = 'offers'
const OFFER_COMPARISONS_COLLECTION = 'offer_comparisons'
const COUNTER_OFFERS_COLLECTION = 'counter_offers'
const OFFER_DOCUMENTS_COLLECTION = 'offer_documents'
const OFFER_WORKFLOWS_COLLECTION = 'offer_workflows'

/**
 * Create a new offer
 */
export const createOffer = async (
  request: CreateOfferRequest
): Promise<OfferResponse> => {
  try {
    // Validate user permissions
    const userProfile = await requireAgent()

    // Get client profile for additional validation
    const clientProfile = await requireClient()

    // Generate offer ID
    const offerId = uuidv4()

    // Create offer document
    const now = new Date().toISOString()
    const offer: Offer = {
      id: offerId,
      agentId: userProfile.uid,
      clientId: clientProfile.uid,
      ...request.offerData,
      status: 'draft',
      version: 1,
      createdAt: now,
      updatedAt: now,
    }

    // Save to Firestore
    await setDoc(doc(db, OFFERS_COLLECTION, offerId), {
      ...offer,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: offer,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get offer by ID
 */
export const getOffer = async (offerId: string): Promise<OfferResponse> => {
  try {
    const offerDoc = await getDoc(doc(db, OFFERS_COLLECTION, offerId))

    if (!offerDoc.exists()) {
      return {
        success: false,
        error: 'Offer not found',
      }
    }

    const offerData = offerDoc.data()

    // Validate user has access to this offer
    await requireClientAccess(offerData.clientId)()

    const offer: Offer = {
      id: offerDoc.id,
      ...offerData,
      createdAt:
        offerData.createdAt?.toDate?.()?.toISOString() || offerData.createdAt,
      updatedAt:
        offerData.updatedAt?.toDate?.()?.toISOString() || offerData.updatedAt,
    }

    return {
      success: true,
      data: offer,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update an existing offer
 */
export const updateOffer = async (
  request: UpdateOfferRequest
): Promise<OfferResponse> => {
  try {
    const { offerId, updates } = request

    // Get current offer to validate permissions
    const currentOffer = await getOffer(offerId)
    if (!currentOffer.success || !currentOffer.data) {
      return currentOffer
    }

    // Validate user has access to this offer
    await requireClientAccess(currentOffer.data.clientId)()

    // Prepare updates
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      version: increment(1),
    }

    // Update in Firestore
    await updateDoc(doc(db, OFFERS_COLLECTION, offerId), updateData)

    // Get updated offer
    const updatedOffer = await getOffer(offerId)

    return updatedOffer
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete an offer
 */
export const deleteOffer = async (offerId: string): Promise<OfferResponse> => {
  try {
    // Get current offer to validate permissions
    const currentOffer = await getOffer(offerId)
    if (!currentOffer.success || !currentOffer.data) {
      return currentOffer
    }

    // Validate user has access to this offer
    await requireClientAccess(currentOffer.data.clientId)()

    // Delete from Firestore
    await deleteDoc(doc(db, OFFERS_COLLECTION, offerId))

    return {
      success: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get offers for a specific agent
 */
export const getAgentOffers = async (
  agentId: string,
  options?: {
    status?: string
    limit?: number
    startAfter?: string
  }
): Promise<{ success: boolean; data?: Offer[]; error?: string }> => {
  try {
    // Validate agent access
    const userProfile = await getCurrentUserProfile()
    if (!userProfile || userProfile.uid !== agentId) {
      throw new Error('Access denied')
    }

    // Build query
    let q = query(
      collection(db, OFFERS_COLLECTION),
      where('agentId', '==', agentId),
      orderBy('createdAt', 'desc')
    )

    if (options?.status) {
      q = query(q, where('status', '==', options.status))
    }

    if (options?.limit) {
      q = query(q, limit(options.limit))
    }

    if (options?.startAfter) {
      const startDoc = await getDoc(
        doc(db, OFFERS_COLLECTION, options.startAfter)
      )
      if (startDoc.exists()) {
        q = query(q, startAfter(startDoc))
      }
    }

    const querySnapshot = await getDocs(q)
    const offers: Offer[] = []

    for (const doc of querySnapshot.docs) {
      const offerData = doc.data()
      offers.push({
        id: doc.id,
        ...offerData,
        createdAt:
          offerData.createdAt?.toDate?.()?.toISOString() || offerData.createdAt,
        updatedAt:
          offerData.updatedAt?.toDate?.()?.toISOString() || offerData.updatedAt,
      } as Offer)
    }

    return {
      success: true,
      data: offers,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get offers for a specific client
 */
export const getClientOffers = async (
  clientId: string,
  options?: {
    status?: string
    limit?: number
  }
): Promise<{ success: boolean; data?: Offer[]; error?: string }> => {
  try {
    // Validate client access
    await requireClientAccess(clientId)()

    // Build query
    let q = query(
      collection(db, OFFERS_COLLECTION),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    )

    if (options?.status) {
      q = query(q, where('status', '==', options.status))
    }

    if (options?.limit) {
      q = query(q, limit(options.limit))
    }

    const querySnapshot = await getDocs(q)
    const offers: Offer[] = []

    for (const doc of querySnapshot.docs) {
      const offerData = doc.data()
      offers.push({
        id: doc.id,
        ...offerData,
        createdAt:
          offerData.createdAt?.toDate?.()?.toISOString() || offerData.createdAt,
        updatedAt:
          offerData.updatedAt?.toDate?.()?.toISOString() || offerData.updatedAt,
      } as Offer)
    }

    return {
      success: true,
      data: offers,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get offers for a specific property
 */
export const getPropertyOffers = async (
  propertyId: string,
  agentId: string
): Promise<{ success: boolean; data?: Offer[]; error?: string }> => {
  try {
    // Validate agent access
    const userProfile = await getCurrentUserProfile()
    if (!userProfile || userProfile.uid !== agentId) {
      throw new Error('Access denied')
    }

    // Query offers for this property
    const q = query(
      collection(db, OFFERS_COLLECTION),
      where('propertyId', '==', propertyId),
      where('agentId', '==', agentId),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const offers: Offer[] = []

    for (const doc of querySnapshot.docs) {
      const offerData = doc.data()
      offers.push({
        id: doc.id,
        ...offerData,
        createdAt:
          offerData.createdAt?.toDate?.()?.toISOString() || offerData.createdAt,
        updatedAt:
          offerData.updatedAt?.toDate?.()?.toISOString() || offerData.updatedAt,
      } as Offer)
    }

    return {
      success: true,
      data: offers,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create offer comparison
 */
export const createOfferComparison = async (
  request: AnalyzeOffersRequest
): Promise<OfferAnalysisResponse> => {
  try {
    // Validate agent access
    const userProfile = await requireAgent()

    // Get offers for analysis
    const offerPromises = request.offers.map(offerId => getOffer(offerId))
    const offerResults = await Promise.all(offerPromises)

    const offers = offerResults
      .filter(result => result.success && result.data)
      .map(result => result.data!)

    if (offers.length === 0) {
      return {
        success: false,
        error: 'No valid offers found for analysis',
      }
    }

    // Create comparison ID
    const comparisonId = uuidv4()

    // TODO: Implement actual analysis logic - for now using mock data
    const comparison: OfferComparison = {
      id: comparisonId,
      agentId: userProfile.uid,
      clientId: offers[0].clientId,
      propertyId: request.propertyId,
      offers: offers.map(offer => ({
        offerId: offer.id,
        buyerName: `Buyer ${offer.id.slice(-4)}`,
        purchasePrice: offer.purchasePrice,
        earnestMoney: offer.earnestMoney,
        downPayment: offer.downPayment,
        loanType: offer.loanType,
        contingencies: Object.entries(offer.contingencies)
          .filter(([, value]) => value)
          .map(([key]) => key),
        closingDate: offer.closingDate,
        strengths: ['Strong financing', 'Quick closing'],
        weaknesses: ['Low earnest money'],
        score: Math.random() * 100,
      })),
      analysis: {
        priceAnalysis: {
          highestOffer: Math.max(...offers.map(o => o.purchasePrice)),
          lowestOffer: Math.min(...offers.map(o => o.purchasePrice)),
          averageOffer:
            offers.reduce((sum, o) => sum + o.purchasePrice, 0) / offers.length,
          priceRange:
            Math.max(...offers.map(o => o.purchasePrice)) -
            Math.min(...offers.map(o => o.purchasePrice)),
          marketValueComparison: 1.05,
        },
        financialStrength: {
          strongOffers: offers.filter(o => o.loanType === 'cash').length,
          weakOffers: offers.filter(o => o.downPayment < 20000).length,
          cashOffers: offers.filter(o => o.loanType === 'cash').length,
          financedOffers: offers.filter(o => o.loanType !== 'cash').length,
        },
        timeline: {
          fastestClosing: offers.sort(
            (a, b) =>
              new Date(a.closingDate).getTime() -
              new Date(b.closingDate).getTime()
          )[0].closingDate,
          slowestClosing: offers.sort(
            (a, b) =>
              new Date(b.closingDate).getTime() -
              new Date(a.closingDate).getTime()
          )[0].closingDate,
          averageClosingDays: 30,
        },
        contingencyAnalysis: {
          noContingencies: offers.filter(
            o => !o.contingencies.inspection && !o.contingencies.financing
          ).length,
          inspectionOnly: offers.filter(
            o => o.contingencies.inspection && !o.contingencies.financing
          ).length,
          financingOnly: offers.filter(
            o => !o.contingencies.inspection && o.contingencies.financing
          ).length,
          multipleContingencies: offers.filter(
            o => o.contingencies.inspection && o.contingencies.financing
          ).length,
        },
      },
      recommendation:
        'Based on the analysis, Offer #1 provides the best overall value with strong financing and competitive terms.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save comparison to Firestore
    await setDoc(doc(db, OFFER_COMPARISONS_COLLECTION, comparisonId), {
      ...comparison,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: comparison,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create counter offer
 */
export const createCounterOffer = async (
  request: CreateCounterOfferRequest
): Promise<CounterOfferResponse> => {
  try {
    // Validate user permissions
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      throw new Error('Authentication required')
    }

    // Get original offer
    const originalOffer = await getOffer(request.originalOfferId)
    if (!originalOffer.success || !originalOffer.data) {
      return {
        success: false,
        error: 'Original offer not found',
      }
    }

    // Validate user has access to this offer
    await requireClientAccess(originalOffer.data.clientId)()

    // Create counter offer ID
    const counterOfferId = uuidv4()

    // Determine counter number
    const existingCounters = await getDocs(
      query(
        collection(db, COUNTER_OFFERS_COLLECTION),
        where('originalOfferId', '==', request.originalOfferId),
        orderBy('counterNumber', 'desc'),
        limit(1)
      )
    )

    const counterNumber = existingCounters.empty
      ? 1
      : existingCounters.docs[0].data().counterNumber + 1

    // Create counter offer
    const now = new Date().toISOString()
    const counterOffer: CounterOffer = {
      id: counterOfferId,
      originalOfferId: request.originalOfferId,
      agentId: originalOffer.data.agentId,
      clientId: originalOffer.data.clientId,
      counterNumber,
      type:
        originalOffer.data.type === 'buyer'
          ? 'seller_counter'
          : 'buyer_counter',
      purchasePrice: request.counterTerms.closingDate
        ? originalOffer.data.purchasePrice
        : originalOffer.data.purchasePrice,
      terms: request.counterTerms,
      strategy: request.strategy || 'Generated counter offer strategy',
      justification: 'Market analysis supports this counter offer position',
      dataBackup: [], // TODO: Add actual market data
      status: 'draft',
      expirationDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
      createdAt: now,
      updatedAt: now,
    }

    // Save to Firestore
    await setDoc(doc(db, COUNTER_OFFERS_COLLECTION, counterOfferId), {
      ...counterOffer,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: counterOffer,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get counter offers for an original offer
 */
export const getCounterOffers = async (
  originalOfferId: string
): Promise<{ success: boolean; data?: CounterOffer[]; error?: string }> => {
  try {
    // Get original offer to validate permissions
    const originalOffer = await getOffer(originalOfferId)
    if (!originalOffer.success || !originalOffer.data) {
      return {
        success: false,
        error: 'Original offer not found',
      }
    }

    // Validate user has access to this offer
    await requireClientAccess(originalOffer.data.clientId)()

    // Query counter offers
    const q = query(
      collection(db, COUNTER_OFFERS_COLLECTION),
      where('originalOfferId', '==', originalOfferId),
      orderBy('counterNumber', 'asc')
    )

    const querySnapshot = await getDocs(q)
    const counterOffers: CounterOffer[] = []

    for (const doc of querySnapshot.docs) {
      const counterOfferData = doc.data()
      counterOffers.push({
        id: doc.id,
        ...counterOfferData,
        createdAt:
          counterOfferData.createdAt?.toDate?.()?.toISOString() ||
          counterOfferData.createdAt,
        updatedAt:
          counterOfferData.updatedAt?.toDate?.()?.toISOString() ||
          counterOfferData.updatedAt,
      } as CounterOffer)
    }

    return {
      success: true,
      data: counterOffers,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create offer document
 */
export const createOfferDocument = async (
  request: GenerateOfferDocumentRequest
): Promise<OfferDocumentResponse> => {
  try {
    // Get offer to validate permissions
    const offer = await getOffer(request.offerId)
    if (!offer.success || !offer.data) {
      return {
        success: false,
        error: 'Offer not found',
      }
    }

    // Validate user has access to this offer
    await requireClientAccess(offer.data.clientId)()

    // Create document ID
    const documentId = uuidv4()

    // TODO: Implement actual document generation - for now using mock
    const document: OfferDocument = {
      id: documentId,
      offerId: request.offerId,
      agentId: offer.data.agentId,
      clientId: offer.data.clientId,
      type: request.documentType,
      title: `${request.documentType.replace('_', ' ')} for ${offer.data.propertyId}`,
      content: 'Generated document content will be here...',
      htmlContent: '<p>Generated document content will be here...</p>',
      status: 'draft',
      wordCount: 250,
      readingTime: 2,
      tone: request.parameters?.tone || 'professional',
      generatedBy: 'ai',
      aiModel: 'gpt-4',
      prompt: `Generate a ${request.documentType} for offer ${request.offerId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    }

    // Save to Firestore
    await setDoc(doc(db, OFFER_DOCUMENTS_COLLECTION, documentId), {
      ...document,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: document,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get offer documents
 */
export const getOfferDocuments = async (
  offerId: string
): Promise<{ success: boolean; data?: OfferDocument[]; error?: string }> => {
  try {
    // Get offer to validate permissions
    const offer = await getOffer(offerId)
    if (!offer.success || !offer.data) {
      return {
        success: false,
        error: 'Offer not found',
      }
    }

    // Validate user has access to this offer
    await requireClientAccess(offer.data.clientId)()

    // Query offer documents
    const q = query(
      collection(db, OFFER_DOCUMENTS_COLLECTION),
      where('offerId', '==', offerId),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const documents: OfferDocument[] = []

    for (const doc of querySnapshot.docs) {
      const documentData = doc.data()
      documents.push({
        id: doc.id,
        ...documentData,
        createdAt:
          documentData.createdAt?.toDate?.()?.toISOString() ||
          documentData.createdAt,
        updatedAt:
          documentData.updatedAt?.toDate?.()?.toISOString() ||
          documentData.updatedAt,
      } as OfferDocument)
    }

    return {
      success: true,
      data: documents,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update offer status
 */
export const updateOfferStatus = async (
  offerId: string,
  status: Offer['status']
): Promise<OfferResponse> => {
  try {
    return await updateOffer({
      offerId,
      updates: { status },
    })
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Archive old offers
 */
export const archiveOldOffers = async (
  agentId: string,
  olderThanDays: number = 90
): Promise<{ success: boolean; archived: number; error?: string }> => {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile || userProfile.uid !== agentId) {
      throw new Error('Access denied')
    }

    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    )

    const q = query(
      collection(db, OFFERS_COLLECTION),
      where('agentId', '==', agentId),
      where('status', 'in', ['rejected', 'expired']),
      where('updatedAt', '<', cutoffDate)
    )

    const querySnapshot = await getDocs(q)
    const batch = writeBatch(db)

    for (const doc of querySnapshot.docs) {
      batch.update(doc.ref, {
        status: 'archived',
        updatedAt: serverTimestamp(),
      })
    }

    await batch.commit()

    return {
      success: true,
      archived: querySnapshot.docs.length,
    }
  } catch (error: any) {
    return {
      success: false,
      archived: 0,
      error: error.message,
    }
  }
}
