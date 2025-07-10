import { app } from 'electron'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { MainWindow } from './windows/main'
import { setupPDFHandlers, removePDFHandlers } from './ipc/pdf-handlers'
import { setupEmailHandler } from './email-handler'
import { setupWebhookHandler } from './webhook-handler'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  
  // Setup IPC handlers
  setupPDFHandlers()
  setupEmailHandler()
  setupWebhookHandler()
  
  await makeAppSetup(MainWindow)
})

// Cleanup on app quit
app.on('before-quit', () => {
  removePDFHandlers()
})
