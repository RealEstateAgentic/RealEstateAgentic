/**
 * Offer Form Components
 *
 * Comprehensive form components for creating buyer offers and seller counter-offers
 * with validation, property details, financial terms, contingencies, and real-time
 * market data integration.
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import {
  createOffer,
  updateOffer,
  getOffer,
} from '../../lib/firebase/collections/offers'
import { MockMarketDataService } from '../../lib/openai/services/mock-market-data'
import type {
  Offer,
  OfferContingency,
  OfferType,
} from '../../shared/types/offers'
import type { AgentProfile, ClientProfile } from '../../shared/types'

// ========== OFFER FORM TYPES ==========

interface OfferFormProps {
  type: OfferType
  existingOffer?: Offer
  agentProfile: AgentProfile
  clientProfile: ClientProfile
  propertyDetails: PropertyDetails
  onSuccess: (offer: Offer) => void
  onCancel: () => void
}

interface PropertyDetails {
  address: string
  listPrice: number
  squareFootage: number
  bedrooms: number
  bathrooms: number
  yearBuilt: number
  propertyType: string
  description: string
  features: string[]
  daysOnMarket: number
  mlsNumber?: string
  photos?: string[]
}

interface OfferFormData {
  purchasePrice: number
  earnestMoney: number
  downPayment: number
  loanAmount: number
  closingDate: string
  possessionDate: string
  expirationDate: string
  contingencies: OfferContingency[]
  inclusions: string[]
  exclusions: string[]
  additionalTerms: string
  inspectionPeriod: number
  appraisalContingency: boolean
  financingContingency: boolean
  saleOfHomeContingency: boolean
  escalationClause?: {
    enabled: boolean
    maxPrice: number
    increment: number
  }
}

// ========== MARKET DATA COMPONENT ==========

interface MarketDataDisplayProps {
  property: PropertyDetails
}

const MarketDataDisplay: React.FC<MarketDataDisplayProps> = ({ property }) => {
  const [marketData, setMarketData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const data = await MockMarketDataService.getMarketSummary(
          property.address.split(',')[1]?.trim() || 'Unknown',
          'CA', // Default state
          property.propertyType as any
        )
        setMarketData(data)
      } catch (error) {
        console.error('Failed to fetch market data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()
  }, [property])

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!marketData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Market data temporarily unavailable</p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-blue-900 mb-2">Market Insights</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-blue-800">Market Trend:</span>
          <span className="ml-2 capitalize">{marketData.trend}</span>
        </div>
        <div>
          <span className="font-medium text-blue-800">Days on Market:</span>
          <span className="ml-2">{marketData.daysOnMarket} days</span>
        </div>
        <div>
          <span className="font-medium text-blue-800">Median Price:</span>
          <span className="ml-2">
            ${marketData.medianPrice.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="font-medium text-blue-800">Competition:</span>
          <span className="ml-2 capitalize">{marketData.competition}</span>
        </div>
      </div>
      {marketData.recommendations.length > 0 && (
        <div className="mt-3">
          <p className="font-medium text-blue-800 mb-1">Recommendations:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            {marketData.recommendations
              .slice(0, 2)
              .map((rec: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {rec}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ========== CONTINGENCY SELECTOR ==========

interface ContingencySelectorProps {
  contingencies: OfferContingency[]
  onChange: (contingencies: OfferContingency[]) => void
}

const ContingencySelector: React.FC<ContingencySelectorProps> = ({
  contingencies,
  onChange,
}) => {
  const [customContingency, setCustomContingency] = useState('')

  const standardContingencies = [
    {
      type: 'inspection',
      label: 'Home Inspection',
      description: 'Right to inspect property and request repairs',
    },
    {
      type: 'appraisal',
      label: 'Appraisal',
      description: 'Property must appraise for purchase price',
    },
    {
      type: 'financing',
      label: 'Financing',
      description: 'Contingent on obtaining mortgage approval',
    },
    {
      type: 'sale_of_home',
      label: 'Sale of Current Home',
      description: 'Must sell existing home first',
    },
    {
      type: 'title',
      label: 'Title Review',
      description: 'Clear title required for closing',
    },
    {
      type: 'hoa_review',
      label: 'HOA Review',
      description: 'Review of HOA documents and financials',
    },
  ]

  const toggleContingency = (type: string) => {
    const exists = contingencies.find(c => c.type === type)
    if (exists) {
      onChange(contingencies.filter(c => c.type !== type))
    } else {
      const standard = standardContingencies.find(s => s.type === type)
      if (standard) {
        onChange([
          ...contingencies,
          {
            type: type as any,
            description: standard.description,
            deadline: '',
            status: 'pending',
          },
        ])
      }
    }
  }

  const addCustomContingency = () => {
    if (customContingency.trim()) {
      onChange([
        ...contingencies,
        {
          type: 'custom',
          description: customContingency,
          deadline: '',
          status: 'pending',
        },
      ])
      setCustomContingency('')
    }
  }

  const updateContingencyDeadline = (index: number, deadline: string) => {
    const updated = [...contingencies]
    updated[index].deadline = deadline
    onChange(updated)
  }

  const removeContingency = (index: number) => {
    onChange(contingencies.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          Standard Contingencies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {standardContingencies.map(contingency => (
            <label
              key={contingency.type}
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                contingencies.find(c => c.type === contingency.type)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="checkbox"
                checked={contingencies.some(c => c.type === contingency.type)}
                onChange={() => toggleContingency(contingency.type)}
                className="mt-1 mr-3 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {contingency.label}
                </div>
                <div className="text-sm text-gray-600">
                  {contingency.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {contingencies.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Selected Contingencies
          </h3>
          <div className="space-y-3">
            {contingencies.map((contingency, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {standardContingencies.find(
                      s => s.type === contingency.type
                    )?.label || 'Custom Contingency'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {contingency.description}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={contingency.deadline}
                    onChange={e =>
                      updateContingencyDeadline(index, e.target.value)
                    }
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="Deadline"
                  />
                  <button
                    onClick={() => removeContingency(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Custom Contingency</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={customContingency}
            onChange={e => setCustomContingency(e.target.value)}
            placeholder="Enter custom contingency..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={addCustomContingency}
            disabled={!customContingency.trim()}
            variant="outline"
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}

// ========== MAIN OFFER FORM ==========

export const OfferForm: React.FC<OfferFormProps> = ({
  type,
  existingOffer,
  agentProfile,
  clientProfile,
  propertyDetails,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<OfferFormData>({
    purchasePrice: existingOffer?.purchasePrice || propertyDetails.listPrice,
    earnestMoney:
      existingOffer?.earnestMoney ||
      Math.round(propertyDetails.listPrice * 0.01),
    downPayment:
      existingOffer?.downPayment || Math.round(propertyDetails.listPrice * 0.2),
    loanAmount:
      existingOffer?.loanAmount || Math.round(propertyDetails.listPrice * 0.8),
    closingDate:
      existingOffer?.closingDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    possessionDate:
      existingOffer?.possessionDate ||
      new Date(Date.now() + 32 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    expirationDate:
      existingOffer?.expirationDate ||
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    contingencies: existingOffer?.contingencies || [],
    inclusions: existingOffer?.inclusions || [],
    exclusions: existingOffer?.exclusions || [],
    additionalTerms: existingOffer?.additionalTerms || '',
    inspectionPeriod: existingOffer?.inspectionPeriod || 10,
    appraisalContingency: existingOffer?.appraisalContingency || true,
    financingContingency: existingOffer?.financingContingency || true,
    saleOfHomeContingency: existingOffer?.saleOfHomeContingency || false,
    escalationClause: existingOffer?.escalationClause || {
      enabled: false,
      maxPrice: propertyDetails.listPrice * 1.1,
      increment: 5000,
    },
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  // Auto-calculate loan amount when price or down payment changes
  useEffect(() => {
    const loanAmount = Math.max(
      0,
      formData.purchasePrice - formData.downPayment
    )
    setFormData(prev => ({ ...prev, loanAmount }))
  }, [formData.purchasePrice, formData.downPayment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
        type,
        status: 'pending',
        agentId: agentProfile.id,
        clientId: clientProfile.id,
        propertyId: `prop-${Date.now()}`, // In real app, this would be actual property ID
        purchasePrice: formData.purchasePrice,
        earnestMoney: formData.earnestMoney,
        downPayment: formData.downPayment,
        loanAmount: formData.loanAmount,
        closingDate: formData.closingDate,
        possessionDate: formData.possessionDate,
        expirationDate: formData.expirationDate,
        contingencies: formData.contingencies,
        inclusions: formData.inclusions,
        exclusions: formData.exclusions,
        additionalTerms: formData.additionalTerms,
        inspectionPeriod: formData.inspectionPeriod,
        appraisalContingency: formData.appraisalContingency,
        financingContingency: formData.financingContingency,
        saleOfHomeContingency: formData.saleOfHomeContingency,
        escalationClause: formData.escalationClause,
        documents: [],
        history: [],
        propertyDetails: {
          address: propertyDetails.address,
          listPrice: propertyDetails.listPrice,
          squareFootage: propertyDetails.squareFootage,
          bedrooms: propertyDetails.bedrooms,
          bathrooms: propertyDetails.bathrooms,
          yearBuilt: propertyDetails.yearBuilt,
          propertyType: propertyDetails.propertyType,
          description: propertyDetails.description,
        },
      }

      let offer: Offer
      if (existingOffer) {
        offer = await updateOffer(existingOffer.id, offerData)
      } else {
        offer = await createOffer(offerData)
      }

      onSuccess(offer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit offer')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: keyof OfferFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addInclusion = (item: string) => {
    if (item.trim() && !formData.inclusions.includes(item)) {
      updateFormData('inclusions', [...formData.inclusions, item])
    }
  }

  const removeInclusion = (item: string) => {
    updateFormData(
      'inclusions',
      formData.inclusions.filter(i => i !== item)
    )
  }

  const addExclusion = (item: string) => {
    if (item.trim() && !formData.exclusions.includes(item)) {
      updateFormData('exclusions', [...formData.exclusions, item])
    }
  }

  const removeExclusion = (item: string) => {
    updateFormData(
      'exclusions',
      formData.exclusions.filter(i => i !== item)
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {type === 'buyer_offer'
            ? 'Submit Buyer Offer'
            : 'Create Counter Offer'}
        </h1>
        <p className="text-gray-600 mt-2">
          {propertyDetails.address} • $
          {propertyDetails.listPrice.toLocaleString()}
        </p>

        {/* Step indicator */}
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Financial Terms
            </h2>

            <MarketDataDisplay property={propertyDetails} />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    required
                    value={formData.purchasePrice}
                    onChange={e =>
                      updateFormData('purchasePrice', parseInt(e.target.value))
                    }
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {formData.purchasePrice !== propertyDetails.listPrice && (
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.purchasePrice > propertyDetails.listPrice
                      ? 'Above'
                      : 'Below'}{' '}
                    list price by $
                    {Math.abs(
                      formData.purchasePrice - propertyDetails.listPrice
                    ).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Earnest Money
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    required
                    value={formData.earnestMoney}
                    onChange={e =>
                      updateFormData('earnestMoney', parseInt(e.target.value))
                    }
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {(
                    (formData.earnestMoney / formData.purchasePrice) *
                    100
                  ).toFixed(1)}
                  % of purchase price
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Down Payment
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    required
                    value={formData.downPayment}
                    onChange={e =>
                      updateFormData('downPayment', parseInt(e.target.value))
                    }
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {(
                    (formData.downPayment / formData.purchasePrice) *
                    100
                  ).toFixed(1)}
                  % down
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.loanAmount}
                    readOnly
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Calculated automatically
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Escalation Clause (Optional)
              </h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.escalationClause?.enabled || false}
                    onChange={e =>
                      updateFormData('escalationClause', {
                        ...formData.escalationClause,
                        enabled: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Enable escalation clause to automatically increase offer to
                    beat competing offers
                  </span>
                </label>

                {formData.escalationClause?.enabled && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={formData.escalationClause?.maxPrice || 0}
                          onChange={e =>
                            updateFormData('escalationClause', {
                              ...formData.escalationClause,
                              maxPrice: parseInt(e.target.value),
                            })
                          }
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Increment Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={formData.escalationClause?.increment || 0}
                          onChange={e =>
                            updateFormData('escalationClause', {
                              ...formData.escalationClause,
                              increment: parseInt(e.target.value),
                            })
                          }
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Timeline & Dates
            </h2>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.closingDate}
                  onChange={e => updateFormData('closingDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Possession Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.possessionDate}
                  onChange={e =>
                    updateFormData('possessionDate', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offer Expiration
                </label>
                <input
                  type="date"
                  required
                  value={formData.expirationDate}
                  onChange={e =>
                    updateFormData('expirationDate', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inspection Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.inspectionPeriod}
                onChange={e =>
                  updateFormData('inspectionPeriod', parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-1">
                Number of days to complete home inspection
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Contingencies
            </h2>

            <ContingencySelector
              contingencies={formData.contingencies}
              onChange={contingencies =>
                updateFormData('contingencies', contingencies)
              }
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Inclusions & Additional Terms
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inclusions
                </label>
                <div className="space-y-2">
                  {formData.inclusions.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-green-50 rounded"
                    >
                      <span className="text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeInclusion(item)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add inclusion..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addInclusion((e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.querySelector(
                          'input[placeholder="Add inclusion..."]'
                        ) as HTMLInputElement
                        if (input) {
                          addInclusion(input.value)
                          input.value = ''
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclusions
                </label>
                <div className="space-y-2">
                  {formData.exclusions.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-red-50 rounded"
                    >
                      <span className="text-sm">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeExclusion(item)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add exclusion..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addExclusion((e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.querySelector(
                          'input[placeholder="Add exclusion..."]'
                        ) as HTMLInputElement
                        if (input) {
                          addExclusion(input.value)
                          input.value = ''
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Terms
              </label>
              <textarea
                rows={4}
                value={formData.additionalTerms}
                onChange={e =>
                  updateFormData('additionalTerms', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional terms or conditions..."
              />
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t">
          <div className="flex space-x-2">
            <Button type="button" onClick={onCancel} variant="outline">
              Cancel
            </Button>

            {step > 1 && (
              <Button
                type="button"
                onClick={() => setStep(step - 1)}
                variant="outline"
              >
                Previous
              </Button>
            )}
          </div>

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Submitting...' : 'Submit Offer'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

// ========== OFFER SUMMARY COMPONENT ==========

interface OfferSummaryProps {
  offer: Offer
  onEdit: () => void
  onDelete: () => void
}

export const OfferSummary: React.FC<OfferSummaryProps> = ({
  offer,
  onEdit,
  onDelete,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'counter_offer':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {offer.propertyDetails.address}
          </h3>
          <p className="text-gray-600">
            {offer.type === 'buyer_offer' ? 'Buyer Offer' : 'Counter Offer'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}
          >
            {offer.status.replace('_', ' ').toUpperCase()}
          </span>
          <div className="flex space-x-1">
            <Button onClick={onEdit} variant="outline" size="sm">
              Edit
            </Button>
            <Button onClick={onDelete} variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Purchase Price</p>
          <p className="text-lg font-semibold text-gray-900">
            ${offer.purchasePrice.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Down Payment</p>
          <p className="text-lg font-semibold text-gray-900">
            ${offer.downPayment.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Closing Date</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(offer.closingDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {offer.contingencies.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Contingencies</p>
          <div className="flex flex-wrap gap-2">
            {offer.contingencies.map((contingency, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
              >
                {contingency.type.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>Created: {new Date(offer.createdAt).toLocaleDateString()}</p>
        <p>Expires: {new Date(offer.expirationDate).toLocaleDateString()}</p>
      </div>
    </div>
  )
}

export default OfferForm
