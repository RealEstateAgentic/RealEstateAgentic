/**
 * OAuth Handler for Electron Main Process
 * Captures OAuth callbacks and extracts authorization codes
 */

import { ipcMain, BrowserWindow, shell } from 'electron'

let lastOAuthCode: string | null = null

export function setupOAuthHandler(): void {
  console.log('🔗 OAuth handler registered')

  // Handle OAuth window creation
  ipcMain.handle('open-oauth-window', async (event, authUrl: string) => {
    try {
      console.log('🔗 Opening OAuth window:', authUrl)
      
      // Create a new browser window for OAuth
      const oauthWindow = new BrowserWindow({
        width: 500,
        height: 600,
        show: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      // Load the OAuth URL
      await oauthWindow.loadURL(authUrl)

      return new Promise((resolve) => {
        // Listen for navigation events to catch the callback
        oauthWindow.webContents.on('did-navigate', (event, navigationUrl) => {
          console.log('🔍 OAuth navigation:', navigationUrl)
          
          if (navigationUrl.includes('localhost:8080/oauth/callback')) {
            try {
              const url = new URL(navigationUrl)
              const code = url.searchParams.get('code')
              const error = url.searchParams.get('error')
              
              if (code) {
                console.log('✅ OAuth code captured:', code.substring(0, 20) + '...')
                lastOAuthCode = code
                oauthWindow.close()
                resolve({ success: true, code })
              } else if (error) {
                console.error('❌ OAuth error:', error)
                oauthWindow.close()
                resolve({ success: false, error })
              }
            } catch (err) {
              console.error('❌ Error parsing OAuth callback:', err)
              oauthWindow.close()
              resolve({ success: false, error: 'Failed to parse callback URL' })
            }
          }
        })

        // Handle window closed
        oauthWindow.on('closed', () => {
          resolve({ success: false, error: 'OAuth window was closed' })
        })

        // Handle load failures (like the localhost connection refused)
        oauthWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
          if (validatedURL.includes('localhost:8080/oauth/callback')) {
            try {
              const url = new URL(validatedURL)
              const code = url.searchParams.get('code')
              
              if (code) {
                console.log('✅ OAuth code captured from failed load:', code.substring(0, 20) + '...')
                lastOAuthCode = code
                oauthWindow.close()
                resolve({ success: true, code })
                return
              }
            } catch (err) {
              console.error('❌ Error parsing failed load URL:', err)
            }
          }
          
          console.log('❌ OAuth load failed:', errorDescription, 'for URL:', validatedURL)
        })
      })

    } catch (error) {
      console.error('❌ Failed to create OAuth window:', error)
      return { success: false, error: error.message }
    }
  })

  // Handle getting the last OAuth code
  ipcMain.handle('get-last-oauth-code', async () => {
    const code = lastOAuthCode
    lastOAuthCode = null // Clear it after retrieval
    return code
  })

  // Handle token exchange (secure - keeps client secret in main process)
  ipcMain.handle('exchange-oauth-tokens', async (event, authCode: string) => {
    try {
      console.log('🔄 Exchanging OAuth code for tokens in main process...')
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost:8080/oauth/callback'
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token exchange failed: ${response.status} ${error}`)
      }

      const tokens = await response.json()
      console.log('✅ Tokens exchanged successfully in main process')
      
      return { success: true, tokens }
    } catch (error) {
      console.error('❌ Token exchange failed in main process:', error)
      return { success: false, error: error.message }
    }
  })

  // Handle token refresh (secure - keeps client secret in main process)
  ipcMain.handle('refresh-oauth-tokens', async (event, refreshToken: string) => {
    try {
      console.log('🔄 Refreshing OAuth tokens in main process...')
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token refresh failed: ${response.status} ${error}`)
      }

      const tokens = await response.json()
      console.log('✅ Tokens refreshed successfully in main process')
      
      return { success: true, tokens }
    } catch (error) {
      console.error('❌ Token refresh failed in main process:', error)
      return { success: false, error: error.message }
    }
  })


  // Intercept console logs to capture OAuth codes from failed loads
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error
  
  const extractCodeFromLog = (message: string) => {
    if (message.includes('Failed to load URL: http://localhost:8080/oauth/callback?code=')) {
      try {
        const match = message.match(/code=([^&\s]+)/)
        if (match && match[1]) {
          const code = decodeURIComponent(match[1])
          console.log('✅ OAuth code extracted from logs:', code.substring(0, 20) + '...')
          lastOAuthCode = code
        }
      } catch (err) {
        console.error('❌ Error extracting OAuth code from log:', err)
      }
    }
  }

  console.warn = (...args) => {
    const message = args.join(' ')
    extractCodeFromLog(message)
    originalConsoleWarn.apply(console, args)
  }

  console.error = (...args) => {
    const message = args.join(' ')
    extractCodeFromLog(message)
    originalConsoleError.apply(console, args)
  }

  // Also intercept process warnings
  process.on('warning', (warning) => {
    if (warning.message) {
      extractCodeFromLog(warning.message)
    }
  })
}