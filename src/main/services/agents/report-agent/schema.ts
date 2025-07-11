import { BaseMessage } from '@langchain/core/messages'
import { IpcMainInvokeEvent } from 'electron'

/**
 * The main state graph for the agent.
 */
export interface ReportAgentState {
  /**
   * The original PDF file as a buffer.
   */
  pdfBuffer: Buffer

  /**
   * The extracted text content from the PDF.
   */
  pdfText?: string

  /**
   * The address of the property, extracted from the report.
   */
  propertyAddress?: string

  /**
   * The date of the inspection, extracted from the report.
   */
  inspectionDate?: string

  /**
   * A list of all issues identified from the report.
   */
  identifiedIssues: Array<{
    issueId: string
    description: string
    context?: string
  }>

  /**
   * A map to store the detailed research findings for each issue.
   */
  issueResearch: {
    [issueId: string]: {
      summary: string
      estimatedCost: string
      confidence: 'High' | 'Medium' | 'Low'
      contractorType: string
      localContractors?: Array<{
        name: string
        phone?: string
        url?: string
      }>
      sources: string[]
    }
  }

  /**
   * The final compiled Markdown report.
   */
  finalReport?: string

  /**
   * A log of the agent's progress for real-time UI updates.
   */
  progressLog: string[]

  /**
   * The conversation history.
   * This is used to manage the flow of the agent.
   */
  messages: BaseMessage[]
  event?: IpcMainInvokeEvent
} 