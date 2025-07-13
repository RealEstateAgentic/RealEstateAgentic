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
  ]
};

export type DummyData = typeof dummyData; 