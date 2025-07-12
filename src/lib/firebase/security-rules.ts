/**
 * Firebase Security Rules for AIgent Pro Application
 * Defines access control patterns for Firestore collections
 */

export const firestoreSecurityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========== HELPER FUNCTIONS ==========
    
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Get user data from users collection
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    // Check if user has specific role
    function hasRole(role) {
      return isAuthenticated() && getUserData().role == role;
    }
    
    // Check if user is an agent
    function isAgent() {
      return hasRole('agent');
    }
    
    // Check if user is a buyer
    function isBuyer() {
      return hasRole('buyer');
    }
    
    // Check if user is a seller
    function isSeller() {
      return hasRole('seller');
    }
    
    // Check if user is a client (buyer or seller)
    function isClient() {
      return isBuyer() || isSeller();
    }
    
    // Check if user owns the resource
    function isOwner(resourceUserId) {
      return request.auth.uid == resourceUserId;
    }
    
    // Check if agent has access to client's resources
    function hasAgentClientAccess(clientId) {
      return isAgent() && (
        isOwner(clientId) || 
        getUserData().clientIds[clientId] == true
      );
    }
    
    // Check if client has access to their own resources
    function hasClientAccess(resourceClientId) {
      return isClient() && isOwner(resourceClientId);
    }
    
    // Check if user has access to resource (agent or client)
    function hasResourceAccess(agentId, clientId) {
      return isOwner(agentId) || 
             isOwner(clientId) || 
             hasAgentClientAccess(clientId);
    }
    
    // Validate required fields exist
    function hasRequiredFields(fields) {
      return fields.diff(request.resource.data.keys()).size() == 0;
    }
    
    // Check if data is valid offer
    function isValidOffer() {
      return hasRequiredFields([
        'agentId', 'clientId', 'propertyId', 'type', 'status',
        'purchasePrice', 'earnestMoney', 'downPayment', 'loanAmount',
        'offerDate', 'expirationDate', 'closingDate'
      ]) &&
      request.resource.data.type in ['buyer', 'seller'] &&
      request.resource.data.status in ['draft', 'submitted', 'accepted', 'rejected', 'countered', 'expired'] &&
      request.resource.data.purchasePrice is number &&
      request.resource.data.purchasePrice > 0;
    }
    
    // Check if data is valid negotiation
    function isValidNegotiation() {
      return hasRequiredFields([
        'agentId', 'clientId', 'offerId', 'propertyId', 'type', 'status'
      ]) &&
      request.resource.data.type in ['buyer_negotiation', 'seller_negotiation'] &&
      request.resource.data.status in ['active', 'completed', 'stalled', 'cancelled'];
    }
    
    // Check if data is valid document
    function isValidDocument() {
      return hasRequiredFields([
        'agentId', 'clientId', 'title', 'type', 'category', 'status'
      ]) &&
      request.resource.data.status in ['draft', 'review', 'approved', 'final', 'sent', 'archived'];
    }
    
    // ========== USERS COLLECTION ==========
    
    match /users/{userId} {
      // Users can read and write their own profile
      allow read, write: if isAuthenticated() && isOwner(userId);
      
      // Agents can read basic client profiles they work with
      allow read: if isAgent() && 
                     resource.data.role in ['buyer', 'seller'] &&
                     resource.data.agentId == request.auth.uid;
    }
    
    // ========== OFFERS COLLECTIONS ==========
    
    match /offers/{offerId} {
      // Read access: agent or client involved in the offer
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      
      // Create access: agents can create offers for their clients
      allow create: if isAgent() && 
                       isValidOffer() &&
                       isOwner(request.resource.data.agentId);
      
      // Update access: agent or client can update their offers
      allow update: if isAuthenticated() && 
                       hasResourceAccess(resource.data.agentId, resource.data.clientId) &&
                       isValidOffer();
      
      // Delete access: only agent can delete
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /offer_comparisons/{comparisonId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /counter_offers/{counterOfferId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow create, update: if isAuthenticated() && 
                               hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /offer_documents/{documentId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /offer_workflows/{workflowId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    // ========== NEGOTIATIONS COLLECTIONS ==========
    
    match /negotiations/{negotiationId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      
      allow create: if isAgent() && 
                       isValidNegotiation() &&
                       isOwner(request.resource.data.agentId);
      
      allow update: if isAuthenticated() && 
                       hasResourceAccess(resource.data.agentId, resource.data.clientId) &&
                       isValidNegotiation();
      
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /negotiation_strategies/{strategyId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /appraisal_scenarios/{scenarioId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /negotiation_documents/{documentId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /market_analyses/{analysisId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /risk_assessments/{assessmentId} {
      allow read: if isAuthenticated() && 
                     hasResourceAccess(resource.data.agentId, resource.data.clientId);
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    // ========== DOCUMENTS COLLECTIONS ==========
    
    match /documents/{documentId} {
      // Read access: check document permissions
      allow read: if isAuthenticated() && (
        request.auth.uid in resource.data.permissions.canView ||
        resource.data.permissions.isPublic == true ||
        hasResourceAccess(resource.data.agentId, resource.data.clientId)
      );
      
      // Create access: agents and clients can create documents
      allow create: if isAuthenticated() && 
                       isValidDocument() &&
                       (isOwner(request.resource.data.agentId) || 
                        isOwner(request.resource.data.clientId));
      
      // Update access: check edit permissions
      allow update: if isAuthenticated() && 
                       request.auth.uid in resource.data.permissions.canEdit &&
                       isValidDocument();
      
      // Delete access: check delete permissions
      allow delete: if isAuthenticated() && 
                       request.auth.uid in resource.data.permissions.canDelete;
    }
    
    match /document_templates/{templateId} {
      // Templates are readable by all authenticated users
      allow read: if isAuthenticated();
      
      // Only agents can create/update/delete templates
      allow create, update, delete: if isAgent();
    }
    
    match /document_libraries/{libraryId} {
      allow read: if isAuthenticated() && isOwner(resource.data.agentId);
      allow create, update, delete: if isAgent() && isOwner(request.resource.data.agentId);
    }
    
    match /document_shares/{shareId} {
      allow read: if isAuthenticated() && (
        isOwner(resource.data.agentId) ||
        request.auth.uid in resource.data.sharedWith
      );
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    match /document_analytics/{analyticsId} {
      allow read: if isAuthenticated() && isOwner(resource.data.agentId);
      allow create, update: if isAgent() && isOwner(request.resource.data.agentId);
      allow delete: if isAgent() && isOwner(resource.data.agentId);
    }
    
    // ========== MARKET DATA COLLECTIONS ==========
    
    match /market_data/{dataId} {
      // Market data is readable by all authenticated users (cached public data)
      allow read: if isAuthenticated();
      
      // Only system/agents can create/update market data
      allow create, update: if isAgent();
      
      // Only agents can delete market data
      allow delete: if isAgent();
    }
    
    match /comparables/{comparableId} {
      // Comparables are readable by all authenticated users
      allow read: if isAuthenticated();
      allow create, update, delete: if isAgent();
    }
    
    match /market_trends/{trendId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAgent();
    }
    
    match /market_forecasts/{forecastId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAgent();
    }
    
    match /market_alerts/{alertId} {
      allow read: if isAuthenticated() && isOwner(resource.data.agentId);
      allow create, update, delete: if isAgent() && isOwner(request.resource.data.agentId);
    }
    
    match /market_reports/{reportId} {
      allow read: if isAuthenticated() && isOwner(resource.data.agentId);
      allow create, update, delete: if isAgent() && isOwner(request.resource.data.agentId);
    }
    
    // ========== LEGACY COLLECTIONS ==========
    
    // Existing repair estimates - maintain current access patterns
    match /repair_estimates/{estimateId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // ========== ADMIN COLLECTIONS ==========
    
    // System configuration (admin only)
    match /system_config/{configId} {
      allow read: if isAuthenticated();
      // Note: Admin write access would be handled by custom claims or separate admin rules
    }
    
    // Audit logs (read-only for agents, admin-write)
    match /audit_logs/{logId} {
      allow read: if isAgent();
      // Write access handled by server-side functions
    }
  }
}
`

/**
 * Validation helpers for use in application code
 */
export const validateOfferData = (data: any): boolean => {
  const requiredFields = [
    'agentId',
    'clientId',
    'propertyId',
    'type',
    'status',
    'purchasePrice',
    'earnestMoney',
    'downPayment',
    'loanAmount',
    'offerDate',
    'expirationDate',
    'closingDate',
  ]

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in data)) {
      return false
    }
  }

  // Validate field types and constraints
  return (
    ['buyer', 'seller'].includes(data.type) &&
    [
      'draft',
      'submitted',
      'accepted',
      'rejected',
      'countered',
      'expired',
    ].includes(data.status) &&
    typeof data.purchasePrice === 'number' &&
    data.purchasePrice > 0 &&
    typeof data.earnestMoney === 'number' &&
    data.earnestMoney >= 0 &&
    typeof data.downPayment === 'number' &&
    data.downPayment >= 0
  )
}

export const validateNegotiationData = (data: any): boolean => {
  const requiredFields = [
    'agentId',
    'clientId',
    'offerId',
    'propertyId',
    'type',
    'status',
  ]

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in data)) {
      return false
    }
  }

  // Validate field types and constraints
  return (
    ['buyer_negotiation', 'seller_negotiation'].includes(data.type) &&
    ['active', 'completed', 'stalled', 'cancelled'].includes(data.status)
  )
}

export const validateDocumentData = (data: any): boolean => {
  const requiredFields = [
    'agentId',
    'clientId',
    'title',
    'type',
    'category',
    'status',
  ]

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in data)) {
      return false
    }
  }

  // Validate field types and constraints
  return (
    ['draft', 'review', 'approved', 'final', 'sent', 'archived'].includes(
      data.status
    ) &&
    typeof data.title === 'string' &&
    data.title.length > 0 &&
    data.title.length <= 200
  )
}

/**
 * Permission checking utilities
 */
export const checkDocumentPermission = (
  document: any,
  userId: string,
  permission: 'canView' | 'canEdit' | 'canShare' | 'canDelete'
): boolean => {
  if (!document.permissions) {
    return false
  }

  // Check if document is public and permission is view
  if (permission === 'canView' && document.permissions.isPublic) {
    return true
  }

  // Check if user is in the permission list
  return document.permissions[permission]?.includes(userId) || false
}

export const hasAgentClientRelationship = (
  agentId: string,
  clientId: string,
  userData: any
): boolean => {
  // Check if agent has this client in their client list
  return (
    userData?.role === 'agent' &&
    userData?.clientIds &&
    userData.clientIds[clientId] === true
  )
}

/**
 * Security rule testing utilities
 */
export const getTestSecurityRules = () => {
  return firestoreSecurityRules
}

export const validateUserRole = (role: string): boolean => {
  return ['agent', 'buyer', 'seller'].includes(role)
}

export const getPermissionLevels = () => {
  return {
    AGENT: {
      collections: [
        'offers',
        'negotiations',
        'documents',
        'market_data',
        'offer_comparisons',
        'counter_offers',
        'offer_documents',
        'negotiation_strategies',
        'appraisal_scenarios',
      ],
      permissions: ['create', 'read', 'update', 'delete'],
    },
    CLIENT: {
      collections: ['offers', 'negotiations', 'documents'],
      permissions: ['read', 'update'], // Limited write access
    },
    PUBLIC: {
      collections: [
        'market_data',
        'comparables',
        'market_trends',
        'market_forecasts',
      ],
      permissions: ['read'], // Read-only access to market data
    },
  }
}
