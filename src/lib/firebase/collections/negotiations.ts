/**
 * Firebase Collections Service for Negotiations
 * Handles all CRUD operations for negotiation-related data in Firestore
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
  Negotiation,
  NegotiationStrategy,
  AppraisalScenario,
  NegotiationDocument,
  MarketAnalysis,
  RiskAssessment,
  CreateNegotiationRequest,
  UpdateNegotiationRequest,
  GenerateNegotiationStrategyRequest,
  CreateCounterStrategyRequest,
  AnalyzeAppraisalScenarioRequest,
  NegotiationResponse,
  NegotiationStrategyResponse,
  AppraisalScenarioResponse,
  NegotiationDocumentResponse,
} from '../../../shared/types/negotiations'
import { v4 as uuidv4 } from 'uuid'

// Collection names
const NEGOTIATIONS_COLLECTION = 'negotiations'
const NEGOTIATION_STRATEGIES_COLLECTION = 'negotiation_strategies'
const APPRAISAL_SCENARIOS_COLLECTION = 'appraisal_scenarios'
const NEGOTIATION_DOCUMENTS_COLLECTION = 'negotiation_documents'
const MARKET_ANALYSES_COLLECTION = 'market_analyses'
const RISK_ASSESSMENTS_COLLECTION = 'risk_assessments'

/**
 * Create a new negotiation
 */
export const createNegotiation = async (
  request: CreateNegotiationRequest
): Promise<NegotiationResponse> => {
  try {
    // Validate user permissions
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      throw new Error('Authentication required')
    }

    // Get offer to extract details
    const offerDoc = await getDoc(doc(db, 'offers', request.offerId))
    if (!offerDoc.exists()) {
      throw new Error('Offer not found')
    }

    const offerData = offerDoc.data()

    // Validate user has access to this offer
    await requireClientAccess(offerData.clientId)()

    // Generate negotiation ID
    const negotiationId = uuidv4()

    // Create negotiation document
    const now = new Date().toISOString()
    const negotiation: Negotiation = {
      id: negotiationId,
      agentId: offerData.agentId,
      clientId: offerData.clientId,
      offerId: request.offerId,
      propertyId: offerData.propertyId,
      type: request.type,
      status: 'active',

      // Create mock negotiation context
      originalOffer: {
        price: offerData.purchasePrice,
        terms: {
          earnestMoney: offerData.earnestMoney,
          downPayment: offerData.downPayment,
          loanType: offerData.loanType,
          closingDate: offerData.closingDate,
          inspectionDeadline: offerData.inspectionDeadline,
          appraisalDeadline: offerData.appraisalDeadline,
          contingencies: Object.entries(offerData.contingencies)
            .filter(([, value]) => value)
            .map(([key]) => key),
          repairRequests: offerData.repairRequests || [],
          specialConditions: offerData.specialConditions || [],
        },
        offerDate: offerData.offerDate,
        expirationDate: offerData.expirationDate,
        source: request.type === 'buyer_negotiation' ? 'buyer' : 'seller',
      },

      currentOffer: {
        price: offerData.purchasePrice,
        terms: {
          earnestMoney: offerData.earnestMoney,
          downPayment: offerData.downPayment,
          loanType: offerData.loanType,
          closingDate: offerData.closingDate,
          inspectionDeadline: offerData.inspectionDeadline,
          appraisalDeadline: offerData.appraisalDeadline,
          contingencies: Object.entries(offerData.contingencies)
            .filter(([, value]) => value)
            .map(([key]) => key),
          repairRequests: offerData.repairRequests || [],
          specialConditions: offerData.specialConditions || [],
        },
        offerDate: offerData.offerDate,
        expirationDate: offerData.expirationDate,
        source: request.type === 'buyer_negotiation' ? 'buyer' : 'seller',
      },

      counterHistory: [],

      // Create mock strategy
      strategy: {
        id: uuidv4(),
        negotiationId,
        type: 'price_negotiation',
        objectives: ['Achieve favorable pricing', 'Secure optimal terms'],
        priorities: [
          {
            item: 'Purchase Price',
            importance: 'high',
            flexibility: 'moderate',
            reasoning: 'Primary concern for client budget',
          },
        ],
        walkAwayConditions: ['Price above market value', 'Unacceptable terms'],
        recommendations: [],
        tactics: [],
        aiGeneratedStrategy:
          'AI-generated negotiation strategy based on market analysis',
        confidenceScore: 0.85,
        successCriteria: ['Successful price negotiation', 'Favorable terms'],
        riskMitigation: ['Market analysis review', 'Backup options'],
        createdAt: now,
        updatedAt: now,
      },

      // Create mock market analysis
      marketAnalysis: {
        id: uuidv4(),
        negotiationId,
        propertyValue: {
          estimatedValue: offerData.purchasePrice,
          valueRange: {
            low: offerData.purchasePrice * 0.95,
            high: offerData.purchasePrice * 1.05,
          },
          confidence: 0.8,
          methodology: ['CMA', 'Market trends'],
          factors: [],
          appraisalData: undefined,
        },
        marketConditions: {
          marketType: 'balanced_market',
          inventory: 'normal',
          demandLevel: 'moderate',
          priceDirection: 'stable',
          averageDaysOnMarket: 30,
          priceToListRatio: 0.98,
        },
        comparables: [],
        trends: [],
        competitiveAnalysis: {
          activeCompetitors: 3,
          priceComparison: { aboveMarket: 1, atMarket: 2, belowMarket: 0 },
          timeComparison: { faster: 1, similar: 2, slower: 0 },
          strengthAnalysis: ['Strong financing', 'Competitive pricing'],
          weaknessAnalysis: ['Limited timeline'],
        },
        priceJustification: {
          recommendedPrice: offerData.purchasePrice,
          justification: 'Price supported by market analysis',
          supportingData: [],
          priceStrategy: 'moderate',
          negotiationRoom: {
            minimum: offerData.purchasePrice * 0.95,
            maximum: offerData.purchasePrice * 1.05,
            optimal: offerData.purchasePrice,
          },
        },
        createdAt: now,
        updatedAt: now,
      },

      // Create mock risk assessment
      riskAssessment: {
        id: uuidv4(),
        negotiationId,
        overallRisk: 'medium',
        riskFactors: [
          {
            factor: 'Market volatility',
            riskLevel: 'medium',
            probability: 0.3,
            impact: 'Price fluctuation',
            description: 'Market conditions may affect pricing',
          },
        ],
        mitigationStrategies: [
          {
            risk: 'Market volatility',
            strategy: 'Monitor market trends',
            action: 'Regular market analysis',
            timeline: 'Weekly',
            responsible: 'Agent',
          },
        ],
        recommendations: ['Consider market timing', 'Review comparable sales'],
        createdAt: now,
        updatedAt: now,
      },

      // Timeline
      startDate: now,
      targetClosingDate: offerData.closingDate,
      lastActivity: now,
      deadlines: [
        {
          id: uuidv4(),
          name: 'Inspection Deadline',
          date: offerData.inspectionDeadline,
          type: 'inspection',
          status: 'pending',
          impact: 'high',
          description: 'Property inspection must be completed',
          actions: ['Schedule inspection', 'Review results'],
        },
        {
          id: uuidv4(),
          name: 'Appraisal Deadline',
          date: offerData.appraisalDeadline,
          type: 'appraisal',
          status: 'pending',
          impact: 'high',
          description: 'Property appraisal must be completed',
          actions: ['Order appraisal', 'Review results'],
        },
      ],

      // Metadata
      createdAt: now,
      updatedAt: now,
      version: 1,
    }

    // Save to Firestore
    await setDoc(doc(db, NEGOTIATIONS_COLLECTION, negotiationId), {
      ...negotiation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: negotiation,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get negotiation by ID
 */
export const getNegotiation = async (
  negotiationId: string
): Promise<NegotiationResponse> => {
  try {
    const negotiationDoc = await getDoc(
      doc(db, NEGOTIATIONS_COLLECTION, negotiationId)
    )

    if (!negotiationDoc.exists()) {
      return {
        success: false,
        error: 'Negotiation not found',
      }
    }

    const negotiationData = negotiationDoc.data()

    // Validate user has access to this negotiation
    await requireClientAccess(negotiationData.clientId)()

    const negotiation: Negotiation = {
      id: negotiationDoc.id,
      ...negotiationData,
      createdAt:
        negotiationData.createdAt?.toDate?.()?.toISOString() ||
        negotiationData.createdAt,
      updatedAt:
        negotiationData.updatedAt?.toDate?.()?.toISOString() ||
        negotiationData.updatedAt,
    }

    return {
      success: true,
      data: negotiation,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update an existing negotiation
 */
export const updateNegotiation = async (
  request: UpdateNegotiationRequest
): Promise<NegotiationResponse> => {
  try {
    const { negotiationId, updates } = request

    // Get current negotiation to validate permissions
    const currentNegotiation = await getNegotiation(negotiationId)
    if (!currentNegotiation.success || !currentNegotiation.data) {
      return currentNegotiation
    }

    // Validate user has access to this negotiation
    await requireClientAccess(currentNegotiation.data.clientId)()

    // Prepare updates
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      version: increment(1),
    }

    // Update in Firestore
    await updateDoc(doc(db, NEGOTIATIONS_COLLECTION, negotiationId), updateData)

    // Get updated negotiation
    const updatedNegotiation = await getNegotiation(negotiationId)

    return updatedNegotiation
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete a negotiation
 */
export const deleteNegotiation = async (
  negotiationId: string
): Promise<NegotiationResponse> => {
  try {
    // Get current negotiation to validate permissions
    const currentNegotiation = await getNegotiation(negotiationId)
    if (!currentNegotiation.success || !currentNegotiation.data) {
      return currentNegotiation
    }

    // Validate user has access to this negotiation
    await requireClientAccess(currentNegotiation.data.clientId)()

    // Delete from Firestore
    await deleteDoc(doc(db, NEGOTIATIONS_COLLECTION, negotiationId))

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
 * Get negotiations for a specific agent
 */
export const getAgentNegotiations = async (
  agentId: string,
  options?: {
    status?: string
    limit?: number
    startAfter?: string
  }
): Promise<{ success: boolean; data?: Negotiation[]; error?: string }> => {
  try {
    // Validate agent access
    const userProfile = await getCurrentUserProfile()
    if (!userProfile || userProfile.uid !== agentId) {
      throw new Error('Access denied')
    }

    // Build query
    let q = query(
      collection(db, NEGOTIATIONS_COLLECTION),
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
        doc(db, NEGOTIATIONS_COLLECTION, options.startAfter)
      )
      if (startDoc.exists()) {
        q = query(q, startAfter(startDoc))
      }
    }

    const querySnapshot = await getDocs(q)
    const negotiations: Negotiation[] = []

    for (const doc of querySnapshot.docs) {
      const negotiationData = doc.data()
      negotiations.push({
        id: doc.id,
        ...negotiationData,
        createdAt:
          negotiationData.createdAt?.toDate?.()?.toISOString() ||
          negotiationData.createdAt,
        updatedAt:
          negotiationData.updatedAt?.toDate?.()?.toISOString() ||
          negotiationData.updatedAt,
      } as Negotiation)
    }

    return {
      success: true,
      data: negotiations,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get negotiations for a specific client
 */
export const getClientNegotiations = async (
  clientId: string,
  options?: {
    status?: string
    limit?: number
  }
): Promise<{ success: boolean; data?: Negotiation[]; error?: string }> => {
  try {
    // Validate client access
    await requireClientAccess(clientId)()

    // Build query
    let q = query(
      collection(db, NEGOTIATIONS_COLLECTION),
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
    const negotiations: Negotiation[] = []

    for (const doc of querySnapshot.docs) {
      const negotiationData = doc.data()
      negotiations.push({
        id: doc.id,
        ...negotiationData,
        createdAt:
          negotiationData.createdAt?.toDate?.()?.toISOString() ||
          negotiationData.createdAt,
        updatedAt:
          negotiationData.updatedAt?.toDate?.()?.toISOString() ||
          negotiationData.updatedAt,
      } as Negotiation)
    }

    return {
      success: true,
      data: negotiations,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generate negotiation strategy
 */
export const generateNegotiationStrategy = async (
  request: GenerateNegotiationStrategyRequest
): Promise<NegotiationStrategyResponse> => {
  try {
    // Get negotiation to validate permissions
    const negotiation = await getNegotiation(request.negotiationId)
    if (!negotiation.success || !negotiation.data) {
      return {
        success: false,
        error: 'Negotiation not found',
      }
    }

    // Validate user has access to this negotiation
    await requireClientAccess(negotiation.data.clientId)()

    // Generate strategy ID
    const strategyId = uuidv4()

    // Create negotiation strategy (mock implementation)
    const now = new Date().toISOString()
    const strategy: NegotiationStrategy = {
      id: strategyId,
      negotiationId: request.negotiationId,
      type: 'price_negotiation',
      objectives: [
        'Achieve favorable pricing for client',
        'Secure optimal terms and conditions',
        'Minimize risk exposure',
      ],
      priorities: [
        {
          item: 'Purchase Price',
          importance: 'high',
          flexibility:
            request.parameters?.riskTolerance === 'high'
              ? 'flexible'
              : 'moderate',
          reasoning: 'Primary financial concern for client',
        },
        {
          item: 'Closing Timeline',
          importance: 'medium',
          flexibility:
            request.parameters?.timeframe === 'urgent' ? 'rigid' : 'flexible',
          reasoning: 'Client timeline preferences',
        },
      ],
      walkAwayConditions: [
        'Price exceeds budget by more than 5%',
        'Unacceptable inspection findings',
        'Financing contingency issues',
      ],
      recommendations: [
        {
          id: uuidv4(),
          title: 'Price Negotiation Strategy',
          description: 'Leverage market analysis to justify pricing position',
          reasoning: 'Market data supports current pricing strategy',
          expectedOutcome: 'Favorable price adjustment',
          riskLevel: 'low',
          marketSupport: [],
          priority: 1,
        },
        {
          id: uuidv4(),
          title: 'Timeline Optimization',
          description: 'Negotiate flexible closing timeline',
          reasoning: 'Provides negotiation leverage',
          expectedOutcome: 'Mutually beneficial timeline',
          riskLevel: 'low',
          marketSupport: [],
          priority: 2,
        },
      ],
      tactics: [
        {
          id: uuidv4(),
          name: 'Market Data Presentation',
          description: 'Present comparable sales data to support position',
          when: 'During price negotiations',
          expectedResponse: 'Acknowledgment of market position',
          riskLevel: 'low',
          effectiveness: 0.8,
        },
        {
          id: uuidv4(),
          name: 'Flexible Terms Offer',
          description: 'Offer flexible terms in exchange for price concessions',
          when: 'When price negotiation stalls',
          expectedResponse: 'Consideration of alternative arrangements',
          riskLevel: 'medium',
          effectiveness: 0.7,
        },
      ],
      aiGeneratedStrategy: `AI-generated negotiation strategy for ${request.scenario}. Based on market analysis and client preferences, this strategy focuses on achieving optimal pricing while maintaining flexibility on terms. Risk tolerance: ${request.parameters?.riskTolerance || 'medium'}, Timeline: ${request.parameters?.timeframe || 'normal'}.`,
      confidenceScore: 0.85,
      successCriteria: [
        'Achieve target price within 3% of goal',
        'Secure favorable terms',
        'Maintain positive negotiation relationship',
      ],
      riskMitigation: [
        'Regular market analysis updates',
        'Backup property options',
        'Flexible negotiation timeline',
      ],
      createdAt: now,
      updatedAt: now,
    }

    // Save strategy to Firestore
    await setDoc(doc(db, NEGOTIATION_STRATEGIES_COLLECTION, strategyId), {
      ...strategy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: strategy,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create appraisal scenario analysis
 */
export const createAppraisalScenario = async (
  request: AnalyzeAppraisalScenarioRequest
): Promise<AppraisalScenarioResponse> => {
  try {
    // Get negotiation to validate permissions
    const negotiation = await getNegotiation(request.negotiationId)
    if (!negotiation.success || !negotiation.data) {
      return {
        success: false,
        error: 'Negotiation not found',
      }
    }

    // Validate user has access to this negotiation
    await requireClientAccess(negotiation.data.clientId)()

    // Generate scenario ID
    const scenarioId = uuidv4()

    // Determine scenario type
    const contractPrice = negotiation.data.currentOffer.price
    const gap = contractPrice - request.appraisedValue
    const gapPercentage = (gap / contractPrice) * 100

    let scenarioType: 'low_appraisal' | 'high_appraisal' | 'appraisal_at_value'
    if (request.appraisedValue < contractPrice * 0.98) {
      scenarioType = 'low_appraisal'
    } else if (request.appraisedValue > contractPrice * 1.02) {
      scenarioType = 'high_appraisal'
    } else {
      scenarioType = 'appraisal_at_value'
    }

    // Create appraisal scenario
    const now = new Date().toISOString()
    const scenario: AppraisalScenario = {
      id: scenarioId,
      negotiationId: request.negotiationId,
      propertyId: negotiation.data.propertyId,
      scenario: scenarioType,
      contractPrice,
      appraisedValue: request.appraisedValue,
      gap,
      gapPercentage,
      options: [
        {
          id: uuidv4(),
          name: 'Price Reduction',
          description: 'Negotiate price reduction to match appraisal value',
          pros: ['Maintains financing', 'Quick resolution'],
          cons: ['Client pays more', 'Seller may reject'],
          riskLevel: 'low',
          timeframe: '1-2 days',
          cost: gap,
          likelihood: 0.7,
          impact: 'Direct cost impact',
        },
        {
          id: uuidv4(),
          name: 'Split the Difference',
          description: 'Negotiate to split the appraisal gap',
          pros: ['Compromise solution', 'Maintains deal'],
          cons: ['Partial cost to client', 'May still face resistance'],
          riskLevel: 'medium',
          timeframe: '2-3 days',
          cost: gap / 2,
          likelihood: 0.6,
          impact: 'Moderate cost impact',
        },
        {
          id: uuidv4(),
          name: 'Appraisal Challenge',
          description: 'Challenge appraisal with additional comparables',
          pros: ['Potential to increase value', 'No immediate cost'],
          cons: ['Time delay', 'Uncertain outcome'],
          riskLevel: 'high',
          timeframe: '1-2 weeks',
          cost: 500, // Appraisal challenge fee
          likelihood: 0.3,
          impact: 'Time delay risk',
        },
      ],
      recommendedStrategy:
        scenarioType === 'low_appraisal'
          ? 'Negotiate split difference while preparing appraisal challenge as backup'
          : 'Proceed with current terms',
      marketSupport: [], // Mock market data would go here
      outcomeScenarios: [
        {
          scenario: 'Price reduction accepted',
          probability: 0.4,
          finalPrice: request.appraisedValue,
          timeDelay: 2,
          additionalCosts: 0,
          description: 'Seller accepts price reduction to appraisal value',
        },
        {
          scenario: 'Split difference accepted',
          probability: 0.3,
          finalPrice: request.appraisedValue + gap / 2,
          timeDelay: 3,
          additionalCosts: 0,
          description: 'Parties agree to split appraisal gap',
        },
        {
          scenario: 'Deal falls through',
          probability: 0.2,
          finalPrice: 0,
          timeDelay: 5,
          additionalCosts: 1000, // Lost costs
          description: 'Unable to reach agreement, deal cancelled',
        },
      ],
      createdAt: now,
      updatedAt: now,
    }

    // Save scenario to Firestore
    await setDoc(doc(db, APPRAISAL_SCENARIOS_COLLECTION, scenarioId), {
      ...scenario,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: scenario,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create negotiation document
 */
export const createNegotiationDocument = async (
  negotiationId: string,
  documentType:
    | 'strategy_memo'
    | 'counter_offer'
    | 'appraisal_response'
    | 'negotiation_summary',
  content: string
): Promise<NegotiationDocumentResponse> => {
  try {
    // Get negotiation to validate permissions
    const negotiation = await getNegotiation(negotiationId)
    if (!negotiation.success || !negotiation.data) {
      return {
        success: false,
        error: 'Negotiation not found',
      }
    }

    // Validate user has access to this negotiation
    await requireClientAccess(negotiation.data.clientId)()

    // Generate document ID
    const documentId = uuidv4()

    // Create negotiation document
    const now = new Date().toISOString()
    const document: NegotiationDocument = {
      id: documentId,
      negotiationId,
      agentId: negotiation.data.agentId,
      clientId: negotiation.data.clientId,
      type: documentType,
      title: `${documentType.replace('_', ' ')} for Property ${negotiation.data.propertyId}`,
      content,
      htmlContent: `<div>${content}</div>`,
      status: 'draft',
      context: {
        scenario: 'Standard negotiation',
        objective: 'Support negotiation process',
        audience: 'Client',
        tone: 'professional',
      },
      generatedBy: 'ai',
      aiModel: 'gpt-4',
      prompt: `Generate ${documentType} for negotiation ${negotiationId}`,
      wordCount: content.split(' ').length,
      readingTime: Math.ceil(content.split(' ').length / 200),
      createdAt: now,
      updatedAt: now,
      version: 1,
    }

    // Save document to Firestore
    await setDoc(doc(db, NEGOTIATION_DOCUMENTS_COLLECTION, documentId), {
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
 * Get negotiation documents
 */
export const getNegotiationDocuments = async (
  negotiationId: string
): Promise<{
  success: boolean
  data?: NegotiationDocument[]
  error?: string
}> => {
  try {
    // Get negotiation to validate permissions
    const negotiation = await getNegotiation(negotiationId)
    if (!negotiation.success || !negotiation.data) {
      return {
        success: false,
        error: 'Negotiation not found',
      }
    }

    // Validate user has access to this negotiation
    await requireClientAccess(negotiation.data.clientId)()

    // Query negotiation documents
    const q = query(
      collection(db, NEGOTIATION_DOCUMENTS_COLLECTION),
      where('negotiationId', '==', negotiationId),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const documents: NegotiationDocument[] = []

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
      } as NegotiationDocument)
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
 * Update negotiation status
 */
export const updateNegotiationStatus = async (
  negotiationId: string,
  status: Negotiation['status']
): Promise<NegotiationResponse> => {
  try {
    return await updateNegotiation({
      negotiationId,
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
 * Add counter offer to negotiation history
 */
export const addCounterToNegotiation = async (
  negotiationId: string,
  counterOffer: any
): Promise<NegotiationResponse> => {
  try {
    // Get current negotiation
    const negotiation = await getNegotiation(negotiationId)
    if (!negotiation.success || !negotiation.data) {
      return negotiation
    }

    // Add counter to history
    const updatedHistory = [...negotiation.data.counterHistory, counterOffer]

    return await updateNegotiation({
      negotiationId,
      updates: {
        counterHistory: updatedHistory,
        lastActivity: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Complete negotiation with final agreement
 */
export const completeNegotiation = async (
  negotiationId: string,
  finalAgreement: any
): Promise<NegotiationResponse> => {
  try {
    return await updateNegotiation({
      negotiationId,
      updates: {
        status: 'completed',
        finalAgreement,
        lastActivity: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
