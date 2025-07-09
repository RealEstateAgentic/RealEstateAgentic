import { app } from 'electron'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { MainWindow } from './windows/main'
import {
  setupPDFHandlers,
  setupDocumentHandlers,
  setupTemplateHandlers,
  setupSharingHandlers,
} from './ipc/pdf-handlers'
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

  // Setup PDF and document management handlers
  setupPDFHandlers()
  setupDocumentHandlers()
  setupTemplateHandlers()
  setupSharingHandlers()

  await makeAppSetup(MainWindow)
})
