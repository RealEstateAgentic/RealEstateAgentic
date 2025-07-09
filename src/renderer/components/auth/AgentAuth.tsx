/**
 * Agent Authentication UI Components
 *
 * Comprehensive authentication interface for real estate agents including
 * login, registration, profile management, and license verification.
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import {
  registerAgent,
  signInAgent,
  updateAgentProfile,
  getAgentProfile,
} from '../../../lib/firebase/auth-agent'
import { signOutUser } from '../../../lib/firebase/auth'
import type { AgentProfile, AgentRegistrationData } from '../../../shared/types'

// ========== AGENT LOGIN COMPONENT ==========

interface AgentLoginProps {
  onSuccess: (profile: AgentProfile) => void
  onSwitchToRegister: () => void
}

export const AgentLogin: React.FC<AgentLoginProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const profile = await signInAgent(formData.email, formData.password)
      onSuccess(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="agent@realestate.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={e =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToRegister}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Don't have an account? Register
        </button>
      </div>
    </div>
  )
}

// ========== AGENT REGISTRATION COMPONENT ==========

interface AgentRegistrationProps {
  onSuccess: (profile: AgentProfile) => void
  onSwitchToLogin: () => void
}

export const AgentRegistration: React.FC<AgentRegistrationProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState<AgentRegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      profileImage: '',
    },
    licenseInfo: {
      licenseNumber: '',
      state: '',
      expirationDate: '',
      brokerageName: '',
      brokerageAddress: '',
      brokeragePhone: '',
      brokerageEmail: '',
      yearsExperience: 0,
      specializations: [],
    },
    preferences: {
      notificationSettings: {
        email: true,
        sms: false,
        push: true,
      },
      workingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'America/New_York',
      },
    },
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const handleCreateAccount = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Transform complex form data into simple AgentRegistrationData structure
      const registrationData: AgentRegistrationData = {
        email: formData.email,
        password: formData.password,
        displayName:
          `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim(),
        licenseNumber: formData.licenseInfo.licenseNumber,
        brokerage: formData.licenseInfo.brokerageName,
        phoneNumber: formData.personalInfo.phone,
        specialties: formData.licenseInfo.specializations,
        yearsExperience: formData.licenseInfo.yearsExperience,
      }

      const profile = await registerAgent(registrationData)
      onSuccess(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof AgentRegistrationData],
        [field]: value,
      },
    }))
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registration</h1>
        <p className="text-gray-600 mt-2">Create your account</p>
        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i === step
                    ? 'bg-blue-600 text-white'
                    : i < step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i}
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Account Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.personalInfo.firstName}
                  onChange={e =>
                    updateNestedFormData(
                      'personalInfo',
                      'firstName',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.personalInfo.lastName}
                  onChange={e =>
                    updateNestedFormData(
                      'personalInfo',
                      'lastName',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => updateFormData('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.personalInfo.phone}
                onChange={e =>
                  updateNestedFormData('personalInfo', 'phone', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => updateFormData('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={e =>
                    updateFormData('confirmPassword', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              License Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.licenseInfo.licenseNumber}
                  onChange={e =>
                    updateNestedFormData(
                      'licenseInfo',
                      'licenseNumber',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  required
                  value={formData.licenseInfo.state}
                  onChange={e =>
                    updateNestedFormData('licenseInfo', 'state', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select State</option>
                  <option value="CA">California</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                  <option value="NY">New York</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="IL">Illinois</option>
                  <option value="OH">Ohio</option>
                  <option value="GA">Georgia</option>
                  <option value="NC">North Carolina</option>
                  <option value="MI">Michigan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Expiration Date
              </label>
              <input
                type="date"
                required
                value={formData.licenseInfo.expirationDate}
                onChange={e =>
                  updateNestedFormData(
                    'licenseInfo',
                    'expirationDate',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brokerage Name
              </label>
              <input
                type="text"
                required
                value={formData.licenseInfo.brokerageName}
                onChange={e =>
                  updateNestedFormData(
                    'licenseInfo',
                    'brokerageName',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                required
                min="0"
                max="50"
                value={formData.licenseInfo.yearsExperience}
                onChange={e =>
                  updateNestedFormData(
                    'licenseInfo',
                    'yearsExperience',
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Settings
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferences.notificationSettings.email}
                    onChange={e =>
                      updateNestedFormData(
                        'preferences',
                        'notificationSettings',
                        {
                          ...formData.preferences.notificationSettings,
                          email: e.target.checked,
                        }
                      )
                    }
                    className="mr-2"
                  />
                  Email notifications
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferences.notificationSettings.sms}
                    onChange={e =>
                      updateNestedFormData(
                        'preferences',
                        'notificationSettings',
                        {
                          ...formData.preferences.notificationSettings,
                          sms: e.target.checked,
                        }
                      )
                    }
                    className="mr-2"
                  />
                  SMS notifications
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferences.notificationSettings.push}
                    onChange={e =>
                      updateNestedFormData(
                        'preferences',
                        'notificationSettings',
                        {
                          ...formData.preferences.notificationSettings,
                          push: e.target.checked,
                        }
                      )
                    }
                    className="mr-2"
                  />
                  Push notifications
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Hours
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.preferences.workingHours.start}
                    onChange={e =>
                      updateNestedFormData('preferences', 'workingHours', {
                        ...formData.preferences.workingHours,
                        start: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.preferences.workingHours.end}
                    onChange={e =>
                      updateNestedFormData('preferences', 'workingHours', {
                        ...formData.preferences.workingHours,
                        end: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Review</h2>
            <p className="text-gray-700">
              Please review the information you have provided.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account Information
                </label>
                <p className="text-gray-900">
                  {formData.personalInfo.firstName}{' '}
                  {formData.personalInfo.lastName}
                </p>
                <p className="text-gray-900">Email: {formData.email}</p>
                <p className="text-gray-900">
                  Phone: {formData.personalInfo.phone}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  License Information
                </label>
                <p className="text-gray-900">
                  License Number: {formData.licenseInfo.licenseNumber}
                </p>
                <p className="text-gray-900">
                  State: {formData.licenseInfo.state}
                </p>
                <p className="text-gray-900">
                  Expiration Date: {formData.licenseInfo.expirationDate}
                </p>
                <p className="text-gray-900">
                  Brokerage: {formData.licenseInfo.brokerageName}
                </p>
                <p className="text-gray-900">
                  Years of Experience: {formData.licenseInfo.yearsExperience}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Preferences
                </label>
                <p className="text-gray-900">
                  Email Notifications:{' '}
                  {formData.preferences.notificationSettings.email
                    ? 'On'
                    : 'Off'}
                </p>
                <p className="text-gray-900">
                  SMS Notifications:{' '}
                  {formData.preferences.notificationSettings.sms ? 'On' : 'Off'}
                </p>
                <p className="text-gray-900">
                  Push Notifications:{' '}
                  {formData.preferences.notificationSettings.push
                    ? 'On'
                    : 'Off'}
                </p>
                <p className="text-gray-900">
                  Working Hours: {formData.preferences.workingHours.start} -{' '}
                  {formData.preferences.workingHours.end}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          {step > 1 && (
            <Button
              type="button"
              onClick={() => setStep(step - 1)}
              variant="outline"
              className="px-6"
            >
              Previous
            </Button>
          )}

          <div className="flex-1" />

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6"
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCreateAccount}
              disabled={loading}
              className="px-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Already have an account? Sign In
        </button>
      </div>
    </div>
  )
}

// ========== AGENT PROFILE COMPONENT ==========

interface AgentProfileProps {
  profile: AgentProfile
  onUpdateProfile: (updates: Partial<AgentProfile>) => void
  onLogout: () => void
}

export const AgentProfile: React.FC<AgentProfileProps> = ({
  profile,
  onUpdateProfile,
  onLogout,
}) => {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(profile)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      await updateAgentProfile(formData)
      onUpdateProfile(formData)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOutUser()
      onLogout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Profile</h1>
        <div className="space-x-2">
          {editing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => {
                  setEditing(false)
                  setFormData(profile)
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditing(true)} variant="outline">
                Edit Profile
              </Button>
              <Button onClick={handleLogout} variant="destructive">
                Logout
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.personalInfo.firstName}
                onChange={e =>
                  setFormData({
                    ...formData,
                    personalInfo: {
                      ...formData.personalInfo,
                      firstName: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.personalInfo.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.personalInfo.lastName}
                onChange={e =>
                  setFormData({
                    ...formData,
                    personalInfo: {
                      ...formData.personalInfo,
                      lastName: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{profile.personalInfo.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <p className="text-gray-900">{profile.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          {editing ? (
            <input
              type="tel"
              value={formData.personalInfo.phone}
              onChange={e =>
                setFormData({
                  ...formData,
                  personalInfo: {
                    ...formData.personalInfo,
                    phone: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900">{profile.personalInfo.phone}</p>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            License Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              <p className="text-gray-900">
                {profile.licenseInfo.licenseNumber}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <p className="text-gray-900">{profile.licenseInfo.state}</p>
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brokerage
            </label>
            <p className="text-gray-900">{profile.licenseInfo.brokerageName}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ========== MAIN AUTH WRAPPER ==========

interface AgentAuthWrapperProps {
  onAuthenticated: (profile: AgentProfile) => void
}

export const AgentAuthWrapper: React.FC<AgentAuthWrapperProps> = ({
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const existingProfile = await getAgentProfile()
        if (existingProfile) {
          setProfile(existingProfile)
          onAuthenticated(existingProfile)
        }
      } catch (err) {
        // Not authenticated, stay on login
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [onAuthenticated])

  const handleSuccess = (newProfile: AgentProfile) => {
    setProfile(newProfile)
    onAuthenticated(newProfile)
  }

  const handleLogout = () => {
    setProfile(null)
  }

  const handleUpdateProfile = (updates: Partial<AgentProfile>) => {
    if (profile) {
      const updatedProfile = { ...profile, ...updates }
      setProfile(updatedProfile)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (profile) {
    return (
      <AgentProfile
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
      />
    )
  }

  if (mode === 'login') {
    return (
      <AgentLogin
        onSuccess={handleSuccess}
        onSwitchToRegister={() => setMode('register')}
      />
    )
  }

  return (
    <AgentRegistration
      onSuccess={handleSuccess}
      onSwitchToLogin={() => setMode('login')}
    />
  )
}

export default AgentAuthWrapper
