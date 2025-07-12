/**
 * Gmail Authentication Service
 * Handles Google OAuth flow for Gmail API access
 */

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'
const GOOGLE_API_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
]

interface GmailAuthResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  userEmail?: string
  error?: string
}

interface GoogleUser {
  email: string
  name: string
  picture?: string
}

class GmailAuthService {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private userEmail: string | null = null
  private tokenExpiry: number | null = null

  /**
   * Check if user has valid Gmail authentication
   */
  public isAuthenticated(): boolean {
    return !!(this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry)
  }

  /**
   * Get current authenticated user email
   */
  public getUserEmail(): string | null {
    return this.userEmail
  }

  /**
   * Authenticate with Gmail using Electron's BrowserWindow OAuth flow
   */
  public async authenticate(): Promise<GmailAuthResult> {
    try {
      console.log('🔑 Starting Gmail OAuth flow...')
      
      // Check if we're in Electron renderer process
      if (typeof window === 'undefined') {
        throw new Error('Gmail auth must be called from renderer process')
      }

      // Use Electron's IPC to handle OAuth flow in main process
      if (window.electronAPI && window.electronAPI.openOAuthWindow) {
        console.log('🔗 Using Electron OAuth window...')
        
        const authUrl = this.buildAuthUrl()
        const result = await window.electronAPI.openOAuthWindow(authUrl)
        
        if (!result.success) {
          console.log('⚠️ Electron OAuth failed, falling back to popup method:', result.error)
          // Fall through to popup method
        } else {
          const authCode = result.code
          console.log('✅ OAuth code received via Electron')
          
          // Exchange code for tokens (secure - via main process)
          const tokenResult = await this.exchangeCodeForTokensSecure(authCode)
          if (!tokenResult.success) {
            throw new Error(`Token exchange failed: ${tokenResult.error}`)
          }
          const tokens = tokenResult.tokens
          console.log('✅ Tokens received')

          // Get user info
          const userInfo = await this.getUserInfo(tokens.access_token)
          console.log('✅ User info received:', userInfo.email)

          // Store tokens and user info
          this.accessToken = tokens.access_token
          this.refreshToken = tokens.refresh_token
          this.userEmail = userInfo.email
          this.tokenExpiry = Date.now() + (tokens.expires_in * 1000)

          // Store in localStorage for persistence
          this.saveToStorage()

          return {
            success: true,
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            userEmail: this.userEmail
          }
        }
      }
      
      // Fallback to popup method (with improved error handling)
      console.log('🔗 Using popup OAuth method...')
      
      const authUrl = this.buildAuthUrl()
      console.log('🔗 Opening OAuth popup:', authUrl)

      // Open popup window for OAuth
      const popup = window.open(
        authUrl,
        'gmail-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Failed to open OAuth popup. Please allow popups and try again.')
      }

      // Wait for OAuth completion (manual input for now)
      console.log('⏳ Waiting for OAuth completion...')
      console.log('📋 When the popup redirects to localhost (and fails to load), copy the authorization code from the terminal logs')
      
      const authCode = await this.waitForAuthCodeFromLogs()
      popup.close() // Close the popup
      console.log('✅ OAuth code received from logs')

      // Exchange code for tokens (secure - via main process)
      const tokenResult = await this.exchangeCodeForTokensSecure(authCode)
      if (!tokenResult.success) {
        throw new Error(`Token exchange failed: ${tokenResult.error}`)
      }
      const tokens = tokenResult.tokens
      console.log('✅ Tokens received')

      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token)
      console.log('✅ User info received:', userInfo.email)

      // Store tokens and user info
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token
      this.userEmail = userInfo.email
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000)

      // Store in localStorage for persistence
      this.saveToStorage()

      return {
        success: true,
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        userEmail: this.userEmail
      }

    } catch (error) {
      console.error('❌ Gmail authentication failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Load saved authentication from storage
   */
  public loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem('gmail-auth')
      if (!stored) return false

      const data = JSON.parse(stored)
      this.accessToken = data.accessToken
      this.refreshToken = data.refreshToken
      this.userEmail = data.userEmail
      this.tokenExpiry = data.tokenExpiry

      // Check if token is still valid
      if (this.isAuthenticated()) {
        console.log('✅ Gmail auth loaded from storage:', this.userEmail)
        return true
      } else {
        console.log('⚠️ Stored Gmail token expired')
        this.clearStorage()
        return false
      }
    } catch (error) {
      console.error('❌ Failed to load Gmail auth from storage:', error)
      return false
    }
  }

  /**
   * Clear authentication and logout
   */
  public logout(): void {
    this.accessToken = null
    this.refreshToken = null
    this.userEmail = null
    this.tokenExpiry = null
    this.clearStorage()
    console.log('👋 Gmail authentication cleared')
  }

  /**
   * Get access token for API calls
   */
  public async getAccessToken(): Promise<string | null> {
    if (this.isAuthenticated()) {
      return this.accessToken
    }

    // Try to refresh token if we have refresh token
    if (this.refreshToken) {
      const refreshed = await this.refreshAccessTokenSecure()
      if (refreshed) {
        return this.accessToken
      }
    }

    return null
  }

  /**
   * Get email threads between agent and client
   */
  public async getEmailHistory(clientEmail: string, maxResults: number = 50): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken()
      if (!accessToken) {
        throw new Error('No valid Gmail access token available')
      }

      // Search for emails involving the client
      const query = `from:${clientEmail} OR to:${clientEmail}`
      
      // Get list of threads
      const threadsResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!threadsResponse.ok) {
        const error = await threadsResponse.text()
        throw new Error(`Gmail API error: ${threadsResponse.status} ${error}`)
      }

      const threadsData = await threadsResponse.json()
      
      if (!threadsData.threads || threadsData.threads.length === 0) {
        return []
      }

      // Get detailed thread data
      const detailedThreads = await Promise.all(
        threadsData.threads.map(async (thread: any) => {
          const threadResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          )

          if (threadResponse.ok) {
            const threadData = await threadResponse.json()
            return this.formatEmailThread(threadData, clientEmail)
          }
          return null
        })
      )

      return detailedThreads.filter(thread => thread !== null)

    } catch (error) {
      console.error('❌ Failed to fetch email history:', error)
      throw error
    }
  }

  /**
   * Send email using Gmail API
   */
  public async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken()
      if (!accessToken) {
        throw new Error('No valid Gmail access token available')
      }

      // Create email message
      const message = this.createEmailMessage(to, subject, htmlBody)
      
      // Send via Gmail API
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: message
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Gmail API error: ${response.status} ${error}`)
      }

      const result = await response.json()
      console.log('✅ Email sent via Gmail API:', result.id)
      return true

    } catch (error) {
      console.error('❌ Failed to send email via Gmail:', error)
      throw error
    }
  }

  /**
   * Format Gmail thread data for display
   */
  private formatEmailThread(threadData: any, clientEmail: string): any {
    try {
      const messages = threadData.messages || []
      const lastMessage = messages[messages.length - 1]
      
      if (!lastMessage) return null

      // Extract subject from the first message
      const firstMessage = messages[0]
      const subjectHeader = firstMessage.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')
      const subject = subjectHeader?.value || 'No Subject'

      // Extract snippet and get thread info
      const snippet = lastMessage.snippet || ''
      const threadId = threadData.id

      // Get last message timestamp
      const lastTimestamp = parseInt(lastMessage.internalDate)
      const lastDate = new Date(lastTimestamp)

      // Count messages and determine participants
      const messageCount = messages.length
      const participants = new Set()
      
      messages.forEach((msg: any) => {
        const fromHeader = msg.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')
        const toHeader = msg.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'to')
        
        if (fromHeader?.value) {
          const fromEmail = this.extractEmailFromHeader(fromHeader.value)
          participants.add(fromEmail)
        }
        if (toHeader?.value) {
          const toEmails = this.extractEmailsFromHeader(toHeader.value)
          toEmails.forEach((email: string) => participants.add(email))
        }
      })

      // Format messages for detailed view
      const formattedMessages = messages.map((msg: any) => {
        const fromHeader = msg.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')
        const dateHeader = msg.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'date')
        
        const senderEmail = this.extractEmailFromHeader(fromHeader?.value || '')
        const senderName = this.extractNameFromHeader(fromHeader?.value || '')
        const timestamp = parseInt(msg.internalDate)
        const date = new Date(timestamp)

        // Extract email body
        let body = msg.snippet || ''
        if (msg.payload?.body?.data) {
          body = this.decodeBase64(msg.payload.body.data)
        } else if (msg.payload?.parts) {
          // Handle multipart messages
          const textPart = this.findTextPart(msg.payload.parts)
          if (textPart && textPart.body?.data) {
            body = this.decodeBase64(textPart.body.data)
          }
        }

        // Clean HTML from email body
        body = this.stripHtmlTags(body)

        return {
          id: msg.id,
          sender: senderName || senderEmail,
          senderEmail,
          timestamp: date.toISOString(),
          content: body,
          isFromClient: senderEmail.toLowerCase() === clientEmail.toLowerCase()
        }
      })

      return {
        id: threadId,
        subject,
        snippet,
        messageCount,
        lastMessage: this.formatRelativeTime(lastDate),
        lastTimestamp: lastDate.toISOString(),
        participants: Array.from(participants),
        messages: formattedMessages
      }

    } catch (error) {
      console.error('Error formatting email thread:', error)
      return null
    }
  }

  private extractEmailFromHeader(header: string): string {
    const match = header.match(/<([^>]+)>/)
    return match ? match[1] : header.split(' ')[0]
  }

  private extractEmailsFromHeader(header: string): string[] {
    const emails = header.split(',').map(email => this.extractEmailFromHeader(email.trim()))
    return emails
  }

  private extractNameFromHeader(header: string): string {
    const match = header.match(/^([^<]+)</)
    return match ? match[1].trim().replace(/['"]/g, '') : ''
  }

  private decodeBase64(data: string): string {
    try {
      // Gmail API returns base64url encoded data
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
      const padding = '='.repeat((4 - base64.length % 4) % 4)
      return decodeURIComponent(escape(atob(base64 + padding)))
    } catch (error) {
      console.error('Error decoding base64 email content:', error)
      return data
    }
  }

  private findTextPart(parts: any[]): any {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
        return part
      }
      if (part.parts) {
        const found = this.findTextPart(part.parts)
        if (found) return found
      }
    }
    return null
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  private stripHtmlTags(html: string): string {
    try {
      // Remove HTML tags and decode HTML entities
      let text = html
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Replace common HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        // Replace multiple whitespace with single space
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace
        .trim()

      return text
    } catch (error) {
      console.error('Error stripping HTML tags:', error)
      return html
    }
  }

  // Private methods

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: 'http://localhost:8080/oauth/callback', // Use localhost for Electron
      response_type: 'code',
      scope: GOOGLE_API_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  private async waitForAuthCode(popup: Window): Promise<string> {
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          reject(new Error('OAuth popup was closed by user'))
        }
      }, 1000)

      // Check popup URL changes (primary method for Electron)
      const urlChecker = setInterval(() => {
        try {
          const url = popup.location.href
          console.log('🔍 Checking popup URL:', url)
          
          // Check if we've been redirected to localhost (our callback)
          if (url.includes('localhost:8080/oauth/callback')) {
            const urlParams = new URLSearchParams(url.split('?')[1])
            const code = urlParams.get('code')
            const error = urlParams.get('error')
            
            if (code) {
              console.log('✅ Authorization code received')
              clearInterval(urlChecker)
              clearInterval(checkClosed)
              popup.close()
              resolve(code)
              return
            } else if (error) {
              console.error('❌ OAuth error:', error)
              clearInterval(urlChecker)
              clearInterval(checkClosed)
              popup.close()
              reject(new Error(`OAuth error: ${error}`))
              return
            }
          }
        } catch (e) {
          // Cross-origin error - expected during OAuth flow
          // This is normal and happens while navigating through Google's OAuth pages
        }
      }, 200) // Check more frequently

      // Fallback: Message handler (if supported)
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== 'https://accounts.google.com') return

        if (event.data && event.data.type === 'oauth-code') {
          clearInterval(urlChecker)
          clearInterval(checkClosed)
          window.removeEventListener('message', messageHandler)
          popup.close()
          resolve(event.data.code)
        } else if (event.data && event.data.type === 'oauth-error') {
          clearInterval(urlChecker)
          clearInterval(checkClosed)
          window.removeEventListener('message', messageHandler)
          popup.close()
          reject(new Error(event.data.error))
        }
      }

      window.addEventListener('message', messageHandler)
    })
  }

  /**
   * Secure token exchange via main process (keeps client secret secure)
   */
  private async exchangeCodeForTokensSecure(code: string): Promise<{ success: boolean; tokens?: any; error?: string }> {
    if (window.electronAPI && window.electronAPI.exchangeOAuthTokens) {
      return await window.electronAPI.exchangeOAuthTokens(code)
    } else {
      // Fallback to less secure renderer process exchange
      console.warn('⚠️ Using fallback token exchange in renderer process (less secure)')
      try {
        const tokens = await this.exchangeCodeForTokens(code)
        return { success: true, tokens }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
  }

  /**
   * Legacy token exchange (fallback only - less secure)
   */
  private async exchangeCodeForTokens(code: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '', // Note: Less secure - client secret in renderer
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:8080/oauth/callback'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token exchange failed: ${response.status} ${error}`)
    }

    return response.json()
  }

  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Secure token refresh via main process (keeps client secret secure)
   */
  private async refreshAccessTokenSecure(): Promise<boolean> {
    try {
      if (!this.refreshToken) return false

      if (window.electronAPI && window.electronAPI.refreshOAuthTokens) {
        const result = await window.electronAPI.refreshOAuthTokens(this.refreshToken)
        
        if (result.success) {
          this.accessToken = result.tokens.access_token
          this.tokenExpiry = Date.now() + (result.tokens.expires_in * 1000)
          this.saveToStorage()
          console.log('✅ Gmail access token refreshed securely')
          return true
        } else {
          console.error('❌ Secure token refresh failed:', result.error)
          return false
        }
      } else {
        // Fallback to less secure renderer process refresh
        console.warn('⚠️ Using fallback token refresh in renderer process (less secure)')
        return await this.refreshAccessToken()
      }
    } catch (error) {
      console.error('❌ Failed to refresh Gmail token securely:', error)
      return false
    }
  }

  /**
   * Legacy token refresh (fallback only - less secure)
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) return false

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '', // Note: Less secure - client secret in renderer
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) return false

      const tokens = await response.json()
      this.accessToken = tokens.access_token
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000)
      this.saveToStorage()

      console.log('✅ Gmail access token refreshed')
      return true

    } catch (error) {
      console.error('❌ Failed to refresh Gmail token:', error)
      return false
    }
  }

  private createEmailMessage(to: string, subject: string, htmlBody: string): string {
    const fromEmail = this.userEmail || 'noreply@example.com'
    
    const email = [
      `To: ${to}`,
      `From: ${fromEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody
    ].join('\r\n')

    // Base64 encode the email
    return btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }

  private saveToStorage(): void {
    const data = {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      userEmail: this.userEmail,
      tokenExpiry: this.tokenExpiry
    }
    localStorage.setItem('gmail-auth', JSON.stringify(data))
  }

  private clearStorage(): void {
    localStorage.removeItem('gmail-auth')
  }

  /**
   * Alternative method to get auth code from server logs
   * This works around Cross-Origin issues in Electron
   */
  private async waitForAuthCodeFromLogs(): Promise<string> {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 10 // Check for 10 seconds
      
      console.log('🔍 Starting to wait for OAuth code from logs...')
      
      const checkForCode = async () => {
        attempts++
        console.log(`🔍 Checking for OAuth code (attempt ${attempts}/${maxAttempts})`)
        
        // Check if we can access the authorization code through Electron's main process
        if (window.electronAPI && window.electronAPI.getLastOAuthCode) {
          try {
            const code = await window.electronAPI.getLastOAuthCode()
            if (code) {
              console.log('✅ Found OAuth code via Electron IPC:', code.substring(0, 20) + '...')
              resolve(code)
              return
            }
          } catch (err) {
            console.log('⚠️ Error checking for OAuth code:', err)
          }
        }
        
        if (attempts >= maxAttempts) {
          console.log('⏰ Timeout reached, showing manual input modal')
          // Fallback: Ask user to enter code manually via a custom modal
          try {
            const manualCode = await this.showCodeInputModal()
            resolve(manualCode)
          } catch (modalError) {
            reject(modalError)
          }
          return
        }
        
        setTimeout(checkForCode, 1000)
      }
      
      // Start checking immediately for faster response
      checkForCode()
    })
  }

  private async showCodeInputModal(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a simple modal overlay
      const modalOverlay = document.createElement('div')
      modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `
      
      const modal = document.createElement('div')
      modal.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      `
      
      modal.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #333;">🔑 Gmail OAuth Complete!</h3>
        <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
          Look in your terminal for a line like:<br>
          <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px; display: block; margin: 10px 0; word-break: break-all;">
            ⚠️ Failed to load URL: http://localhost:8080/oauth/callback?code=4%2F0AVMBsJiK...
          </code>
          Copy the entire code part (after "code=" including any %2F characters):
        </p>
        <input 
          type="text" 
          id="oauth-code-input" 
          placeholder="4%2F0AVMBsJiKPo1Q0A9DqFfcOFdwS7DJ80tQv0sZTCjPCCD5AyL0d9Zc2I5EpKyAoUevYFIX_g"
          style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin: 0 0 20px 0; font-family: monospace; font-size: 12px;"
        />
        <div style="text-align: right;">
          <button id="oauth-cancel" style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 5px; cursor: pointer;">Cancel</button>
          <button id="oauth-submit" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 5px; cursor: pointer;">Submit</button>
        </div>
      `
      
      modalOverlay.appendChild(modal)
      document.body.appendChild(modalOverlay)
      
      const input = document.getElementById('oauth-code-input') as HTMLInputElement
      const submitBtn = document.getElementById('oauth-submit')
      const cancelBtn = document.getElementById('oauth-cancel')
      
      input.focus()
      
      const cleanup = () => {
        document.body.removeChild(modalOverlay)
      }
      
      submitBtn?.addEventListener('click', () => {
        const code = input.value.trim()
        if (code) {
          cleanup()
          resolve(decodeURIComponent(code))
        } else {
          alert('Please enter the authorization code')
        }
      })
      
      cancelBtn?.addEventListener('click', () => {
        cleanup()
        reject(new Error('OAuth cancelled by user'))
      })
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          submitBtn?.click()
        }
      })
    })
  }
}

// Export singleton instance
export const gmailAuth = new GmailAuthService()

// Load any existing authentication on module load
gmailAuth.loadFromStorage()