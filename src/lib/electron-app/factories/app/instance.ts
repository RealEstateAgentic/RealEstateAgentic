import { app } from 'electron'

export function makeAppWithSingleInstanceLock(fn: () => void) {
  const isPrimaryInstance = app.requestSingleInstanceLock()

  if (!isPrimaryInstance) {
    console.log(
      '🔒 Another instance is already running. Quitting this instance.'
    )
    app.quit()
  } else {
    console.log('🔓 This is the primary instance. Starting app...')
    fn()
  }
}
