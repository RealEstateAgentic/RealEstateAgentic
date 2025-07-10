import { createRoot } from 'react-dom/client'
import { initializeOpenAI } from '../lib/openai/client'
import { App } from './routes'
import './globals.css'

console.log('Renderer process starting...')
console.log('Environment check:')
console.log('- NODE_ENV:', process.env.NODE_ENV)
console.log('- OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY)
console.log('- OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0)

// Initialize OpenAI client for the renderer process
try {
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey && apiKey.length > 0 && apiKey !== 'undefined') {
    const client = initializeOpenAI({
      apiKey,
      timeout: 30000,
      maxRetries: 3,
      defaultModel: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 4000,
    })
    console.log('✅ OpenAI client initialized successfully')
    console.log('- Client created:', !!client)
  } else {
    console.warn(
      '⚠️  OPENAI_API_KEY not found or empty. Document generation will use fallback content.'
    )
    console.warn('- API Key value:', apiKey || 'undefined')
  }
} catch (error) {
  console.warn('❌ Failed to initialize OpenAI client:', error)
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
