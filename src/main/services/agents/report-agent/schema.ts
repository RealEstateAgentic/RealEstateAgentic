import { type BaseMessage } from '@langchain/core/messages'

/**
 * The main state graph for the agent.
 */
export interface ReportAgentState {
  /**
   * The original PDF file path for the inspection report.
   */
  pdfPath: string

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
    // Potentially add more structured fields here later
  }>

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
} 