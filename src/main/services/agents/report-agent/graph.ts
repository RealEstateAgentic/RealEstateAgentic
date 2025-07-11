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
const pdfParse = require('pdf-parse')
import { promises as fs } from 'fs'
import { ipcMain, type IpcMainInvokeEvent } from 'electron'

import { getOpenAIClient, AI_MODELS } from '../../../../lib/openai/client'
import { type ReportAgentState } from './schema'
import { db } from '../../../../lib/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import { logger } from '../../../utils/logger'
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
 * Utility function to process items in batches with delays to respect rate limits
 */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  delayMs: number,
  processor: (item: T) => Promise<R>,
  onBatchStart?: (batchIndex: number, totalBatches: number) => void,
): Promise<R[]> {
  const results: R[] = []
  const totalBatches = Math.ceil(items.length / batchSize)
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchIndex = Math.floor(i / batchSize) + 1
    
    if (onBatchStart) {
      onBatchStart(batchIndex, totalBatches)
    }
    
    logger.info(`[ReportAgent] Processing batch ${batchIndex} of ${totalBatches} (${batch.length} items)`)
    
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
    
    // Add delay between batches (except after the last batch)
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return results
}

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
  const startTime = Date.now()
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
      ...AI_MODELS.FAST,
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

    const duration = (Date.now() - startTime) / 1000
    const finalProgressLog = [
      ...progressLog,
      `Successfully identified ${identifiedIssues.length} issues.`,
    ]

    if (identifiedIssues.length === 0) {
      finalProgressLog.push(
        'AI analysis did not find any specific issues in the report.',
      )
    }

    logger.info(`[ReportAgent] Report parsing took ${duration}s and identified ${identifiedIssues.length} issues`)

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
 * Parallelized research node that processes issues in batches to respect rate limits
 * while maximizing concurrency for faster execution.
 */
async function researchAllIssues(
  state: ReportAgentState,
): Promise<Partial<ReportAgentState>> {
  const { identifiedIssues, propertyAddress, event } = state
  let { progressLog } = state
  const issueResearch: ReportAgentState['issueResearch'] = {}
  const startTime = Date.now()

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
        severity: 'Unknown',
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
    ...AI_MODELS.FAST,
    // @ts-ignore
    response_format: { type: 'json_object' },
  })

  /**
   * Phase 1: Search for all issues in parallel
   */
  const searchAllIssues = async (issues: ReportAgentState['identifiedIssues']) => {
    const searchIssue = async (issue: ReportAgentState['identifiedIssues'][0]) => {
      try {
        const searchQuery = `cost to repair ${issue.description} in ${propertyAddress}`
        
        // Send progress update for search query
        const searchMessage = `Searching for: ${searchQuery}`
        progressLog = [...progressLog, searchMessage]
        event.sender.send('reports:progress', { message: searchMessage })

        const searchResultString = await searchTool.call(searchQuery)
        logger.info(
          `[ReportAgent] Brave Search result for "${issue.description}":`,
          searchResultString,
        )
        
        const searchResults = JSON.parse(searchResultString) as Array<{ title: string, link: string, snippet: string }>
        
        // Keep both structured and text format for LLM processing
        const structuredResults = searchResults.map((r, index) => ({
          id: index + 1,
          title: r.title,
          url: r.link,
          snippet: r.snippet
        }))

        const sourceLinks = searchResults.map(r => r.link)

        return {
          issueId: issue.issueId,
          issue,
          structuredResults,
          sourceLinks,
          success: true
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`[ReportAgent] Error searching for issue ${issue.issueId}:`, errorMessage)
        
        return {
          issueId: issue.issueId,
          issue,
          structuredResults: [],
          sourceLinks: [],
          success: false,
          error: errorMessage
        }
      }
    }

    // Process search queries in batches to respect Brave Search rate limits
    return await processInBatches(
      issues,
      batchSize,
      delayMs,
      searchIssue,
      (batchIndex, totalBatches) => {
        const batchMessage = `Searching batch ${batchIndex} of ${totalBatches} (issues ${(batchIndex - 1) * batchSize + 1}-${Math.min(batchIndex * batchSize, issues.length)})`
        progressLog = [...progressLog, batchMessage]
        event.sender.send('reports:progress', { message: batchMessage })
      }
    )
  }

  /**
   * Phase 2: Synthesize all search results with LLM in parallel
   */
  const synthesizeAllResults = async (searchResults: any[]) => {
    const synthesizeResult = async (searchResult: any) => {
      try {
        if (!searchResult.success) {
          return {
            issueId: searchResult.issueId,
            research: {
              summary: `Research failed: ${searchResult.error}`,
              estimatedCost: 'N/A',
              confidence: 'Low',
              contractorType: 'Unknown',
              severity: 'Unknown',
              localContractors: [],
              sources: ['Error occurred during research'],
            }
          }
        }

        const systemPrompt = `You are an expert in home repair cost estimation. Based on the issue description, context from the report, and web search results, output a JSON object with the following keys:
- "summary": A brief explanation of the issue and recommended action.
- "estimatedCostRange": A string representing the likely cost range, e.g., "$500 - $2000".
- "contractorType": The type of professional needed, e.g., "Plumber".
- "confidence": One of "High", "Medium", or "Low" based on the reliability of the information.
- "severity": "Low" (cosmetic, no immediate action), "Medium" (functional, plan within months), or "High" (urgent safety/structural, address ASAP) based on description, context, cost, safety risks, and urgency.
- "localContractors": An array of objects, where each object has "name" and "url" keys. For each contractor you identify, ALWAYS include the "url" from the corresponding search result. If you find a contractor name in a search result, use that result's URL as the contractor's URL.`

        // Format structured search results for the LLM
        const searchResultsText = searchResult.structuredResults.map((r: any) => 
          `[Result ${r.id}]
Title: ${r.title}
URL: ${r.url}
Snippet: ${r.snippet}`
        ).join('\n\n')

        const userPrompt = `Issue: ${searchResult.issue.description}
Context from Report:
"""
${searchResult.issue.context || 'No specific context was extracted.'}
"""

Web Search Results:
"""
${searchResultsText.substring(0, 8000)}
"""

IMPORTANT: When extracting contractors, always map each contractor to the URL of the search result where you found them. Every contractor should have a URL from one of the search results above.`

        const response = await model.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(userPrompt),
        ])
        logger.info(
          `[ReportAgent] AI synthesis for "${searchResult.issue.description}":`,
          response.content,
        )
        const parsed = JSON.parse(response.content.toString())

        return {
          issueId: searchResult.issueId,
          research: {
            summary: parsed.summary || 'No summary provided',
            estimatedCost: parsed.estimatedCostRange || 'Unknown',
            confidence: parsed.confidence || 'Medium',
            contractorType: parsed.contractorType || 'General Contractor',
            severity: parsed.severity || 'Medium',
            localContractors: parsed.localContractors || [],
            sources: searchResult.sourceLinks,
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`[ReportAgent] Error synthesizing issue ${searchResult.issueId}:`, errorMessage)
        
        return {
          issueId: searchResult.issueId,
          research: {
            summary: `Synthesis failed: ${errorMessage}`,
            estimatedCost: 'N/A',
            confidence: 'Low',
            contractorType: 'Unknown',
            severity: 'Unknown',
            localContractors: [],
            sources: searchResult.sourceLinks || [],
          }
        }
      }
    }

    // Process LLM synthesis in large batches (no rate limit for OpenAI in normal usage)
    const llmBatchSize = 15 // Larger batches for LLM since OpenAI handles concurrency well
    
    return await processInBatches(
      searchResults,
      llmBatchSize,
      500, // Shorter delay for LLM calls
      synthesizeResult,
      (batchIndex, totalBatches) => {
        const batchMessage = `Synthesizing batch ${batchIndex} of ${totalBatches} with AI`
        progressLog = [...progressLog, batchMessage]
        event.sender.send('reports:progress', { message: batchMessage })
      }
    )
  }

  // Process issues in two phases for maximum parallelization
  const batchSize = 7 // Conservative batch size for 20 TPS limit (Brave Search)
  const delayMs = 1000 // 1 second delay between batches

  try {
    // Phase 1: Search for all issues (respecting Brave Search rate limits)
    progressLog = [...progressLog, 'Phase 1: Starting parallel search for all issues...']
    event.sender.send('reports:progress', { message: 'Phase 1: Starting parallel search for all issues...' })
    
    const searchResults = await searchAllIssues(identifiedIssues)
    
    progressLog = [...progressLog, `Phase 1 complete: Retrieved search results for ${searchResults.length} issues`]
    event.sender.send('reports:progress', { message: `Phase 1 complete: Retrieved search results for ${searchResults.length} issues` })

    // Phase 2: Synthesize all results with LLM (higher concurrency, no rate limits)
    progressLog = [...progressLog, 'Phase 2: Starting AI synthesis for all results...']
    event.sender.send('reports:progress', { message: 'Phase 2: Starting AI synthesis for all results...' })
    
    const synthesisResults = await synthesizeAllResults(searchResults)
    
    progressLog = [...progressLog, `Phase 2 complete: AI synthesis finished for ${synthesisResults.length} issues`]
    event.sender.send('reports:progress', { message: `Phase 2 complete: AI synthesis finished for ${synthesisResults.length} issues` })

    // Aggregate results
    for (const result of synthesisResults) {
      issueResearch[result.issueId] = result.research
    }

    const duration = (Date.now() - startTime) / 1000
    const completedMessage = `Completed research for ${identifiedIssues.length} issues in ${duration}s`
    progressLog = [...progressLog, completedMessage]
    event.sender.send('reports:progress', { message: completedMessage })
    
    logger.info(`[ReportAgent] Research for ${identifiedIssues.length} issues took ${duration}s`)

    return { issueResearch, progressLog }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const failedMessage = `Failed to complete research process: ${errorMessage}`
    progressLog = [...progressLog, failedMessage]
    event.sender.send('reports:progress', { message: failedMessage })
    
    return { issueResearch, progressLog }
  }
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
/**
 * Helper function to parse cost ranges and extract numeric values
 */
function parseCostRange(costString: string): { low: number; high: number } | null {
  if (!costString || costString === 'N/A' || costString === 'Unknown') {
    return null
  }

  // Remove currency symbols and common prefixes
  const cleanString = costString.replace(/[,$]/g, '').toLowerCase()
  
  // Try to match patterns like "$500 - $2000", "500-2000", "$1,500 to $3,000", etc.
  const rangePatterns = [
    /(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)/,  // 500-2000, 500 to 2000
    /(\d+(?:\.\d+)?)k?\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)k?/,  // with k suffix
  ]

  for (const pattern of rangePatterns) {
    const match = cleanString.match(pattern)
    if (match) {
      let low = parseFloat(match[1])
      let high = parseFloat(match[2])
      
      // Handle 'k' suffix (thousands)
      if (match[0].includes('k')) {
        low = low * 1000
        high = high * 1000
      }
      
      return { low, high }
    }
  }

  // Try to match single values like "$1500", "2000"
  const singlePattern = /(\d+(?:\.\d+)?)k?/
  const singleMatch = cleanString.match(singlePattern)
  if (singleMatch) {
    let value = parseFloat(singleMatch[1])
    if (singleMatch[0].includes('k')) {
      value = value * 1000
    }
    // For single values, assume ±25% range
    return { low: value * 0.75, high: value * 1.25 }
  }

  return null
}

function compileFinalReport(
  state: ReportAgentState,
): Partial<ReportAgentState> {
  const { propertyAddress, inspectionDate, issueResearch, identifiedIssues } =
    state

  // Calculate total repair costs
  let totalLow = 0
  let totalHigh = 0
  let issuesWithCosts = 0

  for (const issue of identifiedIssues) {
    const research = issueResearch[issue.issueId]
    if (research?.estimatedCost) {
      const costRange = parseCostRange(research.estimatedCost)
      if (costRange) {
        totalLow += costRange.low
        totalHigh += costRange.high
        issuesWithCosts++
      }
    }
  }

  // Helper function for formatting currency
  const formatCurrency = (amount: number) => `$${Math.round(amount).toLocaleString()}`

  let markdown = `# Repair Estimate Summary\n\n`
  markdown += `**Property Address:** ${propertyAddress}\n`
  markdown += `**Inspection Date:** ${inspectionDate}\n\n`
  
  // Add total cost summary at the very top
  if (issuesWithCosts > 0) {
    markdown += `## 💰 Total Estimated Repair Costs\n\n`
    markdown += `**Estimated Range:** ${formatCurrency(totalLow)} - ${formatCurrency(totalHigh)}\n`
    markdown += `**Based on:** ${issuesWithCosts} of ${identifiedIssues.length} issues with cost estimates\n\n`
    
    // Add breakdown by severity
    const severityBreakdown = { High: { low: 0, high: 0, count: 0 }, Medium: { low: 0, high: 0, count: 0 }, Low: { low: 0, high: 0, count: 0 } }
    
    for (const issue of identifiedIssues) {
      const research = issueResearch[issue.issueId]
      if (research?.estimatedCost && research?.severity) {
        const costRange = parseCostRange(research.estimatedCost)
        if (costRange && (research.severity === 'High' || research.severity === 'Medium' || research.severity === 'Low')) {
          severityBreakdown[research.severity].low += costRange.low
          severityBreakdown[research.severity].high += costRange.high
          severityBreakdown[research.severity].count++
        }
      }
    }

    markdown += `### Cost Breakdown by Priority:\n\n`
    markdown += `| Priority | Issues | Estimated Cost Range |\n`
    markdown += `|:---|:---:|:---|\n`
    
    if (severityBreakdown.High.count > 0) {
      markdown += `| 🔴 **High Priority** | ${severityBreakdown.High.count} | ${formatCurrency(severityBreakdown.High.low)} - ${formatCurrency(severityBreakdown.High.high)} |\n`
    }
    if (severityBreakdown.Medium.count > 0) {
      markdown += `| 🟡 Medium Priority | ${severityBreakdown.Medium.count} | ${formatCurrency(severityBreakdown.Medium.low)} - ${formatCurrency(severityBreakdown.Medium.high)} |\n`
    }
    if (severityBreakdown.Low.count > 0) {
      markdown += `| 🟢 Low Priority | ${severityBreakdown.Low.count} | ${formatCurrency(severityBreakdown.Low.low)} - ${formatCurrency(severityBreakdown.Low.high)} |\n`
    }
    markdown += `\n`
    
    if (issuesWithCosts < identifiedIssues.length) {
      markdown += `*Note: ${identifiedIssues.length - issuesWithCosts} issues could not be estimated and may require additional budget.*\n\n`
    }
  } else {
    markdown += `## 💰 Total Estimated Repair Costs\n\n`
    markdown += `**Status:** Cost estimates could not be determined for the identified issues.\n`
    markdown += `**Recommendation:** Consult with qualified contractors for detailed estimates.\n\n`
  }
  
  markdown += `---\n\n`
  markdown += `## Summary of Findings\n\nThis report summarizes ${identifiedIssues.length} key issues identified during the inspection. Each issue has been analyzed for potential cost and required contractor type based on automated web research.\n\n---\n\n`

  // Sort issues by severity (High -> Medium -> Low -> Unknown)
  const severityOrder = { 'High': 0, 'Medium': 1, 'Low': 2, 'Unknown': 3 }
  const sortedIssues = identifiedIssues.sort((a, b) => {
    const severityA = issueResearch[a.issueId]?.severity || 'Unknown'
    const severityB = issueResearch[b.issueId]?.severity || 'Unknown'
    return severityOrder[severityA] - severityOrder[severityB]
  })

  for (const issue of sortedIssues) {
    const research = issueResearch[issue.issueId]
    if (research) {
      const severityEmoji = research.severity === 'High' ? '🔴' : research.severity === 'Medium' ? '🟡' : '🟢'
      markdown += `### ${severityEmoji} Issue: ${issue.description}\n\n`
      markdown += `**Summary & Analysis:**\n${research.summary}\n\n`
      markdown += `**Severity:** ${research.severity === 'High' ? '**High**' : research.severity}\n`
      markdown += `**Estimated Cost Range:** ${research.estimatedCost}\n`
      markdown += `**Confidence:** ${research.confidence}\n`
      markdown += `**Required Contractor:** ${research?.contractorType}\n\n`

      if (research?.localContractors && research.localContractors.length > 0) {
        markdown += `**Potential Local Contractors (Brave Search):**\n`
        markdown += `| Name | Website |\n`
        markdown += `|:---|:---|\n`
        for (const contractor of research.localContractors) {
          const website = contractor.url ? `[Website](${contractor.url})` : ''
          markdown += `| ${contractor.name || 'N/A'} | ${website} |\n`
        }
        markdown += `\n`
      }
    }
  }

  markdown += `\n\n---\n\n*Disclaimer: This is an AI-generated report. All findings, especially cost estimates, should be independently verified with qualified professionals.*`

  markdown +=
    `\n---\n\n` +
    `**Information Sources:**\n` +
    `| Issue ID | Sources |\n` +
    `|:---|:---|\n`
  for (const issue of identifiedIssues) {
    const research = issueResearch[issue.issueId]
    if (research) {
      markdown += `| ${issue.issueId} | ${research.sources.join(', ')} |\n`
    }
  }
  markdown += `\n`

  return {
    finalReport: markdown,
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
  const overallStartTime = Date.now()
  logger.info(
    `[ReportAgent] Starting report generation for threadId: ${threadId}`,
  )
  const sendProgress = (
    message: string,
    isComplete = false,
    finalReport = '',
  ) => {
    logger.info(`[ReportAgent] Sending progress for ${threadId}: "${message}"`)
    event.sender.send('reports:progress', { message, isComplete, finalReport })
  }

  // Use the first file path for now
  const pdfBuffer = fileBuffers[0]

  const initialState: ReportAgentState = {
    pdfBuffer: pdfBuffer,
    pdfText: '',
    propertyAddress: '',
    inspectionDate: '',
    identifiedIssues: [],
    issueResearch: {},
    finalReport: '',
    progressLog: [],
    messages: [],
    event: event,
  }

  try {
    const stream = await reportAgentGraph.stream(initialState, {
      configurable: { threadId },
    })

    let finalState: Partial<ReportAgentState> = {}

    for await (const chunk of stream) {
      const [nodeName, stateUpdate] = Object.entries(chunk)[0]

      // Merge the latest updates into the final state
      finalState = { ...finalState, ...stateUpdate }

      if (stateUpdate.progressLog && stateUpdate.progressLog.length > 0) {
        // Send the latest progress message
        const latestMessage = stateUpdate.progressLog.slice(-1)[0]
        sendProgress(latestMessage)
      }
    }
    logger.info(`[ReportAgent] Stream finished for threadId: ${threadId}.`)

    const { finalReport, propertyAddress, inspectionDate } = finalState
    logger.info('[ReportAgent] Final report content to be saved:', finalReport)

    if (finalReport) {
      const reportRef = doc(db, COLLECTIONS.INSPECTION_REPORTS, threadId)
      await updateDoc(reportRef, {
        markdownContent: finalReport,
        propertyAddress: propertyAddress,
        inspectionDate: inspectionDate,
        status: 'completed',
        updatedAt: new Date(),
      })
      logger.info(`[ReportAgent] Firestore updated for threadId: ${threadId}.`)
      sendProgress('Report saved successfully.')
    } else {
      logger.warn(
        `[ReportAgent] No final report was generated for threadId: ${threadId}.`,
      )
      sendProgress('Could not generate final report.')
    }

    const overallDuration = (Date.now() - overallStartTime) / 1000
    logger.info(`[ReportAgent] Total report generation took ${overallDuration}s for threadId: ${threadId}`)
    sendProgress(`Report generation complete (${overallDuration}s total)`, true, finalReport || '')
  } catch (e) {
    logger.error(
      `[ReportAgent] Error during generation for threadId: ${threadId}`,
      e,
    )
    sendProgress(
      `An error occurred: ${e instanceof Error ? e.message : 'Unknown error'}`,
      true,
    )
  }
} 