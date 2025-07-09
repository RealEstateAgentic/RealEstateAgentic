/**
 * Mock Authentication Service for Development
 * Used when Firebase environment variables are not configured
 */

export interface MockUser {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
}

export interface MockAgentProfile {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
  role: 'agent'
  licenseNumber: string
  brokerage: string
  phoneNumber: string
  specialties: string[]
  yearsExperience: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Mock data store
const mockUsers: { [email: string]: MockUser & { password: string } } = {}
const mockAgentProfiles: { [uid: string]: MockAgentProfile } = {}

/**
 * Mock agent registration
 */
export const mockRegisterAgent = async (
  registrationData: any
): Promise<MockAgentProfile> => {
  const { email, password, displayName, ...agentDetails } = registrationData

  // Check if user already exists
  if (mockUsers[email]) {
    throw new Error('User already exists')
  }

  const uid = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Create mock user
  mockUsers[email] = {
    uid,
    email,
    displayName,
    emailVerified: true,
    password,
  }

  // Create mock agent profile
  const agentProfile: MockAgentProfile = {
    uid,
    email,
    displayName,
    emailVerified: true,
    role: 'agent',
    licenseNumber: agentDetails.licenseNumber || 'MOCK-LICENSE-001',
    brokerage: agentDetails.brokerage || 'Mock Realty',
    phoneNumber: agentDetails.phoneNumber || '(555) 123-4567',
    specialties: agentDetails.specialties || ['Residential', 'Commercial'],
    yearsExperience: agentDetails.yearsExperience || 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockAgentProfiles[uid] = agentProfile

  return agentProfile
}

/**
 * Mock agent sign in
 */
export const mockSignInAgent = async (
  email: string,
  password: string
): Promise<MockAgentProfile> => {
  const user = mockUsers[email]

  if (!user) {
    throw new Error('Agent profile not found')
  }

  if (user.password !== password) {
    throw new Error('Invalid password')
  }

  const agentProfile = mockAgentProfiles[user.uid]

  if (!agentProfile) {
    throw new Error('Agent profile not found')
  }

  if (!agentProfile.isActive) {
    throw new Error('Agent account is deactivated')
  }

  return agentProfile
}

/**
 * Check if Firebase is available
 */
export const isFirebaseAvailable = (): boolean => {
  return !!(
    import.meta.env?.VITE_FIREBASE_API_KEY &&
    import.meta.env?.VITE_FIREBASE_PROJECT_ID
  )
}

/**
 * Create default mock agent for testing
 */
export const createDefaultMockAgent = () => {
  const email = 'andrew.shindyapin+agent@gauntlet.ai'
  const password = 'password123'

  if (!mockUsers[email]) {
    mockRegisterAgent({
      email,
      password,
      displayName: 'Andrew Shindyapin',
      licenseNumber: 'CA-MOCK-001',
      brokerage: 'Gauntlet Realty',
      phoneNumber: '(555) 123-4567',
      specialties: ['Luxury Homes', 'Investment Properties'],
      yearsExperience: 8,
    }).catch(console.error)
  }
}

// Initialize default mock agent
if (!isFirebaseAvailable()) {
  createDefaultMockAgent()
  console.log('🚀 Mock authentication initialized')
  console.log('📧 Test agent: andrew.shindyapin+agent@gauntlet.ai')
  console.log('🔑 Password: password123')
}
