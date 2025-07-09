/**
 * Firebase Integration Tools for LangChain
 *
 * LangChain tool implementations that wrap Firebase operations for use in workflows
 */

import { z } from 'zod'
import { Tool } from '@langchain/core/tools'
import type { ToolExecutionContext, ToolExecutionResult } from '../types'

// Firebase collection imports
import {
  createOffer,
  getOffer,
  updateOffer,
  deleteOffer,
  getAgentOffers,
  getClientOffers,
  getPropertyOffers,
  createOfferComparison,
  createCounterOffer,
  createOfferDocument,
  getOfferDocuments,
  updateOfferStatus,
} from '../../firebase/collections/offers'

import {
  createNegotiation,
  getNegotiation,
  updateNegotiation,
  getNegotiationHistory,
  addNegotiationMessage,
  updateNegotiationStatus,
  createNegotiationStrategy,
  getNegotiationStrategies,
} from '../../firebase/collections/negotiations'

import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentsByType,
  getDocumentsByClient,
  updateDocumentStatus,
  createDocumentVersion,
} from '../../firebase/collections/documents'

import {
  getMarketData,
  updateMarketData,
  getComparableProperties,
  createMarketAnalysis,
  getMarketAnalyses,
  updateMarketTrends,
} from '../../firebase/collections/market-data'

// ========== OFFER TOOLS ==========

/**
 * Create Offer Tool
 */
export class CreateOfferTool extends Tool {
  name = 'create_offer'
  description = 'Create a new offer with property and client information'

  schema = z.object({
    agentId: z.string().describe('Agent ID creating the offer'),
    clientId: z.string().describe('Client ID the offer is for'),
    propertyId: z.string().describe('Property ID for the offer'),
    purchasePrice: z.number().describe('Purchase price for the offer'),
    earnestMoney: z.number().describe('Earnest money amount'),
    downPayment: z.number().describe('Down payment amount'),
    loanType: z
      .string()
      .describe('Type of loan (cash, conventional, FHA, etc.)'),
    closingDate: z.string().describe('Proposed closing date'),
    contingencies: z
      .object({
        inspection: z.boolean().describe('Inspection contingency'),
        financing: z.boolean().describe('Financing contingency'),
        appraisal: z.boolean().describe('Appraisal contingency'),
        sale: z.boolean().describe('Sale of current home contingency'),
      })
      .describe('Offer contingencies'),
    personalMessage: z
      .string()
      .optional()
      .describe('Personal message to seller'),
    additionalTerms: z
      .string()
      .optional()
      .describe('Additional terms and conditions'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await createOffer({
        offerData: input,
      })

      if (result.success) {
        return JSON.stringify({
          success: true,
          offerId: result.data?.id,
          message: 'Offer created successfully',
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Get Offer Tool
 */
export class GetOfferTool extends Tool {
  name = 'get_offer'
  description = 'Retrieve an offer by ID'

  schema = z.object({
    offerId: z.string().describe('ID of the offer to retrieve'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await getOffer(input.offerId)

      if (result.success) {
        return JSON.stringify({
          success: true,
          offer: result.data,
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Update Offer Tool
 */
export class UpdateOfferTool extends Tool {
  name = 'update_offer'
  description = 'Update an existing offer with new information'

  schema = z.object({
    offerId: z.string().describe('ID of the offer to update'),
    updates: z
      .object({
        purchasePrice: z.number().optional().describe('Updated purchase price'),
        earnestMoney: z.number().optional().describe('Updated earnest money'),
        downPayment: z.number().optional().describe('Updated down payment'),
        loanType: z.string().optional().describe('Updated loan type'),
        closingDate: z.string().optional().describe('Updated closing date'),
        contingencies: z
          .object({
            inspection: z.boolean().optional(),
            financing: z.boolean().optional(),
            appraisal: z.boolean().optional(),
            sale: z.boolean().optional(),
          })
          .optional()
          .describe('Updated contingencies'),
        personalMessage: z
          .string()
          .optional()
          .describe('Updated personal message'),
        additionalTerms: z
          .string()
          .optional()
          .describe('Updated additional terms'),
      })
      .describe('Fields to update'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await updateOffer(input)

      if (result.success) {
        return JSON.stringify({
          success: true,
          offer: result.data,
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Get Agent Offers Tool
 */
export class GetAgentOffersTool extends Tool {
  name = 'get_agent_offers'
  description = 'Get all offers for a specific agent'

  schema = z.object({
    agentId: z.string().describe('Agent ID to get offers for'),
    status: z.string().optional().describe('Filter by offer status'),
    limit: z.number().optional().describe('Limit number of results'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await getAgentOffers(input.agentId, {
        status: input.status,
        limit: input.limit,
      })

      if (result.success) {
        return JSON.stringify({
          success: true,
          offers: result.data,
          count: result.data?.length || 0,
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Create Offer Comparison Tool
 */
export class CreateOfferComparisonTool extends Tool {
  name = 'create_offer_comparison'
  description = 'Create an analysis comparing multiple offers'

  schema = z.object({
    propertyId: z.string().describe('Property ID for the offers'),
    offers: z.array(z.string()).describe('Array of offer IDs to compare'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await createOfferComparison(input)

      if (result.success) {
        return JSON.stringify({
          success: true,
          comparison: result.data,
          message: 'Offer comparison created successfully',
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

// ========== NEGOTIATION TOOLS ==========

/**
 * Create Negotiation Tool
 */
export class CreateNegotiationTool extends Tool {
  name = 'create_negotiation'
  description = 'Create a new negotiation workflow'

  schema = z.object({
    offerId: z.string().describe('Offer ID this negotiation is for'),
    agentId: z.string().describe('Agent ID managing the negotiation'),
    clientId: z.string().describe('Client ID involved in the negotiation'),
    scenario: z
      .enum([
        'initial_offer',
        'counter_offer',
        'multiple_offers',
        'deadline_pressure',
        'appraisal_gap',
        'inspection_negotiations',
        'financing_contingency',
        'final_push',
      ])
      .describe('Negotiation scenario type'),
    strategy: z.string().describe('Initial negotiation strategy'),
    objectives: z.array(z.string()).describe('Negotiation objectives'),
    constraints: z.array(z.string()).describe('Negotiation constraints'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await createNegotiation(input)

      if (result.success) {
        return JSON.stringify({
          success: true,
          negotiationId: result.data?.id,
          message: 'Negotiation created successfully',
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Get Negotiation Tool
 */
export class GetNegotiationTool extends Tool {
  name = 'get_negotiation'
  description = 'Retrieve a negotiation by ID'

  schema = z.object({
    negotiationId: z.string().describe('ID of the negotiation to retrieve'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await getNegotiation(input.negotiationId)

      if (result.success) {
        return JSON.stringify({
          success: true,
          negotiation: result.data,
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Add Negotiation Message Tool
 */
export class AddNegotiationMessageTool extends Tool {
  name = 'add_negotiation_message'
  description = 'Add a message to a negotiation history'

  schema = z.object({
    negotiationId: z.string().describe('ID of the negotiation'),
    message: z.string().describe('Message content'),
    sender: z
      .enum(['agent', 'client', 'other_party'])
      .describe('Message sender'),
    messageType: z
      .enum(['strategy', 'communication', 'update', 'decision'])
      .describe('Type of message'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await addNegotiationMessage(input.negotiationId, {
        message: input.message,
        sender: input.sender,
        messageType: input.messageType,
        timestamp: new Date().toISOString(),
      })

      if (result.success) {
        return JSON.stringify({
          success: true,
          message: 'Negotiation message added successfully',
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

// ========== DOCUMENT TOOLS ==========

/**
 * Create Document Tool
 */
export class CreateDocumentTool extends Tool {
  name = 'create_document'
  description = 'Create a new document'

  schema = z.object({
    type: z
      .enum([
        'cover_letter',
        'explanation_memo',
        'offer_analysis',
        'negotiation_strategy',
        'market_analysis',
      ])
      .describe('Document type'),
    title: z.string().describe('Document title'),
    content: z.string().describe('Document content'),
    agentId: z.string().describe('Agent ID creating the document'),
    clientId: z.string().describe('Client ID the document is for'),
    propertyId: z.string().optional().describe('Property ID if applicable'),
    offerId: z.string().optional().describe('Offer ID if applicable'),
    metadata: z.record(z.any()).optional().describe('Additional metadata'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await createDocument(input)

      if (result.success) {
        return JSON.stringify({
          success: true,
          documentId: result.data?.id,
          message: 'Document created successfully',
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Get Document Tool
 */
export class GetDocumentTool extends Tool {
  name = 'get_document'
  description = 'Retrieve a document by ID'

  schema = z.object({
    documentId: z.string().describe('ID of the document to retrieve'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await getDocument(input.documentId)

      if (result.success) {
        return JSON.stringify({
          success: true,
          document: result.data,
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Get Documents By Type Tool
 */
export class GetDocumentsByTypeTool extends Tool {
  name = 'get_documents_by_type'
  description = 'Get documents by type for a specific agent'

  schema = z.object({
    agentId: z.string().describe('Agent ID to get documents for'),
    type: z
      .enum([
        'cover_letter',
        'explanation_memo',
        'offer_analysis',
        'negotiation_strategy',
        'market_analysis',
      ])
      .describe('Document type to filter by'),
    limit: z.number().optional().describe('Limit number of results'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await getDocumentsByType(
        input.agentId,
        input.type,
        input.limit
      )

      if (result.success) {
        return JSON.stringify({
          success: true,
          documents: result.data,
          count: result.data?.length || 0,
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

// ========== MARKET DATA TOOLS ==========

/**
 * Get Market Data Tool
 */
export class GetMarketDataTool extends Tool {
  name = 'get_market_data'
  description = 'Retrieve market data for a specific location'

  schema = z.object({
    location: z
      .object({
        city: z.string().describe('City name'),
        state: z.string().describe('State abbreviation'),
        zipCode: z.string().optional().describe('ZIP code'),
        neighborhood: z.string().optional().describe('Neighborhood name'),
      })
      .describe('Location to get market data for'),
    propertyType: z.string().optional().describe('Property type filter'),
    timeframe: z
      .enum(['current', 'past_month', 'past_quarter', 'past_year'])
      .describe('Time frame for data'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await getMarketData({
        location: input.location,
        propertyType: input.propertyType,
        timeframe: input.timeframe,
      })

      if (result.success) {
        return JSON.stringify({
          success: true,
          marketData: result.data,
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Get Comparable Properties Tool
 */
export class GetComparablePropertiesTool extends Tool {
  name = 'get_comparable_properties'
  description = 'Get comparable properties for analysis'

  schema = z.object({
    propertyId: z.string().describe('Reference property ID'),
    radius: z.number().describe('Search radius in miles'),
    maxResults: z.number().describe('Maximum number of results'),
    criteria: z
      .object({
        priceRange: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
          })
          .optional(),
        bedroomRange: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
          })
          .optional(),
        bathroomRange: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
          })
          .optional(),
        squareFootageRange: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
          })
          .optional(),
        propertyType: z.string().optional(),
      })
      .optional()
      .describe('Search criteria'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await getComparableProperties(input)

      if (result.success) {
        return JSON.stringify({
          success: true,
          comparables: result.data,
          count: result.data?.length || 0,
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

/**
 * Create Market Analysis Tool
 */
export class CreateMarketAnalysisTool extends Tool {
  name = 'create_market_analysis'
  description = 'Create a comprehensive market analysis'

  schema = z.object({
    location: z
      .object({
        city: z.string().describe('City name'),
        state: z.string().describe('State abbreviation'),
        zipCode: z.string().optional().describe('ZIP code'),
        neighborhood: z.string().optional().describe('Neighborhood name'),
      })
      .describe('Location for analysis'),
    analysisType: z
      .enum([
        'price_trends',
        'inventory_analysis',
        'competition_assessment',
        'seasonal_patterns',
        'investment_potential',
      ])
      .describe('Type of analysis'),
    timeframe: z
      .enum(['current', 'past_month', 'past_quarter', 'past_year', 'forecast'])
      .describe('Analysis timeframe'),
    agentId: z.string().describe('Agent ID requesting the analysis'),
    clientId: z.string().optional().describe('Client ID if applicable'),
  })

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const result = await createMarketAnalysis(input)

      if (result.success) {
        return JSON.stringify({
          success: true,
          analysisId: result.data?.id,
          analysis: result.data,
          message: 'Market analysis created successfully',
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
        })
      }
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
      })
    }
  }
}

// ========== TOOL REGISTRY ==========

/**
 * Firebase Tools Registry
 * Centralized registry of all Firebase integration tools
 */
export const firebaseTools = {
  // Offer tools
  createOffer: new CreateOfferTool(),
  getOffer: new GetOfferTool(),
  updateOffer: new UpdateOfferTool(),
  getAgentOffers: new GetAgentOffersTool(),
  createOfferComparison: new CreateOfferComparisonTool(),

  // Negotiation tools
  createNegotiation: new CreateNegotiationTool(),
  getNegotiation: new GetNegotiationTool(),
  addNegotiationMessage: new AddNegotiationMessageTool(),

  // Document tools
  createDocument: new CreateDocumentTool(),
  getDocument: new GetDocumentTool(),
  getDocumentsByType: new GetDocumentsByTypeTool(),

  // Market data tools
  getMarketData: new GetMarketDataTool(),
  getComparableProperties: new GetComparablePropertiesTool(),
  createMarketAnalysis: new CreateMarketAnalysisTool(),
}

/**
 * Get all Firebase tools as an array
 */
export const getAllFirebaseTools = (): Tool[] => {
  return Object.values(firebaseTools)
}

/**
 * Get Firebase tools by category
 */
export const getFirebaseToolsByCategory = (
  category: 'offers' | 'negotiations' | 'documents' | 'market'
) => {
  switch (category) {
    case 'offers':
      return [
        firebaseTools.createOffer,
        firebaseTools.getOffer,
        firebaseTools.updateOffer,
        firebaseTools.getAgentOffers,
        firebaseTools.createOfferComparison,
      ]
    case 'negotiations':
      return [
        firebaseTools.createNegotiation,
        firebaseTools.getNegotiation,
        firebaseTools.addNegotiationMessage,
      ]
    case 'documents':
      return [
        firebaseTools.createDocument,
        firebaseTools.getDocument,
        firebaseTools.getDocumentsByType,
      ]
    case 'market':
      return [
        firebaseTools.getMarketData,
        firebaseTools.getComparableProperties,
        firebaseTools.createMarketAnalysis,
      ]
    default:
      return []
  }
}

/**
 * Firebase tool execution context helper
 */
export const createFirebaseToolContext = (
  toolName: string,
  parameters: Record<string, any>,
  workflowId: string,
  userId?: string,
  sessionId?: string
): ToolExecutionContext => {
  return {
    toolName,
    parameters,
    workflowId,
    userId,
    sessionId,
  }
}

/**
 * Firebase tool execution result helper
 */
export const createFirebaseToolResult = (
  toolName: string,
  success: boolean,
  result: any,
  error?: string,
  executionTime?: number
): ToolExecutionResult => {
  return {
    toolName,
    success,
    result,
    error,
    executionTime: executionTime || 0,
  }
}
