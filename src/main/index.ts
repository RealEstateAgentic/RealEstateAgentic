import { app } from 'electron'
import dotenv from 'dotenv'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { MainWindow } from './windows/main'
import { setupPDFHandlers, removePDFHandlers } from './ipc/pdf-handlers'
import { initializeFromEnv } from '../lib/openai/client'
import { registerReportHandlers } from './ipc/report-handlers'

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
  await app.whenReady()

  // Initialize OpenAI client in main process
  try {
    initializeFromEnv()
    console.log('OpenAI client initialized successfully')
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error)
    // Continue without OpenAI if key is missing
  }

  // Setup IPC handlers
  setupPDFHandlers()
  registerReportHandlers()

  await makeAppSetup(MainWindow)
})

// Cleanup on app quit
app.on('before-quit', () => {
  removePDFHandlers()
})
