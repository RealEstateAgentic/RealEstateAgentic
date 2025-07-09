/**
 * Mock data for inspection reports
 * Contains sample inspection report data for development and testing
 */

export interface InspectionReport {
  id: string
  title: string
  address: string
  createdAt: string
  totalCost: number
  content: string
}

/**
 * Sample inspection reports for demonstration
 */
export const mockInspectionReports: Record<string, InspectionReport> = {
  '1': {
    id: '1',
    title: 'Downtown Apartment Inspection',
    address: '123 Main St, Apartment 4B',
    createdAt: '2024-01-15',
    totalCost: 8500,
    content: `# Downtown Apartment Inspection Report

## Property Overview
- **Address**: 123 Main St, Apartment 4B
- **Type**: 2BR/1BA Apartment
- **Square Footage**: 850 sq ft
- **Inspection Date**: January 15, 2024

## Inspection Findings

### Kitchen Issues
| Item | Condition | Repair Needed | Estimated Cost |
|------|-----------|---------------|----------------|
| Cabinets | Poor - Water damage visible | Full replacement | $3,500 |
| Countertops | Fair - Chips and stains | Replacement recommended | $2,200 |
| Appliances | Poor - Non-functional | Complete package needed | $1,800 |
| Flooring | Poor - Warped from moisture | Replace with waterproof | $1,000 |

### Bathroom Assessment
- **Condition**: Minor wear
- **Estimated Cost**: $500

### Overall Property
- **Total Estimated Repair Cost**: $8,500
- **Priority Level**: High - Kitchen requires immediate attention
- **Recommended Timeline**: 2-3 weeks

## Summary
This property requires significant kitchen renovation due to water damage. The bathroom and other areas are in acceptable condition. Investment of $8,500 will bring the property to rental-ready condition.

> **Inspector Notes**: Water damage appears to be from previous tenant. Recommend full kitchen gut before rental.`
  },
  '2': {
    id: '2',
    title: 'Suburban House Inspection',
    address: '456 Oak Avenue',
    createdAt: '2024-01-20',
    totalCost: 12500,
    content: `# Suburban House Inspection Report

## Property Overview
- **Address**: 456 Oak Avenue
- **Type**: 3BR/2BA Single Family Home
- **Square Footage**: 1,850 sq ft
- **Inspection Date**: January 20, 2024

## Inspection Findings

### Master Bathroom Issues
| Item | Condition | Repair Needed | Estimated Cost |
|------|-----------|---------------|----------------|
| Shower/Tub | Poor - Tile cracking, leaks | Complete renovation | $4,200 |
| Vanity | Fair - Outdated, water damage | Replacement needed | $2,800 |
| Flooring | Poor - Water damage | Heated tile installation | $3,500 |
| Plumbing | Poor - Multiple leaks | Complete rough-in update | $2,000 |

### Additional Rooms
- **Guest Bathroom**: Good condition - $0
- **Kitchen**: Excellent condition - $0  
- **Bedrooms**: Good condition - $0
- **Living Areas**: Excellent condition - $0

### Overall Assessment
- **Total Estimated Repair Cost**: $12,500
- **Priority Level**: Medium - Bathroom is isolated issue
- **Recommended Timeline**: 3-4 weeks

## Summary
This property has an isolated issue with the master bathroom that requires complete renovation. The rest of the house is in excellent condition. The $12,500 investment will significantly increase property value and rental potential.

> **Inspector Notes**: Master bathroom shows signs of long-term moisture issues. Rest of house is well-maintained.`
  },
  '3': {
    id: '3',
    title: 'Commercial Space Inspection',
    address: '789 Business Park Dr',
    createdAt: '2024-01-25',
    totalCost: 15000,
    content: `# Commercial Space Inspection Report

## Property Overview
- **Address**: 789 Business Park Dr
- **Type**: Commercial Office Space
- **Square Footage**: 3,200 sq ft
- **Inspection Date**: January 25, 2024

## Inspection Findings

### HVAC System Issues
| Component | Condition | Repair Needed | Estimated Cost |
|-----------|-----------|---------------|----------------|
| Main Unit | Poor - 15+ years old, failing | Complete replacement | $8,000 |
| Ductwork | Fair - Some sections damaged | Partial replacement | $4,500 |
| Electrical Panel | Poor - Undersized for new unit | 220V upgrade required | $1,500 |
| Installation | N/A | Professional installation | $1,000 |

### Other Systems
- **Electrical**: Good condition (except HVAC panel)
- **Plumbing**: Excellent condition
- **Flooring**: Good condition
- **Windows**: Good condition

### Business Impact Analysis
- **Downtime Required**: 2-3 days for installation
- **Seasonal Timing**: Recommend spring/fall installation
- **Energy Savings**: New system will reduce costs by 30%

## Summary
The HVAC system requires complete replacement but this is the only major issue. The $15,000 investment will provide reliable climate control and significant energy savings. All other building systems are in good condition.

> **Inspector Notes**: Current HVAC failure is imminent. Plan replacement before next cooling season.`
  }
} 