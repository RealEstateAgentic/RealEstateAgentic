/**
 * Agentic Report Generation Graph
 *
 * This file defines the LangGraph graph for the agentic report generation process.
 * The agent takes a PDF file, extracts text, identifies issues, researches them,
 * and compiles a final Markdown report.
 */

import { END, START, StateGraph } from '@langchain/langgraph'
import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { type StateGraphArgs } from '@langchain/langgraph'
import pdfParse from 'pdf-parse'
import { promises as fs } from 'fs'
import { ipcMain, type IpcMainInvokeEvent } from 'electron'

import { getOpenAIClient, AI_MODELS } from '~/src/lib/openai/client'
import { type ReportAgentState } from './schema'
import { db } from '~/src/lib/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import { logger } from 'main/utils/logger'
import { DynamicTool } from '@langchain/core/tools'
import { BraveSearch } from '@langchain/community/tools/brave_search'

/**
 * Collection names
 */
const COLLECTIONS = {
  PROPERTIES: 'properties',
  REPAIR_ESTIMATES: 'repairEstimates',
  USERS: 'users',
  INSPECTION_REPORTS: 'inspectionReports',
} as const

// Helper function to create a node that updates progress
const createProgressNode =
  (message: string) => (state: ReportAgentState) => ({
    progressLog: [...state.progressLog, message],
  })

/**
 * Node: extract_text
 *
 * Extracts text content from the provided PDF buffer.
 */
async function extractTextFromPdf(
  state: ReportAgentState,
): Promise<Partial<ReportAgentState>> {
  const { pdfBuffer } = state
  try {
    if (!pdfBuffer) {
      throw new Error('No PDF buffer provided.')
    }
    const data = await pdfParse(pdfBuffer)
    return {
      pdfText: data.text,
      progressLog: [
        ...state.progressLog,
        'Successfully extracted text from PDF.',
      ],
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('PDF Parsing Error:', errorMessage)
    return {
      progressLog: [`Error parsing PDF: ${errorMessage}`],
    }
  }
}

/**
 * Node: parse_initial_report
 *
 * Uses an LLM to parse the raw text of the inspection report.
 * Extracts key metadata and a list of all identified issues.
 */
async function parseInitialReport(
  state: ReportAgentState,
): Promise<Partial<ReportAgentState>> {
  const { pdfText } = state
  const progressLog = [
    ...state.progressLog,
    'Analyzing report for key details and issues...',
  ]

  if (!pdfText) {
    return {
      progressLog: [
        ...progressLog,
        'Error: No text extracted from PDF to analyze.',
      ],
    }
  }

  try {
    const openaiClient = getOpenAIClient()
    if (!openaiClient) {
      throw new Error('OpenAI client is not initialized.')
    }

    const systemPrompt = `You are an expert real estate assistant specializing in analyzing home inspection reports. Your task is to extract key information and a comprehensive list of all potential issues. Respond with a JSON object with keys "property_address", "inspection_date", and "issues". The "issues" key should be an array of objects, each with three keys: "issueId" (a unique, machine-readable slug, e.g., "eroded-soil-under-patio"), "description" (a human-readable description), and "context" (the full paragraph from the report that describes the issue).`
    const userPrompt = `Please analyze the following home inspection report text and extract the property address, inspection date, and a list of all identified issues.

Report Text:
"""
${pdfText.substring(0, 16000)}
"""`

    const model = openaiClient.client.withConfig({
      ...AI_MODELS.ANALYSIS,
      // @ts-ignore
      response_format: { type: 'json_object' },
    })

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ])

    logger.info(
      '[ReportAgent] AI response from parseInitialReport:',
      response.content,
    )

    const parsedResponse = JSON.parse(response.content as string)

    const identifiedIssues: ReportAgentState['identifiedIssues'] =
      parsedResponse.issues && Array.isArray(parsedResponse.issues)
        ? parsedResponse.issues
        : []

    const finalProgressLog = [
      ...progressLog,
      `Successfully identified ${identifiedIssues.length} issues.`,
    ]

    if (identifiedIssues.length === 0) {
      finalProgressLog.push(
        'AI analysis did not find any specific issues in the report.',
      )
    }

    return {
      propertyAddress: parsedResponse.property_address || 'Not specified',
      inspectionDate: parsedResponse.inspection_date || 'Not specified',
      identifiedIssues,
      progressLog: finalProgressLog,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`[ReportAgent] Error in parseInitialReport: ${errorMessage}`, error)
    return {
      progressLog: [
        ...progressLog,
        `Error analyzing report with AI: ${errorMessage}`,
      ],
    }
  }
}


/**
 * Node: research_all_issues
 *
 * This is a dynamic node that iterates through each identified issue and
 * dispatches a temporary, specialized research agent to gather details.
 */
async function researchAllIssues(
  state: ReportAgentState,
): Promise<Partial<ReportAgentState>> {
  const { identifiedIssues, propertyAddress, event } = state
  let { progressLog } = state
  const issueResearch: ReportAgentState['issueResearch'] = {}

  if (!event) {
    return {
      progressLog: [
        ...progressLog,
        'Error: Event object not available. Cannot send progress updates.',
      ],
    }
  }

  if (!process.env.BRAVESEARCH_API_KEY) {
    logger.warn(
      '[ReportAgent] BRAVESEARCH_API_KEY is not set. Skipping web research.',
    )
    progressLog.push(
      'Warning: BRAVESEARCH_API_KEY not set. Skipping web research.',
    )
    for (const issue of identifiedIssues) {
      issueResearch[issue.issueId] = {
        summary:
          'Web research was skipped because the BRAVESEARCH_API_KEY was not configured.',
        estimatedCost: 'N/A',
        confidence: 'Low',
        contractorType: 'Unknown',
        localContractors: [],
        sources: ['Local configuration'],
      }
    }
    return { issueResearch, progressLog }
  }

  const searchTool = new BraveSearch({
    apiKey: process.env.BRAVESEARCH_API_KEY,
  })

  const openaiClient = getOpenAIClient()
  if (!openaiClient) {
    return {
      progressLog: [
        ...progressLog,
        'Error: Cannot research issues because OpenAI client is not initialized.',
      ],
    }
  }

  const model = openaiClient.client.withConfig({
    ...AI_MODELS.ANALYSIS,
    // @ts-ignore
    response_format: { type: 'json_object' },
  })

  for (const issue of identifiedIssues) {
    try {
      const statusMessage = `Researching issue: ${issue.description}...`
      progressLog = [...progressLog, statusMessage]
      event.sender.send('reports:progress', statusMessage)

      const searchQuery = `cost to repair ${issue.description} in ${propertyAddress}`
      // eslint-disable-next-line no-await-in-loop
      const searchResult = await searchTool.call(searchQuery)
      logger.info(
        `[ReportAgent] Brave Search result for "${issue.description}":`,
        searchResult,
      )
      const researchSummary =
        typeof searchResult === 'string'
          ? searchResult
          : JSON.stringify(searchResult)

      const systemPrompt = `You are an expert in home repair cost estimation. Based on the issue description, context from the report, and web search results, output a JSON object with the following keys:
- "summary": A brief explanation of the issue and recommended action.
- "estimatedCostRange": A string representing the likely cost range, e.g., "$500 - $2000".
- "contractorType": The type of professional needed, e.g., "Plumber".
- "confidence": One of "High", "Medium", or "Low" based on the reliability of the information.`

      const userPrompt = `Issue: ${issue.description}
Context from Report:
"""
${issue.context || 'No specific context was extracted.'}
"""

Web Search Result:
"""
${researchSummary.substring(0, 8000)}
"""`

      // eslint-disable-next-line no-await-in-loop
      const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ])
      logger.info(
        `[ReportAgent] AI synthesis for "${issue.description}":`,
        response.content,
      )
      const parsed = JSON.parse(response.content.toString())

      issueResearch[issue.issueId] = {
        summary: parsed.summary || 'No summary provided',
        estimatedCost: parsed.estimatedCostRange || 'Unknown',
        confidence: parsed.confidence || 'Medium',
        contractorType: parsed.contractorType || 'General Contractor',
        localContractors: [], // Placeholder
        sources: [`Brave Search for "${searchQuery}"`],
      }

      const completedMessage = `Completed research for ${issue.description}.`
      progressLog = [...progressLog, completedMessage]
      event.sender.send('reports:progress', completedMessage)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      const failedMessage = `Failed to research issue ${issue.issueId}: ${errorMessage}`
      progressLog = [...progressLog, failedMessage]
      event.sender.send('reports:progress', failedMessage)
    }
  }

  return { issueResearch, progressLog }
}

/**
 * Router: should_research_issues
 *
 * Checks if any issues were identified. If so, routes to the research node.
 * Otherwise, skips to the final report compilation.
 */
function shouldResearchIssues(
  state: ReportAgentState,
): 'research_issues' | 'finish_processing' {
  if (state.identifiedIssues && state.identifiedIssues.length > 0) {
    return 'research_issues'
  }
  return 'finish_processing'
}

/**
 * Node: compile_final_report
 *
 * Aggregates all the research and analysis into a single,
 * well-formatted Markdown document.
 */
function compileFinalReport(
  state: ReportAgentState,
): Partial<ReportAgentState> {
  const { propertyAddress, inspectionDate, issueResearch, identifiedIssues } =
    state

  let report = `# Home Inspection Report Summary\n\n`
  report += `**Property Address:** ${propertyAddress}\n`
  report += `**Inspection Date:** ${inspectionDate}\n\n`
  report += `## Summary of Findings\n\nThis report summarizes ${identifiedIssues.length} key issues identified during the inspection. Each issue has been analyzed for potential cost and required contractor type based on automated web research.\n\n---\n\n`

  for (const issue of identifiedIssues) {
    const research = issueResearch[issue.issueId]
    if (research) {
      report += `### Issue: ${issue.description}\n\n`
      report += `**Summary & Analysis:**\n${research.summary}\n\n`
      report += `**Estimated Cost Range:** ${research.estimatedCost}\n`
      report += `**Confidence:** ${research.confidence}\n`
      report += `**Required Contractor:** ${research.contractorType}\n\n`
      report += `**Potential Local Contractors (based on web search):**\n`
      research.localContractors?.forEach(c => {
        report += `- ${c.name}`
        if (c.phone) report += ` (${c.phone})`
        if (c.url) report += ` - [Website](${c.url})`
        report += `\n`
      })
      report += `\n**Information Sources:**\n`
      research.sources.forEach(s => {
        if (s) report += `- ${s}\n`
      })
      report += `\n---\n\n`
    }
  }

  return {
    finalReport: report,
    progressLog: [...state.progressLog, 'Final report compiled.'],
  }
}

// 1. Define Nodes & Edges using a chained builder pattern
const workflowSchema: StateGraphArgs<ReportAgentState>['channels'] = {
  pdfBuffer: {
    value: (x: Buffer, y: Buffer) => y,
    default: () => Buffer.from(''),
  },
  pdfText: {
    value: (x = '', y: string) => y,
    default: () => '',
  },
  propertyAddress: {
    value: (x = '', y: string) => y,
    default: () => '',
  },
  inspectionDate: {
    value: (x = '', y: string) => y,
    default: () => '',
  },
  identifiedIssues: {
    value: (
      x: ReportAgentState['identifiedIssues'] = [],
      y: ReportAgentState['identifiedIssues'],
    ) => (Array.isArray(y) ? y : x.concat(y)),
    default: () => [],
  },
  issueResearch: {
    value: (
      x: ReportAgentState['issueResearch'] = {},
      y: ReportAgentState['issueResearch'],
    ) => ({ ...x, ...y }),
    default: () => ({}),
  },
  finalReport: {
    value: (x = '', y: string) => y,
    default: () => '',
  },
  progressLog: {
    value: (x: string[] = [], y: string[]) => x.concat(y),
    default: () => [],
  },
  messages: {
    value: (x: BaseMessage[] = [], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
  event: {
    value: (
      x?: IpcMainInvokeEvent,
      y?: IpcMainInvokeEvent,
    ): IpcMainInvokeEvent | undefined => y ?? x,
    default: () => undefined,
  },
}

const workflow = new StateGraph<ReportAgentState>({
  channels: workflowSchema,
})
  .addNode(
    'start_processing',
    createProgressNode('Starting report generation...'),
  )
  .addNode('extract_text', extractTextFromPdf)
  .addNode('parse_report', parseInitialReport)
  .addNode('research_issues', researchAllIssues)
  .addNode('compile_report', compileFinalReport)
  .addNode(
    'finish_processing',
    createProgressNode('Finished report generation.'),
  )
  .addEdge(START, 'start_processing')
  .addEdge('start_processing', 'extract_text')
  .addEdge('extract_text', 'parse_report')
  .addConditionalEdges('parse_report', shouldResearchIssues, {
    research_issues: 'research_issues',
    finish_processing: 'finish_processing',
  })
  .addEdge('research_issues', 'compile_report')
  .addEdge('compile_report', 'finish_processing')
  .addEdge('finish_processing', END)

// 2. Compile Graph
const reportAgentGraph = workflow.compile()

/**
 * This is the main entry point for the report generation agent.
 * It is invoked by an IPC call from the renderer process.
 */
export const generateReport = async (
  event: IpcMainInvokeEvent,
  fileBuffers: Buffer[],
  threadId: string, // This is the reportId from Firestore
) => {
  logger.info(
    `[ReportAgent] Starting report generation for threadId: ${threadId}`,
  )
  const sendProgress = (message: string) => {
    logger.info(`[ReportAgent] Sending progress for ${threadId}: "${message}"`)
    event.sender.send('reports:progress', message)
  }

  // Use the first file path for now
  const pdfBuffer = fileBuffers[0]

  const initialState: ReportAgentState = {
    pdfBuffer,
    pdfText: '',
    propertyAddress: '',
    inspectionDate: '',
    identifiedIssues: [],
    issueResearch: {},
    finalReport: '',
    progressLog: ['Workflow initiated.'],
    messages: [],
    event,
  }

  const reportAgentGraph = workflow.compile()

  try {
    const stream = await reportAgentGraph.stream(initialState, {
      configurable: { threadId },
    })

    let finalReport: string | undefined

    for await (const chunk of stream) {
      const stateUpdate = Object.values(chunk)[0] as Partial<ReportAgentState>

      if (stateUpdate.finalReport) {
        finalReport = stateUpdate.finalReport
      }

      if (stateUpdate.progressLog) {
        // Send the latest progress message
        const latestMessage = stateUpdate.progressLog.slice(-1)[0]
        sendProgress(latestMessage)
      }
    }
    logger.info(`[ReportAgent] Stream finished for threadId: ${threadId}.`)
    sendProgress('Agent workflow finished.')

    if (finalReport) {
      const reportRef = doc(db, COLLECTIONS.INSPECTION_REPORTS, threadId)
      await updateDoc(reportRef, {
        markdownContent: finalReport,
        status: 'completed',
      })
      logger.info(`[ReportAgent] Firestore updated for threadId: ${threadId}.`)
      sendProgress('Report saved successfully.')
    } else {
      logger.warn(
        `[ReportAgent] No final report was generated for threadId: ${threadId}.`,
      )
      sendProgress('Could not generate final report.')
    }

    sendProgress('Report generation complete')
  } catch (e) {
    logger.error(
      `[ReportAgent] Error during generation for threadId: ${threadId}`,
      e,
    )
    sendProgress(
      `An error occurred: ${e instanceof Error ? e.message : 'Unknown error'}`,
    )
  }
} 