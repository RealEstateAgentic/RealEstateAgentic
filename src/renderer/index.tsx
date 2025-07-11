import { createRoot } from 'react-dom/client'
import { initializeGroq } from '../lib/groq/client'
import { App } from './routes'
import './globals.css'

console.log('Renderer process starting...')
console.log('Environment check:')
console.log('- NODE_ENV:', process.env.NODE_ENV)
console.log('- GROQ_API_KEY present:', !!process.env.GROQ_API_KEY)
console.log('- GROQ_API_KEY length:', process.env.GROQ_API_KEY?.length || 0)

// Initialize Groq client for the renderer process
try {
  console.log('🔧 Attempting to initialize Groq client...')
  console.log('- Environment variables available:')
  console.log('  - NODE_ENV:', process.env.NODE_ENV)
  console.log('  - GROQ_API_KEY present:', !!process.env.GROQ_API_KEY)
  console.log('  - GROQ_API_KEY type:', typeof process.env.GROQ_API_KEY)

  const apiKey = process.env.GROQ_API_KEY
  if (
    apiKey &&
    apiKey.length > 0 &&
    apiKey !== 'undefined' &&
    apiKey !== 'null'
  ) {
    console.log('🔑 GROQ_API_KEY found, initializing client...')
    const client = initializeGroq({
      apiKey,
      timeout: 30000,
      maxRetries: 3,
      defaultModel: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 4000,
    })
    console.log('✅ Groq client initialized successfully')
    console.log('- Client created:', !!client)
  } else {
    console.warn(
      '⚠️  GROQ_API_KEY not found or empty. Document generation will use fallback content.'
    )
    console.warn('- API Key value type:', typeof apiKey)
    console.warn('- API Key value:', apiKey ? 'PRESENT' : 'MISSING')
  }
} catch (error) {
  console.warn('❌ Failed to initialize Groq client:', error)
  console.warn(
    '- Error details:',
    error instanceof Error ? error.message : 'Unknown error'
  )
  console.warn('Document generation will use fallback content.')
}

// Initialize React app when DOM is ready
function initializeApp() {
  console.log('Finding root element...')
  const container = document.getElementById('root')

  if (!container) {
    console.error(
      'Root element not found. Available elements:',
      document.body.innerHTML
    )
    throw new Error('Failed to find the root element')
  }

  console.log('Root element found, creating React root...')
  const root = createRoot(container)

  console.log('Rendering App component...')
  root.render(<App />)
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  // DOM is already ready
  initializeApp()
}
