import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

import type { registerRoute } from 'lib/electron-router-dom'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

type Route = Parameters<typeof registerRoute>[0]

export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: Route['id']
  query?: Route['query']
}

export interface WindowCreationByIPC {
  channel: string
  window(): BrowserWindowOrNull
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}

// ========== FIREBASE TYPES ==========

// Define Firebase types locally to avoid early initialization
export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
  createdAt: string
}

export interface Property {
  id?: string
  userId: string
  address: string
  propertyType: 'house' | 'apartment' | 'commercial' | 'land'
  purchasePrice: number
  squareFootage: number
  bedrooms?: number
  bathrooms?: number
  yearBuilt?: number
  description?: string
  photos?: string[]
  repairEstimates?: RepairEstimate[]
  createdAt: Date
  updatedAt: Date
}

export interface RepairEstimate {
  id?: string
  propertyId: string
  userId: string
  name: string
  items: RepairItem[]
  totalCost: number
  status: 'draft' | 'completed' | 'approved'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface RepairItem {
  id: string
  category: string
  description: string
  quantity: number
  unitCost: number
  totalCost: number
  priority: 'low' | 'medium' | 'high'
  isCustom: boolean
}

export interface FileUploadResult {
  url: string
  path: string
  fileName: string
  size: number
  contentType: string
  uploadedAt: Date
}

// ========== REPAIR COST CATEGORIES ==========

export const REPAIR_CATEGORIES = {
  STRUCTURAL: 'structural',
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing',
  HVAC: 'hvac',
  ROOFING: 'roofing',
  FLOORING: 'flooring',
  WINDOWS: 'windows',
  DOORS: 'doors',
  KITCHEN: 'kitchen',
  BATHROOM: 'bathroom',
  PAINTING: 'painting',
  LANDSCAPING: 'landscaping',
  APPLIANCES: 'appliances',
  CUSTOM: 'custom',
} as const

export type RepairCategory =
  (typeof REPAIR_CATEGORIES)[keyof typeof REPAIR_CATEGORIES]

export interface RepairCategoryInfo {
  id: RepairCategory
  name: string
  description: string
  averageCostPerSqFt?: number
  commonItems: string[]
}

export const REPAIR_CATEGORY_INFO: Record<RepairCategory, RepairCategoryInfo> =
  {
    [REPAIR_CATEGORIES.STRUCTURAL]: {
      id: REPAIR_CATEGORIES.STRUCTURAL,
      name: 'Structural',
      description: 'Foundation, framing, and load-bearing repairs',
      averageCostPerSqFt: 15,
      commonItems: [
        'Foundation repair',
        'Beam replacement',
        'Joist repair',
        'Column support',
      ],
    },
    [REPAIR_CATEGORIES.ELECTRICAL]: {
      id: REPAIR_CATEGORIES.ELECTRICAL,
      name: 'Electrical',
      description: 'Wiring, outlets, and electrical system upgrades',
      averageCostPerSqFt: 8,
      commonItems: [
        'Rewiring',
        'Panel upgrade',
        'Outlet installation',
        'Light fixtures',
      ],
    },
    [REPAIR_CATEGORIES.PLUMBING]: {
      id: REPAIR_CATEGORIES.PLUMBING,
      name: 'Plumbing',
      description: 'Pipes, fixtures, and water system repairs',
      averageCostPerSqFt: 12,
      commonItems: [
        'Pipe replacement',
        'Fixture installation',
        'Water heater',
        'Leak repair',
      ],
    },
    [REPAIR_CATEGORIES.HVAC]: {
      id: REPAIR_CATEGORIES.HVAC,
      name: 'HVAC',
      description: 'Heating, ventilation, and air conditioning',
      averageCostPerSqFt: 10,
      commonItems: [
        'Ductwork',
        'Furnace replacement',
        'AC installation',
        'Ventilation',
      ],
    },
    [REPAIR_CATEGORIES.ROOFING]: {
      id: REPAIR_CATEGORIES.ROOFING,
      name: 'Roofing',
      description: 'Roof repair and replacement',
      averageCostPerSqFt: 7,
      commonItems: [
        'Shingle replacement',
        'Roof repair',
        'Gutter installation',
        'Flashing',
      ],
    },
    [REPAIR_CATEGORIES.FLOORING]: {
      id: REPAIR_CATEGORIES.FLOORING,
      name: 'Flooring',
      description: 'Floor installation and refinishing',
      averageCostPerSqFt: 9,
      commonItems: [
        'Hardwood installation',
        'Carpet replacement',
        'Tile work',
        'Refinishing',
      ],
    },
    [REPAIR_CATEGORIES.WINDOWS]: {
      id: REPAIR_CATEGORIES.WINDOWS,
      name: 'Windows',
      description: 'Window replacement and repair',
      commonItems: [
        'Window replacement',
        'Window repair',
        'Trim work',
        'Glass replacement',
      ],
    },
    [REPAIR_CATEGORIES.DOORS]: {
      id: REPAIR_CATEGORIES.DOORS,
      name: 'Doors',
      description: 'Door installation and repair',
      commonItems: [
        'Door replacement',
        'Door repair',
        'Hardware installation',
        'Trim work',
      ],
    },
    [REPAIR_CATEGORIES.KITCHEN]: {
      id: REPAIR_CATEGORIES.KITCHEN,
      name: 'Kitchen',
      description: 'Kitchen renovation and repairs',
      commonItems: [
        'Cabinet installation',
        'Countertop replacement',
        'Backsplash',
        'Appliances',
      ],
    },
    [REPAIR_CATEGORIES.BATHROOM]: {
      id: REPAIR_CATEGORIES.BATHROOM,
      name: 'Bathroom',
      description: 'Bathroom renovation and repairs',
      commonItems: [
        'Vanity installation',
        'Tile work',
        'Fixture replacement',
        'Plumbing',
      ],
    },
    [REPAIR_CATEGORIES.PAINTING]: {
      id: REPAIR_CATEGORIES.PAINTING,
      name: 'Painting',
      description: 'Interior and exterior painting',
      averageCostPerSqFt: 2,
      commonItems: [
        'Interior painting',
        'Exterior painting',
        'Trim painting',
        'Primer',
      ],
    },
    [REPAIR_CATEGORIES.LANDSCAPING]: {
      id: REPAIR_CATEGORIES.LANDSCAPING,
      name: 'Landscaping',
      description: 'Outdoor improvements and maintenance',
      commonItems: [
        'Lawn installation',
        'Tree removal',
        'Fence installation',
        'Patio work',
      ],
    },
    [REPAIR_CATEGORIES.APPLIANCES]: {
      id: REPAIR_CATEGORIES.APPLIANCES,
      name: 'Appliances',
      description: 'Appliance installation and repair',
      commonItems: ['Refrigerator', 'Dishwasher', 'Washer/Dryer', 'Stove/Oven'],
    },
    [REPAIR_CATEGORIES.CUSTOM]: {
      id: REPAIR_CATEGORIES.CUSTOM,
      name: 'Custom',
      description: 'Custom repair items not in other categories',
      commonItems: ['Custom work', 'Specialty repairs', 'Unique items'],
    },
  }

// ========== PROPERTY TYPES ==========

export const PROPERTY_TYPES = {
  HOUSE: 'house',
  APARTMENT: 'apartment',
  COMMERCIAL: 'commercial',
  LAND: 'land',
} as const

export type PropertyType = (typeof PROPERTY_TYPES)[keyof typeof PROPERTY_TYPES]

export const PROPERTY_TYPE_INFO: Record<
  PropertyType,
  { name: string; description: string }
> = {
  [PROPERTY_TYPES.HOUSE]: {
    name: 'House',
    description: 'Single-family residential property',
  },
  [PROPERTY_TYPES.APARTMENT]: {
    name: 'Apartment',
    description: 'Multi-unit residential property',
  },
  [PROPERTY_TYPES.COMMERCIAL]: {
    name: 'Commercial',
    description: 'Commercial or business property',
  },
  [PROPERTY_TYPES.LAND]: {
    name: 'Land',
    description: 'Vacant land or lot',
  },
}

// ========== REPAIR PRIORITIES ==========

export const REPAIR_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export type RepairPriority =
  (typeof REPAIR_PRIORITIES)[keyof typeof REPAIR_PRIORITIES]

export const REPAIR_PRIORITY_INFO: Record<
  RepairPriority,
  { name: string; color: string }
> = {
  [REPAIR_PRIORITIES.LOW]: {
    name: 'Low',
    color: 'text-green-600',
  },
  [REPAIR_PRIORITIES.MEDIUM]: {
    name: 'Medium',
    color: 'text-yellow-600',
  },
  [REPAIR_PRIORITIES.HIGH]: {
    name: 'High',
    color: 'text-red-600',
  },
}

// ========== REPAIR ESTIMATE STATUS ==========

export const REPAIR_ESTIMATE_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  APPROVED: 'approved',
} as const

export type RepairEstimateStatus =
  (typeof REPAIR_ESTIMATE_STATUS)[keyof typeof REPAIR_ESTIMATE_STATUS]

export const REPAIR_ESTIMATE_STATUS_INFO: Record<
  RepairEstimateStatus,
  { name: string; color: string }
> = {
  [REPAIR_ESTIMATE_STATUS.DRAFT]: {
    name: 'Draft',
    color: 'text-gray-600',
  },
  [REPAIR_ESTIMATE_STATUS.COMPLETED]: {
    name: 'Completed',
    color: 'text-blue-600',
  },
  [REPAIR_ESTIMATE_STATUS.APPROVED]: {
    name: 'Approved',
    color: 'text-green-600',
  },
}
