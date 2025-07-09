import { app } from 'electron'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { MainWindow } from './windows/main'
import { setupPDFHandlers, removePDFHandlers } from './ipc/pdf-handlers'
import { initializeFromEnv } from '../lib/openai/client'

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

  await makeAppSetup(MainWindow)
})

// Cleanup on app quit
app.on('before-quit', () => {
  removePDFHandlers()
})
