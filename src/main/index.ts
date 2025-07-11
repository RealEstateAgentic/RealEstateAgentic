import { app } from 'electron'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { MainWindow } from './windows/main'
import { setupPDFHandlers, removePDFHandlers } from './ipc/pdf-handlers'
import { initializeFromEnv } from '../lib/groq/client'
import { registerReportHandlers } from './ipc/report-handlers'
import { setupEmailHandler } from './email-handler'
import { setupWebhookHandler } from './webhook-handler'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()

  // Initialize Groq client in main process
  try {
    initializeFromEnv()
    console.log('Groq client initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Groq client:', error)
    // Continue without Groq if key is missing
  }

  // Setup IPC handlers
  setupPDFHandlers()
  registerReportHandlers()

  setupEmailHandler()
  setupWebhookHandler()

  await makeAppSetup(MainWindow)
})

// Cleanup on app quit
app.on('before-quit', () => {
  removePDFHandlers()
})
