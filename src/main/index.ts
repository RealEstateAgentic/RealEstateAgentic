import { app } from 'electron'
import dotenv from 'dotenv'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { MainWindow } from './windows/main'
import { setupPDFHandlers, removePDFHandlers } from './ipc/pdf-handlers'
import { initializeFromEnv } from '../lib/groq/client'
import { initializeFromEnv as initializeOpenAI } from '../lib/openai/client'
import { registerReportHandlers } from './ipc/report-handlers'
import { setupEmailHandler } from './email-handler'
import { setupWebhookHandler } from './webhook-handler'
import { setupOAuthHandler } from './oauth-handler'

// Load environment variables from .env file
console.log(`[dotenv] Current working directory: ${process.cwd()}`)
const dotenvResult = dotenv.config()
if (dotenvResult.error) {
  console.error('[dotenv] Error loading .env file:', dotenvResult.error)
} else {
  console.log('[dotenv] .env file loaded successfully.')
}
console.log(
  `[dotenv] OPENAI_API_KEY is ${
    process.env.OPENAI_API_KEY ? 'set' : 'NOT SET'
  }`
)

makeAppWithSingleInstanceLock(async () => {
  console.log('🚀 App starting...')
  await app.whenReady()
  console.log('✅ App ready')

  // Initialize Groq client in main process
  try {
    initializeFromEnv()
    console.log('✅ Groq client initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize Groq client:', error)
    // Continue without Groq if key is missing
  }

  // Initialize OpenAI client in main process
  try {
    initializeOpenAI()
    console.log('✅ OpenAI client initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error)
    // Continue without OpenAI if key is missing
  }

  // Setup IPC handlers
  console.log('🔧 Setting up IPC handlers...')
  setupPDFHandlers()
  registerReportHandlers()

  setupEmailHandler()
  setupWebhookHandler()
  setupOAuthHandler()
  console.log('✅ IPC handlers setup complete')

  console.log('🖥️  Creating main window...')
  await makeAppSetup(MainWindow)
  console.log('✅ Main window created')
})

// Cleanup on app quit
app.on('before-quit', () => {
  removePDFHandlers()
})
