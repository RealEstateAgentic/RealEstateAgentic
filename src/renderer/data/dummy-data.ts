// Generate dynamic dates for calendar events
const generateDynamicCalendarEvents = () => {
  const today = new Date()
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  
  const getDateOffset = (days: number) => {
    const date = new Date(today)
    date.setDate(today.getDate() + days)
    return formatDate(date)
  }

  return [
    // Today (Day 0)
    {
      id: 1,
      title: "Property Showing - 123 Main St",
      time: "9:00 AM",
      date: getDateOffset(0),
      type: "showing",
      location: "123 Main St, Anytown",
      priority: "high",
      clientType: "buyer",
      clientId: "1"
    },
    {
      id: 2,
      title: "Buyer Consultation - Johnson Family",
      time: "11:30 AM",
      date: getDateOffset(0),
      type: "consultation",
      location: "Office",
      priority: "low",
      clientType: "buyer",
      clientId: "2"
    },
    {
      id: 3,
      title: "Closing - Davis Property",
      time: "2:00 PM",
      date: getDateOffset(0),
      type: "closing",
      location: "Title Company",
      priority: "high",
      clientType: "seller",
      clientId: "1"
    },
    {
      id: 4,
      title: "Call Lender - Wilson Loan",
      time: "4:00 PM",
      date: getDateOffset(0),
      type: "consultation",
      location: "Phone",
      priority: "low",
      clientType: "buyer",
      clientId: "3"
    },
    
    // Tomorrow (Day 1)
    {
      id: 5,
      title: "Miller Inspection",
      time: "10:00 AM",
      date: getDateOffset(1),
      type: "inspection",
      location: "456 Oak St, Anytown",
      priority: "low",
      clientType: "buyer",
      clientId: "1"
    },
    {
      id: 6,
      title: "Open House Prep",
      time: "1:00 PM",
      date: getDateOffset(1),
      type: "listing",
      location: "789 Pine Ave",
      priority: "low",
      clientType: "seller",
      clientId: "2"
    },
    {
      id: 7,
      title: "New Lead Follow-up",
      time: "3:30 PM",
      date: getDateOffset(1),
      type: "consultation",
      location: "Phone",
      priority: "low",
      clientType: "buyer",
      clientId: "4"
    },
    
    // Day 2
    {
      id: 8,
      title: "Listing Appointment - Wilson Property",
      time: "9:00 AM",
      date: getDateOffset(2),
      type: "listing",
      location: "789 Pine Ave, Anytown",
      priority: "high",
      clientType: "seller",
      clientId: "1"
    },
    {
      id: 9,
      title: "Property Showing - Multiple",
      time: "11:00 AM",
      date: getDateOffset(2),
      type: "showing",
      location: "Various locations",
      priority: "low",
      clientType: "buyer",
      clientId: "2"
    },
    {
      id: 10,
      title: "Title Review Meeting",
      time: "2:00 PM",
      date: getDateOffset(2),
      type: "consultation",
      location: "Title Company",
      priority: "high",
      clientType: "seller",
      clientId: "3"
    },
    
    // Day 3
    {
      id: 11,
      title: "Appraisal Appointment",
      time: "9:30 AM",
      date: getDateOffset(3),
      type: "inspection",
      location: "321 Elm St",
      priority: "low",
      clientType: "buyer",
      clientId: "1"
    },
    {
      id: 12,
      title: "Contract Review - Brown Offer",
      time: "1:00 PM",
      date: getDateOffset(3),
      type: "consultation",
      location: "Office",
      priority: "high",
      clientType: "seller",
      clientId: "2"
    },
    {
      id: 13,
      title: "Property Photography",
      time: "3:00 PM",
      date: getDateOffset(3),
      type: "listing",
      location: "567 Broadway",
      priority: "low",
      clientType: "seller",
      clientId: "1"
    },
    
    // Day 4
    {
      id: 14,
      title: "Open House - Pine Ave",
      time: "10:00 AM",
      date: getDateOffset(4),
      type: "listing",
      location: "789 Pine Ave",
      priority: "low",
      clientType: "seller",
      clientId: "2"
    },
    {
      id: 15,
      title: "Buyer Showings - Thompson",
      time: "2:00 PM",
      date: getDateOffset(4),
      type: "showing",
      location: "East Side Properties",
      priority: "low",
      clientType: "buyer",
      clientId: "3"
    },
    {
      id: 16,
      title: "Lender Update Call",
      time: "4:30 PM",
      date: getDateOffset(4),
      type: "consultation",
      location: "Phone",
      priority: "high",
      clientType: "buyer",
      clientId: "1"
    },
    
    // Day 5
    {
      id: 17,
      title: "Weekend Showings",
      time: "10:00 AM",
      date: getDateOffset(5),
      type: "showing",
      location: "Multiple Properties",
      priority: "low",
      clientType: "buyer",
      clientId: "2"
    },
    {
      id: 18,
      title: "Open House - Main St",
      time: "1:00 PM",
      date: getDateOffset(5),
      type: "listing",
      location: "123 Main St",
      priority: "low",
      clientType: "seller",
      clientId: "3"
    },
    
    // Day 6
    {
      id: 19,
      title: "Final Walkthrough - Davis",
      time: "11:00 AM",
      date: getDateOffset(6),
      type: "inspection",
      location: "456 Oak St",
      priority: "high",
      clientType: "buyer",
      clientId: "1"
    },
    {
      id: 20,
      title: "Client Strategy Meeting",
      time: "2:00 PM",
      date: getDateOffset(6),
      type: "consultation",
      location: "Office",
      priority: "low",
      clientType: "seller",
      clientId: "2"
    }
  ]
}

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

  // Calendar events for the week - now dynamic!
  calendarEvents: generateDynamicCalendarEvents(),

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
      priority: "High",
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
      priority: "Medium",
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
      priority: "High",
      dateAdded: "2024-01-12",
      lastContact: "2024-01-13",
      notes: "Veteran buyer, VA loan pre-approved"
    },
    {
      id: 4,
      name: "Damon Bodine",
      email: "damonbodine@gmail.com",
      phone: "(555) 987-6543",
      stage: "new_leads",
      subStatus: "to_initiate_contact",
      budget: "$500,000 - $650,000",
      location: "Austin area",
      leadSource: "Website Form",
      priority: "High",
      dateAdded: "2024-01-15",
      lastContact: null,
      notes: "Software developer, interested in modern condos"
    },
    // Active Search
    {
      id: 5,
      name: "Sarah Johnson",
      email: "s.johnson@email.com",
      phone: "(555) 567-8901",
      stage: "active_search",
      subStatus: "scheduling_showings",
      budget: "$500,000 - $600,000",
      location: "Midtown",
      leadSource: "Past Client Referral",
      priority: "High",
      dateAdded: "2024-01-10",
      lastContact: "2024-01-14",
      notes: "Loves modern condos, flexible timing",
      favoritedProperties: ["123 Main St", "456 Oak Ave"],
      viewedProperties: ["789 Pine Rd", "321 Elm St"]
    },
    {
      id: 6,
      name: "David Kim",
      email: "d.kim@email.com",
      phone: "(555) 678-9012",
      stage: "active_search",
      subStatus: "needs_new_listings",
      budget: "$400,000 - $500,000",
      location: "Westside",
      leadSource: "Website Form",
      priority: "Medium",
      dateAdded: "2024-01-08",
      lastContact: "2024-01-13",
      notes: "Young professional, first-time buyer",
      favoritedProperties: ["987 Cedar Ln"],
      viewedProperties: ["654 Birch Ave", "321 Spruce St"]
    },
    {
      id: 7,
      name: "Lisa Chen",
      email: "l.chen@email.com",
      phone: "(555) 789-0123",
      stage: "active_search",
      subStatus: "preparing_offer",
      budget: "$650,000 - $750,000",
      location: "North Hills",
      leadSource: "Referral",
      priority: "High",
      dateAdded: "2024-01-05",
      lastContact: "2024-01-14",
      notes: "Relocating family, needs quick close",
      favoritedProperties: ["555 Maple Dr", "777 Oak St"],
      viewedProperties: ["444 Pine Ave", "888 Elm Rd"]
    },
    // Under Contract
    {
      id: 8,
      name: "Miller Family",
      email: "miller.family@email.com",
      phone: "(555) 890-1234",
      stage: "under_contract",
      subStatus: "inspection_period",
      budget: "$520,000",
      location: "Eastside",
      leadSource: "Past Client",
      priority: "High",
      dateAdded: "2024-01-03",
      lastContact: "2024-01-13",
      notes: "Contract signed, inspection scheduled",
      contractProperty: "321 Willow St",
      contractDate: "2024-01-10",
      closingDate: "2024-02-15"
    },
    {
      id: 9,
      name: "Anderson Family",
      email: "anderson.family@email.com",
      phone: "(555) 901-2345",
      stage: "under_contract",
      subStatus: "awaiting_appraisal",
      budget: "$475,000",
      location: "Southside",
      leadSource: "Referral",
      priority: "Medium",
      dateAdded: "2024-01-01",
      lastContact: "2024-01-12",
      notes: "Appraisal ordered, waiting for results",
      contractProperty: "789 Poplar Ave",
      contractDate: "2024-01-08",
      closingDate: "2024-02-20"
    },
    {
      id: 10,
      name: "Brown Family",
      email: "brown.family@email.com",
      phone: "(555) 012-3456",
      stage: "under_contract",
      subStatus: "financing_contingency",
      budget: "$380,000",
      location: "Central",
      leadSource: "Walk-in",
      priority: "Medium",
      dateAdded: "2023-12-28",
      lastContact: "2024-01-11",
      notes: "Finalizing loan documents",
      contractProperty: "123 Hickory Ln",
      contractDate: "2024-01-05",
      closingDate: "2024-02-10"
    },
    // Closed
    {
      id: 11,
      name: "Taylor Family",
      email: "taylor.family@email.com",
      phone: "(555) 123-4567",
      stage: "closed",
      subStatus: "post_closing_checklist",
      budget: "$425,000",
      location: "Northwest",
      leadSource: "Social Media",
      priority: "Low",
      dateAdded: "2023-12-15",
      lastContact: "2024-01-10",
      notes: "Successfully closed, happy clients",
      contractProperty: "456 Sycamore St",
      contractDate: "2023-12-20",
      closingDate: "2024-01-12",
      soldPrice: "$420,000"
    },
    {
      id: 12,
      name: "Garcia Family",
      email: "garcia.family@email.com",
      phone: "(555) 234-5678",
      stage: "closed",
      subStatus: "nurture_campaign_active",
      budget: "$350,000",
      location: "Westside",
      leadSource: "Past Client",
      priority: "Low",
      dateAdded: "2023-12-10",
      lastContact: "2024-01-05",
      notes: "Happy with purchase, potential referral source",
      contractProperty: "654 Maple Dr",
      contractDate: "2023-12-15",
      closingDate: "2024-01-08",
      soldPrice: "$345,000"
    }
  ],

  // Seller clients
  sellerClients: [
    {
      id: 1,
      name: "Thompson Family",
      email: "thompson.family@email.com",
      phone: "(555) 111-2222",
      property: "789 Pine Ave",
      stage: "listed",
      listingDate: "2024-01-10",
      askingPrice: "$485,000",
      location: "West Hills",
      notes: "Motivated sellers, open to negotiations"
    },
    {
      id: 2,
      name: "Martinez Property LLC",
      email: "martinez.property@email.com",
      phone: "(555) 222-3333",
      property: "456 Oak Street",
      stage: "appointment_set",
      listingDate: null,
      askingPrice: "TBD",
      location: "Downtown",
      notes: "Investment property, needs staging"
    },
    {
      id: 3,
      name: "Wilson Estate",
      email: "wilson.estate@email.com",
      phone: "(555) 333-4444",
      property: "123 Main Street",
      stage: "under_contract",
      listingDate: "2024-01-05",
      askingPrice: "$520,000",
      location: "Eastside",
      notes: "Estate sale, quick closing preferred"
    },
    {
      id: 4,
      name: "Brown Family",
      email: "brown.family@email.com",
      phone: "(555) 444-5555",
      property: "321 Elm Street",
      stage: "closed",
      listingDate: "2023-12-15",
      askingPrice: "$395,000",
      location: "Southside",
      notes: "Successful sale, happy clients"
    }
  ],

  // Archived buyer clients
  archivedBuyerClients: [
    {
      id: 101,
      name: "Taylor Family",
      email: "taylor.family@email.com",
      phone: "(555) 111-2222",
      stage: "active_search",
      subStatus: "scheduling_showings",
      budget: "$380,000 - $420,000",
      location: "Northeast",
      leadSource: "Referral",
      priority: "medium",
      dateAdded: "2023-12-20",
      lastContact: "2024-01-05",
      notes: "Looking for starter home, first-time buyers",
      favoritedProperties: ["101 Pine St", "202 Oak Ave"],
      viewedProperties: ["303 Maple Dr", "404 Elm St"],
      archivedDate: "2024-01-05T10:30:00Z",
      archivedFromStage: "Active Search"
    },
    {
      id: 102,
      name: "Roberts Family",
      email: "roberts.family@email.com",
      phone: "(555) 333-4444",
      stage: "under_contract",
      subStatus: "inspection_period",
      budget: "$550,000",
      location: "Westside",
      leadSource: "Website Form",
      priority: "high",
      dateAdded: "2023-12-01",
      lastContact: "2024-01-03",
      notes: "Deal fell through after inspection",
      contractProperty: "505 Valley Rd",
      contractDate: "2023-12-15",
      inspectionDate: "2024-01-03",
      archivedDate: "2024-01-03T14:15:00Z",
      archivedFromStage: "Under Contract"
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