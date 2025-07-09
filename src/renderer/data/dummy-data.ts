export const dummyData = {
  // Agent info
  agent: {
    name: "Sarah Johnson",
    office: "Premium Realty Partners",
    phone: "(555) 123-4567",
    email: "sarah.johnson@premiumrealty.com"
  },

  // Urgent To-Dos
  urgentTodos: [
    { id: 1, task: "Follow up with Miller Family on inspection repairs", completed: false },
    { id: 2, task: "Schedule appraisal for 456 Oak Street", completed: false },
    { id: 3, task: "Review and respond to Smith offer on 789 Pine Ave", completed: false },
    { id: 4, task: "Prepare closing documents for Thompson purchase", completed: true },
    { id: 5, task: "Call lender about Davis pre-approval status", completed: false }
  ],

  // Calendar events for the week
  calendarEvents: [
    {
      id: 1,
      title: "Property Showing - 123 Main St",
      time: "9:00 AM",
      date: "2024-01-15",
      type: "showing",
      location: "123 Main St, Anytown"
    },
    {
      id: 2,
      title: "Buyer Consultation - Johnson Family",
      time: "11:30 AM",
      date: "2024-01-15",
      type: "consultation",
      location: "Office"
    },
    {
      id: 3,
      title: "Closing - Davis Property",
      time: "2:00 PM",
      date: "2024-01-15",
      type: "closing",
      location: "Title Company"
    },
    {
      id: 4,
      title: "Home Inspection - 456 Oak St",
      time: "10:00 AM",
      date: "2024-01-16",
      type: "inspection",
      location: "456 Oak St, Anytown"
    },
    {
      id: 5,
      title: "Listing Appointment - Wilson Property",
      time: "3:00 PM",
      date: "2024-01-17",
      type: "listing",
      location: "789 Pine Ave, Anytown"
    }
  ],

  // New leads
  newLeads: [
    {
      id: 1,
      name: "Michael Chen",
      phone: "(555) 234-5678",
      email: "m.chen@email.com",
      type: "buyer",
      source: "Website Form",
      priority: "high",
      receivedDate: "2024-01-14"
    },
    {
      id: 2,
      name: "Jennifer Martinez",
      phone: "(555) 345-6789",
      email: "j.martinez@email.com",
      type: "seller",
      source: "Referral",
      priority: "medium",
      receivedDate: "2024-01-14"
    },
    {
      id: 3,
      name: "Robert Williams",
      phone: "(555) 456-7890",
      email: "r.williams@email.com",
      type: "buyer",
      source: "Zillow",
      priority: "high",
      receivedDate: "2024-01-13"
    }
  ],

  // Active client counts
  activeClients: {
    activeBuyers: 12,
    activeSellers: 8,
    underContract: 5,
    closingThisWeek: 3
  },

  // Key deadlines
  keyDeadlines: [
    {
      id: 1,
      type: "Inspection Contingency",
      client: "Miller Family",
      property: "123 Main St",
      daysRemaining: 1,
      urgency: "critical"
    },
    {
      id: 2,
      type: "Appraisal Contingency",
      client: "Davis Family",
      property: "456 Oak St",
      daysRemaining: 3,
      urgency: "high"
    },
    {
      id: 3,
      type: "Financing Contingency",
      client: "Thompson Family",
      property: "789 Pine Ave",
      daysRemaining: 7,
      urgency: "medium"
    },
    {
      id: 4,
      type: "Title Review",
      client: "Wilson Family",
      property: "321 Elm St",
      daysRemaining: 10,
      urgency: "low"
    }
  ],

  // Recent AI analyses
  recentAIAnalyses: [
    {
      id: 1,
      type: "Inspection Cost Analysis",
      property: "123 Main St",
      client: "Miller Family",
      completedDate: "2024-01-14",
      status: "ready"
    },
    {
      id: 2,
      type: "Market Comparison Report",
      property: "456 Oak St",
      client: "Davis Family",
      completedDate: "2024-01-13",
      status: "ready"
    },
    {
      id: 3,
      type: "Repair Estimate Summary",
      property: "789 Pine Ave",
      client: "Thompson Family",
      completedDate: "2024-01-13",
      status: "ready"
    },
    {
      id: 4,
      type: "Neighborhood Analysis",
      property: "321 Elm St",
      client: "Wilson Family",
      completedDate: "2024-01-12",
      status: "ready"
    }
  ],

  // Market snapshot
  marketSnapshot: {
    zipCode: "12345",
    medianSalePrice: "$485,000",
    averageDaysOnMarket: 28,
    newListingsThisWeek: 15,
    priceChange: "+2.3%",
    inventoryLevel: "Low"
  },

  // Notifications
  notifications: [
    {
      id: 1,
      type: "new_lead",
      message: "New buyer lead from website form",
      timestamp: "2024-01-14T10:30:00Z",
      read: false
    },
    {
      id: 2,
      type: "deadline_reminder",
      message: "Inspection contingency expires tomorrow for Miller Family",
      timestamp: "2024-01-14T09:00:00Z",
      read: false
    },
    {
      id: 3,
      type: "document_received",
      message: "Appraisal report received for 456 Oak St",
      timestamp: "2024-01-13T16:45:00Z",
      read: true
    }
  ],

  // Buyer clients for Kanban board
  buyerClients: [
    // New Leads
    {
      id: 1,
      name: "Michael Chen",
      email: "m.chen@email.com",
      phone: "(555) 234-5678",
      stage: "new_leads",
      subStatus: "to_initiate_contact",
      budget: "$450,000 - $550,000",
      location: "Downtown area",
      leadSource: "Website Form",
      priority: "high",
      dateAdded: "2024-01-14",
      lastContact: null,
      notes: "First-time buyer, pre-approved with local bank"
    },
    {
      id: 2,
      name: "Jennifer Martinez",
      email: "j.martinez@email.com",
      phone: "(555) 345-6789",
      stage: "new_leads",
      subStatus: "awaiting_survey",
      budget: "$600,000 - $700,000",
      location: "Suburban neighborhoods",
      leadSource: "Referral",
      priority: "medium",
      dateAdded: "2024-01-13",
      lastContact: "2024-01-14",
      notes: "Looking for 4BR family home, has 2 kids"
    },
    {
      id: 3,
      name: "Robert Williams",
      email: "r.williams@email.com",
      phone: "(555) 456-7890",
      stage: "new_leads",
      subStatus: "review_survey",
      budget: "$300,000 - $400,000",
      location: "Any area",
      leadSource: "Zillow",
      priority: "high",
      dateAdded: "2024-01-12",
      lastContact: "2024-01-13",
      notes: "Veteran buyer, VA loan pre-approved"
    },
    // Active Search
    {
      id: 4,
      name: "Sarah Johnson",
      email: "s.johnson@email.com",
      phone: "(555) 567-8901",
      stage: "active_search",
      subStatus: "scheduling_showings",
      budget: "$500,000 - $600,000",
      location: "Midtown",
      leadSource: "Past Client Referral",
      priority: "high",
      dateAdded: "2024-01-10",
      lastContact: "2024-01-14",
      notes: "Loves modern condos, flexible timing",
      favoritedProperties: ["123 Main St", "456 Oak Ave"],
      viewedProperties: ["789 Pine Rd", "321 Elm St"]
    },
    {
      id: 5,
      name: "David Thompson",
      email: "d.thompson@email.com",
      phone: "(555) 678-9012",
      stage: "active_search",
      subStatus: "needs_new_listings",
      budget: "$400,000 - $500,000",
      location: "East Side",
      leadSource: "Open House",
      priority: "medium",
      dateAdded: "2024-01-08",
      lastContact: "2024-01-13",
      notes: "Looking for investment property, cash buyer",
      favoritedProperties: ["234 Market St"],
      viewedProperties: ["567 Broadway", "890 First Ave", "345 Second St"]
    },
    {
      id: 6,
      name: "Lisa Brown",
      email: "l.brown@email.com",
      phone: "(555) 789-0123",
      stage: "active_search",
      subStatus: "preparing_offer",
      budget: "$650,000 - $750,000",
      location: "West Hills",
      leadSource: "Website Form",
      priority: "high",
      dateAdded: "2024-01-05",
      lastContact: "2024-01-14",
      notes: "Ready to make offer on 789 Pine Rd",
      favoritedProperties: ["789 Pine Rd"],
      viewedProperties: ["789 Pine Rd", "123 Hill St", "456 Valley Rd"]
    },
    // Under Contract
    {
      id: 7,
      name: "Miller Family",
      email: "miller.family@email.com",
      phone: "(555) 890-1234",
      stage: "under_contract",
      subStatus: "inspection_period",
      budget: "$525,000",
      location: "Northside",
      leadSource: "Referral",
      priority: "critical",
      dateAdded: "2024-01-02",
      lastContact: "2024-01-14",
      notes: "Inspection scheduled for tomorrow",
      contractProperty: "123 Main St",
      contractDate: "2024-01-12",
      inspectionDate: "2024-01-16",
      appraisalDate: "2024-01-20",
      closingDate: "2024-02-15"
    },
    {
      id: 8,
      name: "Davis Family",
      email: "davis.family@email.com",
      phone: "(555) 901-2345",
      stage: "under_contract",
      subStatus: "awaiting_appraisal",
      budget: "$475,000",
      location: "Southside",
      leadSource: "Past Client",
      priority: "high",
      dateAdded: "2024-01-01",
      lastContact: "2024-01-13",
      notes: "Appraisal ordered, waiting for results",
      contractProperty: "456 Oak St",
      contractDate: "2024-01-10",
      inspectionDate: "2024-01-14",
      appraisalDate: "2024-01-18",
      closingDate: "2024-02-12"
    },
    {
      id: 9,
      name: "Wilson Family",
      email: "wilson.family@email.com",
      phone: "(555) 012-3456",
      stage: "under_contract",
      subStatus: "financing_contingency",
      budget: "$380,000",
      location: "Central",
      leadSource: "Website Form",
      priority: "medium",
      dateAdded: "2023-12-28",
      lastContact: "2024-01-12",
      notes: "Waiting for final loan approval",
      contractProperty: "789 Pine Ave",
      contractDate: "2024-01-08",
      inspectionDate: "2024-01-12",
      appraisalDate: "2024-01-16",
      closingDate: "2024-02-08"
    },
    // Closed
    {
      id: 10,
      name: "Anderson Family",
      email: "anderson.family@email.com",
      phone: "(555) 123-4567",
      stage: "closed",
      subStatus: "post_closing_checklist",
      budget: "$425,000",
      location: "Eastside",
      leadSource: "Referral",
      priority: "low",
      dateAdded: "2023-12-15",
      lastContact: "2024-01-10",
      notes: "Closed successfully, follow-up needed",
      contractProperty: "321 Elm St",
      contractDate: "2023-12-20",
      closingDate: "2024-01-10",
      soldPrice: "$420,000"
    },
    {
      id: 11,
      name: "Garcia Family",
      email: "garcia.family@email.com",
      phone: "(555) 234-5678",
      stage: "closed",
      subStatus: "nurture_campaign_active",
      budget: "$350,000",
      location: "Westside",
      leadSource: "Past Client",
      priority: "low",
      dateAdded: "2023-12-10",
      lastContact: "2024-01-05",
      notes: "Happy with purchase, potential referral source",
      contractProperty: "654 Maple Dr",
      contractDate: "2023-12-15",
      closingDate: "2024-01-08",
      soldPrice: "$345,000"
    }
  ],

  // Client communication feed
  clientCommunications: [
    {
      id: 1,
      clientName: "Miller Family",
      type: "email",
      message: "Inspection report received - minor issues found",
      timestamp: "2024-01-14T14:30:00Z",
      priority: "high"
    },
    {
      id: 2,
      clientName: "Lisa Brown",
      type: "call",
      message: "Discussed offer strategy for 789 Pine Rd",
      timestamp: "2024-01-14T11:15:00Z",
      priority: "medium"
    },
    {
      id: 3,
      clientName: "David Thompson",
      type: "text",
      message: "Sent new listing matches in East Side",
      timestamp: "2024-01-14T09:45:00Z",
      priority: "low"
    },
    {
      id: 4,
      clientName: "Sarah Johnson",
      type: "email",
      message: "Confirmed showing appointments for this weekend",
      timestamp: "2024-01-13T16:20:00Z",
      priority: "medium"
    },
    {
      id: 5,
      clientName: "Davis Family",
      type: "call",
      message: "Appraisal scheduled for Thursday",
      timestamp: "2024-01-13T13:10:00Z",
      priority: "high"
    }
  ]
};

export type DummyData = typeof dummyData; 