import { app } from 'electron'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { MainWindow } from './windows/main'
import { setupPDFHandlers, removePDFHandlers } from './ipc/pdf-handlers'

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  
  // Setup IPC handlers
  setupPDFHandlers()
  
  await makeAppSetup(MainWindow)
})

// Cleanup on app quit
app.on('before-quit', () => {
  removePDFHandlers()
})
