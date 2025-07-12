/**
 * Marketing Landing Page
 * Standalone landing page for unauthenticated users showcasing key features
 */

import { Button } from '../components/ui/button'
import { Logo } from '../components/ui/logo'
import {
  FileText,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Clock,
  Target,
  ArrowRight,
} from 'lucide-react'

interface MarketingLandingProps {
  navigate: (path: string) => void
}

export function MarketingLanding({ navigate }: MarketingLandingProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <Logo className="scale-150" onClick={() => navigate('/')} />
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The AI-powered platform that transforms how real estate agents
            manage clients, generate offers, and close deals. Streamline your
            workflow with intelligent automation.
          </p>
          <Button
            onClick={() => navigate('/auth/agent')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Login or Register
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Powerful Features for Modern Real Estate Agents
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Inspection Report Repair Estimator */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Inspection Report Repair Estimator Generator
              </h3>
              <p className="text-gray-600 mb-4">
                Instantly generate detailed repair estimates from inspection
                reports. Help your clients make informed decisions with
                professional cost breakdowns.
              </p>
              <div className="bg-white rounded-md p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">
                  Feature placeholder:
                </div>
                <div className="bg-gray-200 h-24 rounded flex items-center justify-center text-gray-500">
                  Enter photo here
                </div>
              </div>
            </div>

            {/* Offer Generation Tool */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Offer Generation Tool
              </h3>
              <p className="text-gray-600 mb-4">
                Create compelling offers with AI-powered market analysis and
                negotiation strategies. Generate professional documents in
                minutes, not hours.
              </p>
              <div className="bg-white rounded-md p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">
                  Feature placeholder:
                </div>
                <div className="bg-gray-200 h-24 rounded flex items-center justify-center text-gray-500">
                  Enter photo here
                </div>
              </div>
            </div>

            {/* Seamless Onboarding */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Seamless Onboarding Automation Process
              </h3>
              <p className="text-gray-600 mb-4">
                Automate client onboarding with intelligent forms and document
                collection. Reduce manual work and ensure consistent client
                experiences.
              </p>
              <div className="bg-white rounded-md p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">
                  Feature placeholder:
                </div>
                <div className="bg-gray-200 h-24 rounded flex items-center justify-center text-gray-500">
                  Enter photo here
                </div>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Kanban Board (Client Tracking Ease)
              </h3>
              <p className="text-gray-600 mb-4">
                Visualize your client pipeline with intuitive Kanban boards.
                Track progress from leads to closings with drag-and-drop
                simplicity.
              </p>
              <div className="bg-white rounded-md p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">
                  Feature placeholder:
                </div>
                <div className="bg-gray-200 h-24 rounded flex items-center justify-center text-gray-500">
                  Enter photo here
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Calendar (Deadlines & Events)
              </h3>
              <p className="text-gray-600 mb-4">
                Never miss important deadlines with intelligent calendar
                management. Track contingencies, closings, and client
                appointments in one place.
              </p>
              <div className="bg-white rounded-md p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">
                  Feature placeholder:
                </div>
                <div className="bg-gray-200 h-24 rounded flex items-center justify-center text-gray-500">
                  Enter photo here
                </div>
              </div>
            </div>

            {/* Additional Benefits */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI-Powered Insights
              </h3>
              <p className="text-gray-600 mb-4">
                Leverage artificial intelligence to analyze market trends,
                predict outcomes, and provide data-driven recommendations for
                your clients.
              </p>
              <div className="bg-white rounded-md p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-2">
                  Feature placeholder:
                </div>
                <div className="bg-gray-200 h-24 rounded flex items-center justify-center text-gray-500">
                  Enter photo here
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Why Choose AIgent Pro?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Save Time
              </h3>
              <p className="text-gray-600">
                Automate repetitive tasks and focus on what matters most -
                building relationships and closing deals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Increase Accuracy
              </h3>
              <p className="text-gray-600">
                Reduce errors with AI-powered calculations and automated
                document generation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Grow Your Business
              </h3>
              <p className="text-gray-600">
                Handle more clients efficiently and provide superior service
                that sets you apart.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of agents who are already using AI to streamline
            their workflow and close more deals.
          </p>
          <Button
            onClick={() => navigate('/auth/agent')}
            className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Login or Register
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2024 AIgent Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
