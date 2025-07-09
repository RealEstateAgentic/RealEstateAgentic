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

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()

  // Setup PDF and document management handlers
  setupPDFHandlers()
  setupDocumentHandlers()
  setupTemplateHandlers()
  setupSharingHandlers()

  await makeAppSetup(MainWindow)
})
