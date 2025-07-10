/**
 * Agent Dashboard Screen
 * Comprehensive dashboard for real estate agents with client overview,
 * quick actions, analytics, and navigation to specialized portals
 */

import { useState } from 'react'
import { Button } from '../components/ui/button'
import {
  Users,
  Home,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  Bell,
  Star,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Plus,
} from 'lucide-react'
import type { AgentProfile } from '../../shared/types'

interface AgentDashboardProps {
  navigate: (path: string) => void
  currentUser: AgentProfile
  onLogout: () => void
}

export function AgentDashboardScreen({
  navigate,
  currentUser,
  onLogout,
}: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'buyers' | 'sellers'>(
    'overview'
  )

  // Mock data for demonstration
  const dashboardStats = {
    totalClients: 24,
    activeBuyers: 12,
    activeSellers: 8,
    pendingOffers: 5,
    closingsThisMonth: 3,
    totalCommissionThisMonth: 45000,
    averageDaysToClose: 28,
    conversionRate: 75,
  }

  const recentActivity = [
    {
      id: 1,
      type: 'offer_accepted',
      client: 'Johnson Family',
      property: '123 Oak Street',
      amount: 450000,
      timestamp: '2 hours ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'new_client',
      client: 'Davis Family',
      property: 'Looking for homes in Downtown',
      amount: 0,
      timestamp: '4 hours ago',
      status: 'info',
    },
    {
      id: 3,
      type: 'listing_created',
      client: 'Chen Family',
      property: '456 Pine Avenue',
      amount: 675000,
      timestamp: '1 day ago',
      status: 'success',
    },
    {
      id: 4,
      type: 'offer_rejected',
      client: 'Martinez Family',
      property: '789 Elm Drive',
      amount: 520000,
      timestamp: '2 days ago',
      status: 'warning',
    },
  ]

  const upcomingTasks = [
    {
      id: 1,
      title: 'Property showing with Johnson Family',
      time: '2:00 PM Today',
      type: 'showing',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Document review for Chen listing',
      time: '10:00 AM Tomorrow',
      type: 'documents',
      priority: 'medium',
    },
    {
      id: 3,
      title: 'Follow up with Davis Family',
      time: '3:00 PM Tomorrow',
      type: 'follow_up',
      priority: 'medium',
    },
    {
      id: 4,
      title: 'Market analysis for Martinez counter-offer',
      time: 'Friday 9:00 AM',
      type: 'analysis',
      priority: 'low',
    },
  ]

  const topClients = [
    {
      id: 1,
      name: 'Johnson Family',
      type: 'buyer',
      status: 'active',
      budget: 500000,
      timeline: 'Next 30 days',
      lastContact: '2 days ago',
      priority: 'high',
    },
    {
      id: 2,
      name: 'Chen Family',
      type: 'seller',
      status: 'listed',
      budget: 675000,
      timeline: 'Next 60 days',
      lastContact: '1 day ago',
      priority: 'high',
    },
    {
      id: 3,
      name: 'Davis Family',
      type: 'buyer',
      status: 'searching',
      budget: 450000,
      timeline: 'Next 90 days',
      lastContact: '3 days ago',
      priority: 'medium',
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'offer_accepted':
        return <DollarSign className="w-4 h-4 text-green-600" />
      case 'new_client':
        return <Users className="w-4 h-4 text-blue-600" />
      case 'listing_created':
        return <Home className="w-4 h-4 text-purple-600" />
      case 'offer_rejected':
        return <DollarSign className="w-4 h-4 text-red-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 border-green-200'
      case 'info':
        return 'bg-blue-100 border-blue-200'
      case 'warning':
        return 'bg-yellow-100 border-yellow-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'showing':
        return <Home className="w-4 h-4" />
      case 'documents':
        return <FileText className="w-4 h-4" />
      case 'follow_up':
        return <Phone className="w-4 h-4" />
      case 'analysis':
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {currentUser.displayName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your real estate business today.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardStats.totalClients}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {dashboardStats.activeBuyers} buyers •{' '}
              {dashboardStats.activeSellers} sellers
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Offers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardStats.pendingOffers}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Avg. {dashboardStats.averageDaysToClose} days to close
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Commission</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${dashboardStats.totalCommissionThisMonth.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              From {dashboardStats.closingsThisMonth} closings this month
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardStats.conversionRate}%
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Above industry average
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {recentActivity.map(activity => (
                  <div
                    key={activity.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${getActivityColor(activity.status)}`}
                  >
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.client}
                      </p>
                      <p className="text-xs text-gray-600">
                        {activity.property}
                      </p>
                      {activity.amount > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                          ${activity.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Tasks
                </h2>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getTaskIcon(task.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-600">{task.time}</p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority} priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="mt-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Top Clients
              </h2>
              <Button variant="outline" size="sm">
                Manage All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topClients.map(client => (
                <button
                  key={client.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer w-full text-left"
                  onClick={() =>
                    navigate(
                      client.type === 'buyer'
                        ? '/buyers-portal'
                        : '/sellers-portal'
                    )
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{client.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${client.type === 'buyer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                    >
                      {client.type}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Budget: ${client.budget.toLocaleString()}</p>
                    <p>Timeline: {client.timeline}</p>
                    <p>Last contact: {client.lastContact}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(client.priority)}`}
                    >
                      {client.priority} priority
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => navigate('/buyers-portal')}
              >
                <Users className="w-6 h-6 mb-2 text-green-600" />
                <span className="text-sm">Add Buyer</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => navigate('/sellers-portal')}
              >
                <Home className="w-6 h-6 mb-2 text-blue-600" />
                <span className="text-sm">Add Listing</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => {
                  alert(
                    'Opening document generation interface. This would provide access to all AI-powered document creation tools including cover letters, analysis reports, and negotiation strategies.'
                  )
                  // TODO: Navigate to documents interface or open modal
                }}
              >
                <FileText className="w-6 h-6 mb-2 text-purple-600" />
                <span className="text-sm">Generate Document</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => {
                  alert(
                    'Opening market analysis dashboard. This would display AI-generated market insights, trends, and comparative market analysis for your area.'
                  )
                  // TODO: Navigate to market analysis interface
                }}
              >
                <TrendingUp className="w-6 h-6 mb-2 text-orange-600" />
                <span className="text-sm">Market Analysis</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
