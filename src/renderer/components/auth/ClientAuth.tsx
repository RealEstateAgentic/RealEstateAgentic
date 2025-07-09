/**
 * Client Authentication UI Components
 *
 * Comprehensive authentication interface for real estate clients (buyers and sellers)
 * including login, registration, profile management, and property preferences.
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import {
  registerClient,
  signInClient,
  updateClientProfile,
  getClientProfile,
} from '../../../lib/firebase/auth-client'
import { signOutUser } from '../../../lib/firebase/auth'
import type {
  ClientProfile,
  ClientRegistrationData,
} from '../../../shared/types'

// ========== CLIENT LOGIN COMPONENT ==========

interface ClientLoginProps {
  onSuccess: (profile: ClientProfile) => void
  onSwitchToRegister: () => void
  onSwitchToAgent: () => void
}

export const ClientLogin: React.FC<ClientLoginProps> = ({
  onSuccess,
  onSwitchToRegister,
  onSwitchToAgent,
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
      const profile = await signInClient(formData.email, formData.password)
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
        <h1 className="text-2xl font-bold text-gray-900">Client Login</h1>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="your@email.com"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <button
          onClick={onSwitchToRegister}
          className="text-green-600 hover:text-green-800 text-sm underline"
        >
          Don't have an account? Create one
        </button>
        <br />
        <button
          onClick={onSwitchToAgent}
          className="text-gray-600 hover:text-gray-800 text-sm underline"
        >
          Are you an agent? Sign in here
        </button>
      </div>
    </div>
  )
}

// ========== CLIENT REGISTRATION COMPONENT ==========

interface ClientRegistrationProps {
  onSuccess: (profile: ClientProfile) => void
  onSwitchToLogin: () => void
}

export const ClientRegistration: React.FC<ClientRegistrationProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState<ClientRegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    clientType: 'buyer',
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      profileImage: '',
    },
    preferences: {
      propertyTypes: [],
      priceRange: {
        min: 0,
        max: 1000000,
      },
      preferredLocations: [],
      timeframe: 'immediate',
      preApprovalStatus: 'not_started',
      communicationPreference: 'email',
      notificationSettings: {
        email: true,
        sms: false,
        push: true,
      },
    },
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const profile = await registerClient(formData)
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
        ...prev[parent as keyof ClientRegistrationData],
        [field]: value,
      },
    }))
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Create Your Account
        </h1>
        <p className="text-gray-600 mt-2">
          Get started with your real estate journey
        </p>
        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i === step
                    ? 'bg-green-600 text-white'
                    : i < step
                      ? 'bg-green-500 text-white'
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am looking to...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="clientType"
                    value="buyer"
                    checked={formData.clientType === 'buyer'}
                    onChange={e => updateFormData('clientType', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Buy a property</div>
                    <div className="text-sm text-gray-600">
                      Find your dream home
                    </div>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="clientType"
                    value="seller"
                    checked={formData.clientType === 'seller'}
                    onChange={e => updateFormData('clientType', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Sell a property</div>
                    <div className="text-sm text-gray-600">
                      Get the best price
                    </div>
                  </div>
                </label>
              </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Address Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                required
                value={formData.personalInfo.address}
                onChange={e =>
                  updateNestedFormData(
                    'personalInfo',
                    'address',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={formData.personalInfo.city}
                  onChange={e =>
                    updateNestedFormData('personalInfo', 'city', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  required
                  value={formData.personalInfo.state}
                  onChange={e =>
                    updateNestedFormData(
                      'personalInfo',
                      'state',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.personalInfo.zipCode}
                  onChange={e =>
                    updateNestedFormData(
                      'personalInfo',
                      'zipCode',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Preferences
            </h2>

            {formData.clientType === 'buyer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Types of Interest
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'single-family',
                      'condo',
                      'townhouse',
                      'multi-family',
                    ].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.preferences.propertyTypes.includes(
                            type
                          )}
                          onChange={e => {
                            const types = formData.preferences.propertyTypes
                            if (e.target.checked) {
                              updateNestedFormData(
                                'preferences',
                                'propertyTypes',
                                [...types, type]
                              )
                            } else {
                              updateNestedFormData(
                                'preferences',
                                'propertyTypes',
                                types.filter(t => t !== type)
                              )
                            }
                          }}
                          className="mr-2"
                        />
                        {type
                          .replace('-', ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Minimum
                      </label>
                      <input
                        type="number"
                        value={formData.preferences.priceRange.min}
                        onChange={e =>
                          updateNestedFormData('preferences', 'priceRange', {
                            ...formData.preferences.priceRange,
                            min: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Maximum
                      </label>
                      <input
                        type="number"
                        value={formData.preferences.priceRange.max}
                        onChange={e =>
                          updateNestedFormData('preferences', 'priceRange', {
                            ...formData.preferences.priceRange,
                            max: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pre-approval Status
                  </label>
                  <select
                    value={formData.preferences.preApprovalStatus}
                    onChange={e =>
                      updateNestedFormData(
                        'preferences',
                        'preApprovalStatus',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="pre_approved">Pre-approved</option>
                    <option value="cash_buyer">Cash buyer</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeline
              </label>
              <select
                value={formData.preferences.timeframe}
                onChange={e =>
                  updateNestedFormData(
                    'preferences',
                    'timeframe',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="immediate">Immediate (within 1 month)</option>
                <option value="short_term">Short term (1-3 months)</option>
                <option value="medium_term">Medium term (3-6 months)</option>
                <option value="long_term">Long term (6+ months)</option>
                <option value="exploring">Just exploring</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Communication Method
              </label>
              <select
                value={formData.preferences.communicationPreference}
                onChange={e =>
                  updateNestedFormData(
                    'preferences',
                    'communicationPreference',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text message</option>
                <option value="app">App notifications</option>
              </select>
            </div>

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

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 bg-green-600 hover:bg-green-700"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading}
              className="px-6 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          )}
        </div>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-green-600 hover:text-green-800 text-sm underline"
        >
          Already have an account? Sign In
        </button>
      </div>
    </div>
  )
}

// ========== CLIENT PROFILE COMPONENT ==========

interface ClientProfileProps {
  profile: ClientProfile
  onUpdateProfile: (updates: Partial<ClientProfile>) => void
  onLogout: () => void
}

export const ClientProfile: React.FC<ClientProfileProps> = ({
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
      await updateClientProfile(formData)
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">
            {profile.clientType === 'buyer' ? 'Home Buyer' : 'Home Seller'}
          </p>
        </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          ) : (
            <p className="text-gray-900">{profile.personalInfo.phone}</p>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
          <div className="space-y-2">
            <p className="text-gray-900">{profile.personalInfo.address}</p>
            <p className="text-gray-900">
              {profile.personalInfo.city}, {profile.personalInfo.state}{' '}
              {profile.personalInfo.zipCode}
            </p>
          </div>
        </div>

        {profile.clientType === 'buyer' && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Buying Preferences
            </h3>
            <div className="space-y-2">
              <p className="text-gray-900">
                <span className="font-medium">Budget:</span> $
                {profile.preferences.priceRange.min.toLocaleString()} - $
                {profile.preferences.priceRange.max.toLocaleString()}
              </p>
              <p className="text-gray-900">
                <span className="font-medium">Timeline:</span>{' '}
                {profile.preferences.timeframe.replace('_', ' ')}
              </p>
              <p className="text-gray-900">
                <span className="font-medium">Pre-approval:</span>{' '}
                {profile.preferences.preApprovalStatus.replace('_', ' ')}
              </p>
              {profile.preferences.propertyTypes.length > 0 && (
                <p className="text-gray-900">
                  <span className="font-medium">Property Types:</span>{' '}
                  {profile.preferences.propertyTypes.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ========== MAIN AUTH WRAPPER ==========

interface ClientAuthWrapperProps {
  onAuthenticated: (profile: ClientProfile) => void
  onSwitchToAgent: () => void
}

export const ClientAuthWrapper: React.FC<ClientAuthWrapperProps> = ({
  onAuthenticated,
  onSwitchToAgent,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const existingProfile = await getClientProfile()
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

  const handleSuccess = (newProfile: ClientProfile) => {
    setProfile(newProfile)
    onAuthenticated(newProfile)
  }

  const handleLogout = () => {
    setProfile(null)
  }

  const handleUpdateProfile = (updates: Partial<ClientProfile>) => {
    if (profile) {
      const updatedProfile = { ...profile, ...updates }
      setProfile(updatedProfile)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (profile) {
    return (
      <ClientProfile
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
      />
    )
  }

  if (mode === 'login') {
    return (
      <ClientLogin
        onSuccess={handleSuccess}
        onSwitchToRegister={() => setMode('register')}
        onSwitchToAgent={onSwitchToAgent}
      />
    )
  }

  return (
    <ClientRegistration
      onSuccess={handleSuccess}
      onSwitchToLogin={() => setMode('login')}
    />
  )
}

export default ClientAuthWrapper
