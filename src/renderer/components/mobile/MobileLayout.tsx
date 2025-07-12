/**
 * Mobile Layout Component
 *
 * Comprehensive mobile-responsive layout optimized for real estate agents
 * working in the field. Features touch-friendly interfaces, optimized
 * workflows, offline capabilities, and essential tools for mobile use.
 */

import React, { useState, useEffect } from 'react'
import {
  Home,
  MessageSquare,
  FileText,
  User,
  Menu,
  X,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Camera,
  Mic,
  Calculator,
} from 'lucide-react'
import { Button } from '../ui/button'
import type { AgentProfile } from '../../../shared/types'

// ========== MOBILE LAYOUT TYPES ==========

interface MobileLayoutProps {
  children: React.ReactNode
  currentUser: AgentProfile | null
  userType: 'agent' | 'client' | null
  navigate: (path: string, params?: any) => void
  goBack: () => void
  onLogout: () => void
}

interface MobileNavigationProps {
  navigate: (path: string) => void
  currentPath: string
  userType: 'agent' | 'client' | null
}

interface QuickActionProps {
  icon: React.ComponentType<any>
  label: string
  onClick: () => void
  color?: string
  disabled?: boolean
}

// ========== MOBILE NAVIGATION COMPONENT ==========

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  navigate,
  currentPath,
  userType,
}) => {
  const getNavigationItems = () => {
    if (userType === 'agent') {
      return [
        {
          path: '/agent-dashboard',
          icon: Home,
          label: 'Home',
          isActive: currentPath === '/agent-dashboard',
        },
        {
          path: '/negotiations',
          icon: MessageSquare,
          label: 'Deals',
          isActive: currentPath.includes('/negotiation'),
        },
        {
          path: '/offers',
          icon: FileText,
          label: 'Offers',
          isActive: currentPath.includes('/offer'),
        },
        {
          path: '/documents',
          icon: FileText,
          label: 'Docs',
          isActive: currentPath.includes('/document'),
        },
        {
          path: '/profile',
          icon: User,
          label: 'Profile',
          isActive: currentPath === '/profile',
        },
      ]
    } else {
      return [
        {
          path: '/client-dashboard',
          icon: Home,
          label: 'Home',
          isActive: currentPath === '/client-dashboard',
        },
        {
          path: '/client-negotiations',
          icon: MessageSquare,
          label: 'My Deals',
          isActive: currentPath.includes('/client-negotiation'),
        },
        {
          path: '/client-documents',
          icon: FileText,
          label: 'My Docs',
          isActive: currentPath.includes('/client-document'),
        },
        {
          path: '/profile',
          icon: User,
          label: 'Profile',
          isActive: currentPath === '/profile',
        },
      ]
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                item.isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ========== MOBILE HEADER COMPONENT ==========

interface MobileHeaderProps {
  title: string
  subtitle?: string
  onMenuToggle: () => void
  onBack?: () => void
  actions?: React.ReactNode
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  onMenuToggle,
  onBack,
  actions,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        ) : (
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-48">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 truncate max-w-48">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </header>
  )
}

// ========== QUICK ACTION COMPONENT ==========

const QuickAction: React.FC<QuickActionProps> = ({
  icon: Icon,
  label,
  onClick,
  color = 'bg-blue-600',
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center p-4 rounded-xl transition-all ${
        disabled
          ? 'bg-gray-100 text-gray-400'
          : `${color} text-white hover:opacity-90 active:scale-95`
      }`}
    >
      <Icon className="w-6 h-6 mb-2" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

// ========== MOBILE SIDEBAR MENU ==========

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentUser: AgentProfile | null
  userType: 'agent' | 'client' | null
  navigate: (path: string) => void
  onLogout: () => void
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  currentUser,
  userType,
  navigate,
  onLogout,
}) => {
  const menuItems =
    userType === 'agent'
      ? [
          { label: 'Dashboard', path: '/agent-dashboard', icon: Home },
          {
            label: 'Active Negotiations',
            path: '/negotiations',
            icon: MessageSquare,
          },
          { label: 'Create New Offer', path: '/offer-create', icon: FileText },
          {
            label: 'Generate Documents',
            path: '/document-generator',
            icon: FileText,
          },
          {
            label: 'Appraisal Tools',
            path: '/appraisal-scenarios',
            icon: Calculator,
          },
          { label: 'Settings', path: '/settings', icon: User },
        ]
      : [
          { label: 'Dashboard', path: '/client-dashboard', icon: Home },
          {
            label: 'My Negotiations',
            path: '/client-negotiations',
            icon: MessageSquare,
          },
          { label: 'My Documents', path: '/client-documents', icon: FileText },
          { label: 'Settings', path: '/settings', icon: User },
        ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          {currentUser && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{userType}</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="flex-1 py-4">
            {menuItems.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    onClose()
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 py-3 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ========== MAIN MOBILE LAYOUT COMPONENT ==========

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  currentUser,
  userType,
  navigate,
  goBack,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState('/')

  // Update current path (in a real app, this would come from router)
  useEffect(() => {
    setCurrentPath(window.location.pathname || '/')
  }, [])

  const getPageTitle = () => {
    switch (currentPath) {
      case '/agent-dashboard':
        return 'Dashboard'
      case '/client-dashboard':
        return 'My Dashboard'
      case '/negotiations':
        return 'Active Negotiations'
      case '/offers':
        return 'Offers'
      case '/documents':
        return 'Documents'
      case '/offer-create':
        return 'Create Offer'
      case '/document-generator':
        return 'Generate Documents'
      case '/appraisal-scenarios':
        return 'Appraisal Tools'
      default:
        return 'AIgent Pro'
    }
  }

  const getQuickActions = () => {
    if (userType === 'agent') {
      return [
        {
          icon: FileText,
          label: 'New Offer',
          onClick: () => navigate('/offer-create'),
          color: 'bg-blue-600',
        },
        {
          icon: MessageSquare,
          label: 'Call Client',
          onClick: () => {
            if (currentUser && 'phoneNumber' in currentUser) {
              window.open(`tel:${currentUser.phoneNumber}`)
            }
          },
          color: 'bg-green-600',
        },
        {
          icon: Camera,
          label: 'Take Photo',
          onClick: () => {
            // In a real app, this would open the camera
            console.log('Opening camera...')
          },
          color: 'bg-purple-600',
        },
        {
          icon: Mic,
          label: 'Voice Note',
          onClick: () => {
            // In a real app, this would start voice recording
            console.log('Starting voice note...')
          },
          color: 'bg-orange-600',
        },
      ]
    } else {
      return [
        {
          icon: MessageSquare,
          label: 'Contact Agent',
          onClick: () => navigate('/contact-agent'),
          color: 'bg-blue-600',
        },
        {
          icon: FileText,
          label: 'View Docs',
          onClick: () => navigate('/client-documents'),
          color: 'bg-green-600',
        },
      ]
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <MobileHeader
        title={getPageTitle()}
        subtitle={currentUser?.displayName}
        onMenuToggle={() => setSidebarOpen(true)}
        onBack={
          currentPath !== '/agent-dashboard' &&
          currentPath !== '/client-dashboard'
            ? goBack
            : undefined
        }
      />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        userType={userType}
        navigate={navigate}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Quick Actions Floating Button */}
      {currentUser && (userType === 'agent' || userType === 'client') && (
        <div className="fixed bottom-24 right-4 z-40">
          <QuickActionsMenu actions={getQuickActions()} userType={userType} />
        </div>
      )}

      {/* Mobile Navigation */}
      <MobileNavigation
        navigate={navigate}
        currentPath={currentPath}
        userType={userType}
      />
    </div>
  )
}

// ========== QUICK ACTIONS MENU ==========

interface QuickActionsMenuProps {
  actions: Array<{
    icon: React.ComponentType<any>
    label: string
    onClick: () => void
    color: string
  }>
  userType: 'agent' | 'client' | null
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  actions,
  userType,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Action Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <div
                key={index}
                className="flex items-center space-x-3 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
                  {action.label}
                </span>
                <button
                  onClick={() => {
                    action.onClick()
                    setIsOpen(false)
                  }}
                  className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-red-600 text-white'
            : userType === 'agent'
              ? 'bg-blue-600 text-white'
              : 'bg-green-600 text-white'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <span className="text-2xl font-bold">+</span>
        )}
      </button>
    </div>
  )
}

// ========== MOBILE-SPECIFIC COMPONENTS ==========

// Mobile Card Component
export const MobileCard: React.FC<{
  children: React.ReactNode
  className?: string
  onClick?: () => void
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${
        onClick
          ? 'cursor-pointer hover:shadow-md active:scale-[0.98] transition-all'
          : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Mobile Grid Component
export const MobileGrid: React.FC<{
  children: React.ReactNode
  columns?: 1 | 2
  gap?: 'sm' | 'md' | 'lg'
}> = ({ children, columns = 1, gap = 'md' }) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div className={`grid grid-cols-${columns} ${gapClasses[gap]} p-4`}>
      {children}
    </div>
  )
}

// Mobile List Component
export const MobileList: React.FC<{
  items: Array<{
    id: string
    title: string
    subtitle?: string
    icon?: React.ComponentType<any>
    onClick?: () => void
    rightElement?: React.ReactNode
  }>
}> = ({ items }) => {
  return (
    <div className="bg-white">
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <div
            key={item.id}
            className={`flex items-center p-4 ${
              index !== items.length - 1 ? 'border-b border-gray-200' : ''
            } ${item.onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}`}
            onClick={item.onClick}
          >
            {Icon && (
              <div className="mr-3">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-sm text-gray-600 truncate">
                  {item.subtitle}
                </p>
              )}
            </div>
            {item.rightElement && (
              <div className="ml-3">{item.rightElement}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Mobile Button Component
export const MobileButton: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
}> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
}) => {
  const baseClasses =
    'font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100'

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {children}
    </button>
  )
}

export default MobileLayout
