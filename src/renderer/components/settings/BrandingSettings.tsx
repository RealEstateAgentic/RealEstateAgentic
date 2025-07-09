/**
 * Branding Settings Component
 *
 * Comprehensive branding customization interface for real estate agents
 * and brokerages. Allows customization of logos, colors, fonts, and
 * professional branding elements for documents and presentations.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../lib/firebase/hooks'
import { Button } from '../ui/button'
import {
  AlertCircle,
  Upload,
  Download,
  Eye,
  Palette,
  Type,
  Image,
  Save,
  RefreshCw,
  Copy,
  Trash2,
  Edit,
  Plus,
  Check,
  X,
} from 'lucide-react'

// ========== BRANDING TYPES ==========

interface BrandingProfile {
  id: string
  name: string
  isDefault: boolean
  logo: {
    url?: string
    position: 'left' | 'center' | 'right'
    size: 'small' | 'medium' | 'large'
    opacity: number
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    border: string
  }
  fonts: {
    primary: string
    secondary: string
    headingSize: string
    bodySize: string
    lineHeight: string
  }
  layout: {
    headerHeight: string
    footerHeight: string
    margins: {
      top: string
      right: string
      bottom: string
      left: string
    }
  }
  contactInfo: {
    showPhone: boolean
    showEmail: boolean
    showWebsite: boolean
    showAddress: boolean
    showLicense: boolean
    showMLS: boolean
    customFields: Array<{
      label: string
      value: string
      visible: boolean
    }>
  }
  documentSettings: {
    showWatermark: boolean
    watermarkText: string
    watermarkOpacity: number
    showPageNumbers: boolean
    showTimestamp: boolean
    showDisclaimer: boolean
    disclaimerText: string
  }
}

// ========== MAIN COMPONENT ==========

export const BrandingSettings: React.FC = () => {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<BrandingProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<BrandingProfile | null>(
    null
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<
    'document' | 'letterhead' | 'business-card'
  >('document')

  // ========== PROFILE MANAGEMENT ==========

  const loadProfiles = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const userDataPath = await window.App.system.getUserDataPath()
      const brandingPath = `${userDataPath}/branding`

      const result = await window.App.documents.list(brandingPath)

      if (result.success && result.documents) {
        const profilePromises = result.documents
          .filter((file: string) => file.endsWith('.json'))
          .map(async (file: string) => {
            const filePath = `${brandingPath}/${file}`
            const profileData = await window.App.documents.load(filePath)
            return profileData.success ? profileData.document : null
          })

        const loadedProfiles = (await Promise.all(profilePromises)).filter(
          profile => profile !== null
        ) as BrandingProfile[]

        setProfiles(loadedProfiles)

        // Set default profile as active
        const defaultProfile = loadedProfiles.find(p => p.isDefault)
        if (defaultProfile) {
          setActiveProfile(defaultProfile)
        } else if (loadedProfiles.length > 0) {
          setActiveProfile(loadedProfiles[0])
        }
      }
    } catch (error) {
      console.error('Error loading branding profiles:', error)
      setError('Failed to load branding profiles')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const saveProfile = useCallback(
    async (profile: BrandingProfile) => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const userDataPath = await window.App.system.getUserDataPath()
        const brandingPath = `${userDataPath}/branding`
        const filePath = `${brandingPath}/${profile.id}.json`

        await window.App.documents.save(profile, filePath)

        // Update local state
        setProfiles(prev => {
          const index = prev.findIndex(p => p.id === profile.id)
          if (index >= 0) {
            const updated = [...prev]
            updated[index] = profile
            return updated
          } else {
            return [...prev, profile]
          }
        })

        setActiveProfile(profile)
        setIsEditing(false)
      } catch (error) {
        console.error('Error saving branding profile:', error)
        setError('Failed to save branding profile')
      } finally {
        setIsLoading(false)
      }
    },
    [user]
  )

  const createNewProfile = useCallback(() => {
    const newProfile: BrandingProfile = {
      id: `profile_${Date.now()}`,
      name: 'New Profile',
      isDefault: profiles.length === 0,
      logo: {
        position: 'left',
        size: 'medium',
        opacity: 1,
      },
      colors: {
        primary: '#1f2937',
        secondary: '#6b7280',
        accent: '#3b82f6',
        background: '#ffffff',
        text: '#111827',
        border: '#d1d5db',
      },
      fonts: {
        primary: 'Arial, sans-serif',
        secondary: 'Georgia, serif',
        headingSize: '24px',
        bodySize: '14px',
        lineHeight: '1.6',
      },
      layout: {
        headerHeight: '80px',
        footerHeight: '60px',
        margins: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in',
        },
      },
      contactInfo: {
        showPhone: true,
        showEmail: true,
        showWebsite: true,
        showAddress: true,
        showLicense: true,
        showMLS: true,
        customFields: [],
      },
      documentSettings: {
        showWatermark: false,
        watermarkText: 'CONFIDENTIAL',
        watermarkOpacity: 0.1,
        showPageNumbers: true,
        showTimestamp: true,
        showDisclaimer: true,
        disclaimerText: 'This document contains confidential information.',
      },
    }

    setActiveProfile(newProfile)
    setIsEditing(true)
  }, [profiles])

  const deleteProfile = useCallback(
    async (profileId: string) => {
      if (!user) return

      try {
        const userDataPath = await window.App.system.getUserDataPath()
        const brandingPath = `${userDataPath}/branding`
        const filePath = `${brandingPath}/${profileId}.json`

        await window.App.documents.delete(filePath)

        setProfiles(prev => prev.filter(p => p.id !== profileId))

        if (activeProfile?.id === profileId) {
          const remaining = profiles.filter(p => p.id !== profileId)
          setActiveProfile(remaining.length > 0 ? remaining[0] : null)
        }
      } catch (error) {
        console.error('Error deleting profile:', error)
        setError('Failed to delete profile')
      }
    },
    [user, activeProfile, profiles]
  )

  // ========== LOGO UPLOAD ==========

  const handleLogoUpload = useCallback(
    async (file: File) => {
      if (!activeProfile) return

      try {
        const reader = new FileReader()
        reader.onload = e => {
          const dataUrl = e.target?.result as string
          setActiveProfile(prev =>
            prev
              ? {
                  ...prev,
                  logo: {
                    ...prev.logo,
                    url: dataUrl,
                  },
                }
              : null
          )
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Error uploading logo:', error)
        setError('Failed to upload logo')
      }
    },
    [activeProfile]
  )

  // ========== EFFECTS ==========

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  // ========== RENDER HELPERS ==========

  const ColorPicker: React.FC<{
    label: string
    value: string
    onChange: (color: string) => void
  }> = ({ label, value, onChange }) => (
    <div className="flex items-center space-x-3">
      <label className="text-sm font-medium text-gray-700 min-w-0 flex-1">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  )

  const ProfilePreview: React.FC<{ profile: BrandingProfile }> = ({
    profile,
  }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Preview</h3>
        <div className="flex space-x-2">
          {(['document', 'letterhead', 'business-card'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className={`px-3 py-1 rounded text-sm ${
                previewMode === mode
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div
        className="border rounded-lg p-4 min-h-[300px]"
        style={{
          backgroundColor: profile.colors.background,
          color: profile.colors.text,
          fontFamily: profile.fonts.primary,
        }}
      >
        {/* Header */}
        <div
          className="pb-3 mb-4"
          style={{
            borderBottom: `2px solid ${profile.colors.primary}`,
            height: profile.layout.headerHeight,
          }}
        >
          <div className={`flex items-center justify-${profile.logo.position}`}>
            {profile.logo.url && (
              <img
                src={profile.logo.url}
                alt="Logo"
                className={`${
                  profile.logo.size === 'small'
                    ? 'h-8'
                    : profile.logo.size === 'medium'
                      ? 'h-12'
                      : 'h-16'
                }`}
                style={{ opacity: profile.logo.opacity }}
              />
            )}
            <div className="ml-4">
              <h1
                style={{
                  color: profile.colors.primary,
                  fontSize: profile.fonts.headingSize,
                  fontFamily: profile.fonts.secondary,
                }}
              >
                {user?.displayName || 'Agent Name'}
              </h1>
              <p style={{ color: profile.colors.secondary }}>
                Real Estate Professional
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: profile.fonts.bodySize,
            lineHeight: profile.fonts.lineHeight,
          }}
        >
          {previewMode === 'document' && (
            <div>
              <h2
                style={{ color: profile.colors.primary, marginBottom: '16px' }}
              >
                Document Title
              </h2>
              <p style={{ marginBottom: '12px' }}>
                This is a sample document showing how your branding will appear
                in generated PDFs.
              </p>
              <div
                className="p-3 rounded mb-4"
                style={{
                  backgroundColor: profile.colors.accent + '20',
                  borderLeft: `4px solid ${profile.colors.accent}`,
                }}
              >
                <p>
                  <strong>Highlighted Information:</strong> Important details
                  will be displayed in accent colors.
                </p>
              </div>
            </div>
          )}

          {previewMode === 'letterhead' && (
            <div>
              <p style={{ marginBottom: '12px' }}>
                {new Date().toLocaleDateString()}
              </p>
              <p style={{ marginBottom: '20px' }}>Dear Client,</p>
              <p style={{ marginBottom: '12px' }}>
                This letterhead template shows how your branding will appear on
                official correspondence.
              </p>
              <p style={{ marginBottom: '20px' }}>Professional regards,</p>
              <p>
                <strong>{user?.displayName || 'Agent Name'}</strong>
              </p>
            </div>
          )}

          {previewMode === 'business-card' && (
            <div className="text-center">
              <h2
                style={{ color: profile.colors.primary, marginBottom: '8px' }}
              >
                {user?.displayName || 'Agent Name'}
              </h2>
              <p
                style={{
                  color: profile.colors.secondary,
                  marginBottom: '16px',
                }}
              >
                Licensed Real Estate Professional
              </p>
              <div style={{ fontSize: '12px', color: profile.colors.text }}>
                <p>{user?.email || 'agent@example.com'}</p>
                <p>(555) 123-4567</p>
                <p>Your Brokerage Name</p>
              </div>
            </div>
          )}
        </div>

        {/* Watermark */}
        {profile.documentSettings.showWatermark && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              color: profile.colors.text,
              opacity: profile.documentSettings.watermarkOpacity,
              fontSize: '48px',
              fontWeight: 'bold',
              transform: 'rotate(-45deg)',
              zIndex: 1,
            }}
          >
            {profile.documentSettings.watermarkText}
          </div>
        )}
      </div>
    </div>
  )

  // ========== MAIN RENDER ==========

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Branding Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Customize your professional branding for documents and presentations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={createNewProfile}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Profile</span>
          </Button>
          <Button onClick={loadProfiles} variant="outline" disabled={isLoading}>
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex space-x-1 mb-6">
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => setActiveProfile(profile)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeProfile?.id === profile.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>{profile.name}</span>
            {profile.isDefault && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Default
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Settings */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Basic Settings</h2>
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={() => saveProfile(activeProfile)}
                        size="sm"
                        disabled={isLoading}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        size="sm"
                        variant="outline"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Name
                  </label>
                  <input
                    type="text"
                    value={activeProfile.name}
                    onChange={e =>
                      setActiveProfile(prev =>
                        prev
                          ? {
                              ...prev,
                              name: e.target.value,
                            }
                          : null
                      )
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeProfile.isDefault}
                    onChange={e =>
                      setActiveProfile(prev =>
                        prev
                          ? {
                              ...prev,
                              isDefault: e.target.checked,
                            }
                          : null
                      )
                    }
                    disabled={!isEditing}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Set as default profile
                  </label>
                </div>
              </div>
            </div>

            {/* Logo Settings */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Logo Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Upload
                  </label>
                  <div className="flex items-center space-x-4">
                    {activeProfile.logo.url && (
                      <img
                        src={activeProfile.logo.url}
                        alt="Logo"
                        className="h-12 w-auto border rounded"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleLogoUpload(file)
                      }}
                      disabled={!isEditing}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                        !isEditing ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Logo</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={activeProfile.logo.position}
                      onChange={e =>
                        setActiveProfile(prev =>
                          prev
                            ? {
                                ...prev,
                                logo: {
                                  ...prev.logo,
                                  position: e.target.value as
                                    | 'left'
                                    | 'center'
                                    | 'right',
                                },
                              }
                            : null
                        )
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <select
                      value={activeProfile.logo.size}
                      onChange={e =>
                        setActiveProfile(prev =>
                          prev
                            ? {
                                ...prev,
                                logo: {
                                  ...prev.logo,
                                  size: e.target.value as
                                    | 'small'
                                    | 'medium'
                                    | 'large',
                                },
                              }
                            : null
                        )
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opacity: {Math.round(activeProfile.logo.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={activeProfile.logo.opacity}
                    onChange={e =>
                      setActiveProfile(prev =>
                        prev
                          ? {
                              ...prev,
                              logo: {
                                ...prev.logo,
                                opacity: parseFloat(e.target.value),
                              },
                            }
                          : null
                      )
                    }
                    disabled={!isEditing}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Color Settings */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Color Settings
              </h2>

              <div className="space-y-4">
                <ColorPicker
                  label="Primary Color"
                  value={activeProfile.colors.primary}
                  onChange={color =>
                    setActiveProfile(prev =>
                      prev
                        ? {
                            ...prev,
                            colors: { ...prev.colors, primary: color },
                          }
                        : null
                    )
                  }
                />

                <ColorPicker
                  label="Secondary Color"
                  value={activeProfile.colors.secondary}
                  onChange={color =>
                    setActiveProfile(prev =>
                      prev
                        ? {
                            ...prev,
                            colors: { ...prev.colors, secondary: color },
                          }
                        : null
                    )
                  }
                />

                <ColorPicker
                  label="Accent Color"
                  value={activeProfile.colors.accent}
                  onChange={color =>
                    setActiveProfile(prev =>
                      prev
                        ? {
                            ...prev,
                            colors: { ...prev.colors, accent: color },
                          }
                        : null
                    )
                  }
                />

                <ColorPicker
                  label="Background Color"
                  value={activeProfile.colors.background}
                  onChange={color =>
                    setActiveProfile(prev =>
                      prev
                        ? {
                            ...prev,
                            colors: { ...prev.colors, background: color },
                          }
                        : null
                    )
                  }
                />

                <ColorPicker
                  label="Text Color"
                  value={activeProfile.colors.text}
                  onChange={color =>
                    setActiveProfile(prev =>
                      prev
                        ? {
                            ...prev,
                            colors: { ...prev.colors, text: color },
                          }
                        : null
                    )
                  }
                />
              </div>
            </div>

            {/* Font Settings */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Type className="w-5 h-5 mr-2" />
                Font Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Font (Body Text)
                  </label>
                  <select
                    value={activeProfile.fonts.primary}
                    onChange={e =>
                      setActiveProfile(prev =>
                        prev
                          ? {
                              ...prev,
                              fonts: { ...prev.fonts, primary: e.target.value },
                            }
                          : null
                      )
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Times New Roman, serif">
                      Times New Roman
                    </option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Calibri, sans-serif">Calibri</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Font (Headings)
                  </label>
                  <select
                    value={activeProfile.fonts.secondary}
                    onChange={e =>
                      setActiveProfile(prev =>
                        prev
                          ? {
                              ...prev,
                              fonts: {
                                ...prev.fonts,
                                secondary: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Times New Roman, serif">
                      Times New Roman
                    </option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Calibri, sans-serif">Calibri</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heading Size
                    </label>
                    <select
                      value={activeProfile.fonts.headingSize}
                      onChange={e =>
                        setActiveProfile(prev =>
                          prev
                            ? {
                                ...prev,
                                fonts: {
                                  ...prev.fonts,
                                  headingSize: e.target.value,
                                },
                              }
                            : null
                        )
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="18px">18px</option>
                      <option value="20px">20px</option>
                      <option value="22px">22px</option>
                      <option value="24px">24px</option>
                      <option value="26px">26px</option>
                      <option value="28px">28px</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Size
                    </label>
                    <select
                      value={activeProfile.fonts.bodySize}
                      onChange={e =>
                        setActiveProfile(prev =>
                          prev
                            ? {
                                ...prev,
                                fonts: {
                                  ...prev.fonts,
                                  bodySize: e.target.value,
                                },
                              }
                            : null
                        )
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="10px">10px</option>
                      <option value="12px">12px</option>
                      <option value="14px">14px</option>
                      <option value="16px">16px</option>
                      <option value="18px">18px</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ProfilePreview profile={activeProfile} />

              {/* Actions */}
              <div className="mt-4 flex items-center space-x-2">
                <Button
                  onClick={() => {
                    const newProfile = {
                      ...activeProfile,
                      id: `profile_${Date.now()}`,
                      name: `${activeProfile.name} (Copy)`,
                    }
                    setProfiles(prev => [...prev, newProfile])
                    setActiveProfile(newProfile)
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicate
                </Button>

                <Button
                  onClick={() => deleteProfile(activeProfile.id)}
                  size="sm"
                  variant="outline"
                  disabled={profiles.length <= 1}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Profiles State */}
      {profiles.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No branding profiles
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first branding profile to customize your documents
          </p>
          <Button
            onClick={createNewProfile}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Profile</span>
          </Button>
        </div>
      )}
    </div>
  )
}

export default BrandingSettings
