/**
 * Firebase Collections Service for Documents
 * Handles all CRUD operations for document management, templates, and PDF generation
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../config'
import { getCurrentUserProfile } from '../auth'
import {
  requireAgent,
  requireClient,
  requireClientAccess,
} from '../role-middleware'
import type {
  Document,
  DocumentTemplate,
  DocumentLibrary,
  DocumentShare,
  DocumentAnalytics,
  PDFGenerationOptions,
  PDFGenerationResult,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  GenerateDocumentRequest,
  CreateDocumentTemplateRequest,
  GeneratePDFRequest,
  ShareDocumentRequest,
  DocumentResponse,
  DocumentTemplateResponse,
  PDFResponse,
  DocumentShareResponse,
  DocumentMetadata,
  DocumentPermissions,
  BrandingConfig,
} from '../../../shared/types/documents'
import { v4 as uuidv4 } from 'uuid'

// Collection names
const DOCUMENTS_COLLECTION = 'documents'
const DOCUMENT_TEMPLATES_COLLECTION = 'document_templates'
const DOCUMENT_LIBRARIES_COLLECTION = 'document_libraries'
const DOCUMENT_SHARES_COLLECTION = 'document_shares'
const DOCUMENT_ANALYTICS_COLLECTION = 'document_analytics'

/**
 * Create a new document
 */
export const createDocument = async (
  request: CreateDocumentRequest
): Promise<DocumentResponse> => {
  try {
    // Validate user permissions
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      throw new Error('Authentication required')
    }

    // Validate client access if provided
    if (request.relatedId && request.relatedType === 'client') {
      await requireClientAccess(request.relatedId)()
    }

    // Generate document ID
    const documentId = uuidv4()

    // Create document metadata
    const now = new Date().toISOString()
    const metadata: DocumentMetadata = {
      wordCount: request.content?.split(' ').length || 0,
      readingTime: Math.ceil((request.content?.split(' ').length || 0) / 200),
      tone: 'professional',
      language: 'en',
      keyPoints: [],
      sentiment: 'neutral',
      complexity: 'moderate',
      tags: [],
      keywords: [],
      summary: request.content?.substring(0, 200) || '',
    }

    // Create document permissions
    const permissions: DocumentPermissions = {
      ownerId: userProfile.uid,
      canView: [userProfile.uid],
      canEdit: [userProfile.uid],
      canShare: [userProfile.uid],
      canDelete: [userProfile.uid],
      isPublic: false,
    }

    // Create document
    const document: Document = {
      id: documentId,
      agentId: userProfile.role === 'agent' ? userProfile.uid : '',
      clientId: userProfile.role !== 'agent' ? userProfile.uid : '',
      relatedId: request.relatedId,
      relatedType: request.relatedType,
      title: request.title,
      type: request.type,
      category: request.category,
      status: 'draft',
      content: request.content || '',
      htmlContent: request.content ? `<div>${request.content}</div>` : '',
      metadata,
      generatedBy: request.templateId ? 'template' : 'manual',
      template: undefined, // Will be populated if templateId provided
      generationParams: request.generationParams,
      version: 1,
      versions: [],
      permissions,
      createdAt: now,
      updatedAt: now,
    }

    // Save to Firestore
    await setDoc(doc(db, DOCUMENTS_COLLECTION, documentId), {
      ...document,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: document,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get document by ID
 */
export const getDocument = async (
  documentId: string
): Promise<DocumentResponse> => {
  try {
    const documentDoc = await getDoc(doc(db, DOCUMENTS_COLLECTION, documentId))

    if (!documentDoc.exists()) {
      return {
        success: false,
        error: 'Document not found',
      }
    }

    const documentData = documentDoc.data()

    // Validate user has access to this document
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      throw new Error('Authentication required')
    }

    const permissions = documentData.permissions
    if (
      !permissions.canView.includes(userProfile.uid) &&
      !permissions.isPublic
    ) {
      throw new Error('Access denied')
    }

    const document: Document = {
      id: documentDoc.id,
      ...documentData,
      createdAt:
        documentData.createdAt?.toDate?.()?.toISOString() ||
        documentData.createdAt,
      updatedAt:
        documentData.updatedAt?.toDate?.()?.toISOString() ||
        documentData.updatedAt,
    }

    return {
      success: true,
      data: document,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update an existing document
 */
export const updateDocument = async (
  request: UpdateDocumentRequest
): Promise<DocumentResponse> => {
  try {
    const { documentId, updates } = request

    // Get current document to validate permissions
    const currentDocument = await getDocument(documentId)
    if (!currentDocument.success || !currentDocument.data) {
      return currentDocument
    }

    // Validate user has edit permissions
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      throw new Error('Authentication required')
    }

    const permissions = currentDocument.data.permissions
    if (!permissions.canEdit.includes(userProfile.uid)) {
      throw new Error('Edit access denied')
    }

    // Update metadata if content changed
    let updatedMetadata = currentDocument.data.metadata
    if (updates.content) {
      updatedMetadata = {
        ...updatedMetadata,
        wordCount: updates.content.split(' ').length,
        readingTime: Math.ceil(updates.content.split(' ').length / 200),
        summary: updates.content.substring(0, 200),
      }
    }

    // Create version entry
    const versionEntry = {
      version: currentDocument.data.version,
      content: currentDocument.data.content,
      htmlContent: currentDocument.data.htmlContent,
      changes: ['Updated content'],
      createdBy: userProfile.uid,
      createdAt: new Date().toISOString(),
      comment: 'Document updated',
    }

    // Prepare updates
    const updateData = {
      ...updates,
      metadata: updatedMetadata,
      versions: arrayUnion(versionEntry),
      updatedAt: serverTimestamp(),
      version: increment(1),
    }

    // Update in Firestore
    await updateDoc(doc(db, DOCUMENTS_COLLECTION, documentId), updateData)

    // Get updated document
    const updatedDocument = await getDocument(documentId)

    return updatedDocument
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete a document
 */
export const deleteDocument = async (
  documentId: string
): Promise<DocumentResponse> => {
  try {
    // Get current document to validate permissions
    const currentDocument = await getDocument(documentId)
    if (!currentDocument.success || !currentDocument.data) {
      return currentDocument
    }

    // Validate user has delete permissions
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      throw new Error('Authentication required')
    }

    const permissions = currentDocument.data.permissions
    if (!permissions.canDelete.includes(userProfile.uid)) {
      throw new Error('Delete access denied')
    }

    // Delete from Firestore
    await deleteDoc(doc(db, DOCUMENTS_COLLECTION, documentId))

    return {
      success: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get documents for a specific agent
 */
export const getAgentDocuments = async (
  agentId: string,
  options?: {
    category?: string
    status?: string
    limit?: number
    startAfter?: string
  }
): Promise<{ success: boolean; data?: Document[]; error?: string }> => {
  try {
    // Validate agent access
    const userProfile = await getCurrentUserProfile()
    if (!userProfile || userProfile.uid !== agentId) {
      throw new Error('Access denied')
    }

    // Build query
    let q = query(
      collection(db, DOCUMENTS_COLLECTION),
      where('agentId', '==', agentId),
      orderBy('createdAt', 'desc')
    )

    if (options?.category) {
      q = query(q, where('category', '==', options.category))
    }

    if (options?.status) {
      q = query(q, where('status', '==', options.status))
    }

    if (options?.limit) {
      q = query(q, limit(options.limit))
    }

    if (options?.startAfter) {
      const startDoc = await getDoc(
        doc(db, DOCUMENTS_COLLECTION, options.startAfter)
      )
      if (startDoc.exists()) {
        q = query(q, startAfter(startDoc))
      }
    }

    const querySnapshot = await getDocs(q)
    const documents: Document[] = []

    for (const doc of querySnapshot.docs) {
      const documentData = doc.data()
      documents.push({
        id: doc.id,
        ...documentData,
        createdAt:
          documentData.createdAt?.toDate?.()?.toISOString() ||
          documentData.createdAt,
        updatedAt:
          documentData.updatedAt?.toDate?.()?.toISOString() ||
          documentData.updatedAt,
      } as Document)
    }

    return {
      success: true,
      data: documents,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get documents for a specific client
 */
export const getClientDocuments = async (
  clientId: string,
  options?: {
    category?: string
    status?: string
    limit?: number
  }
): Promise<{ success: boolean; data?: Document[]; error?: string }> => {
  try {
    // Validate client access
    await requireClientAccess(clientId)()

    // Build query
    let q = query(
      collection(db, DOCUMENTS_COLLECTION),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    )

    if (options?.category) {
      q = query(q, where('category', '==', options.category))
    }

    if (options?.status) {
      q = query(q, where('status', '==', options.status))
    }

    if (options?.limit) {
      q = query(q, limit(options.limit))
    }

    const querySnapshot = await getDocs(q)
    const documents: Document[] = []

    for (const doc of querySnapshot.docs) {
      const documentData = doc.data()
      documents.push({
        id: doc.id,
        ...documentData,
        createdAt:
          documentData.createdAt?.toDate?.()?.toISOString() ||
          documentData.createdAt,
        updatedAt:
          documentData.updatedAt?.toDate?.()?.toISOString() ||
          documentData.updatedAt,
      } as Document)
    }

    return {
      success: true,
      data: documents,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create document template
 */
export const createDocumentTemplate = async (
  request: CreateDocumentTemplateRequest
): Promise<DocumentTemplateResponse> => {
  try {
    // Validate user permissions
    const userProfile = await requireAgent()

    // Generate template ID
    const templateId = uuidv4()

    // Create template
    const now = new Date().toISOString()
    const template: DocumentTemplate = {
      id: templateId,
      name: request.name,
      description: request.description,
      type: request.type,
      category: request.category,
      templateContent: request.templateContent,
      variables: request.variables,
      sections: [],
      styling: request.styling,
      isActive: true,
      isDefault: false,
      usageCount: 0,
      rating: 0,
      createdBy: userProfile.uid,
      createdAt: now,
      updatedAt: now,
    }

    // Save to Firestore
    await setDoc(doc(db, DOCUMENT_TEMPLATES_COLLECTION, templateId), {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: template,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get document template by ID
 */
export const getDocumentTemplate = async (
  templateId: string
): Promise<DocumentTemplateResponse> => {
  try {
    const templateDoc = await getDoc(
      doc(db, DOCUMENT_TEMPLATES_COLLECTION, templateId)
    )

    if (!templateDoc.exists()) {
      return {
        success: false,
        error: 'Template not found',
      }
    }

    const templateData = templateDoc.data()

    const template: DocumentTemplate = {
      id: templateDoc.id,
      ...templateData,
      createdAt:
        templateData.createdAt?.toDate?.()?.toISOString() ||
        templateData.createdAt,
      updatedAt:
        templateData.updatedAt?.toDate?.()?.toISOString() ||
        templateData.updatedAt,
    }

    return {
      success: true,
      data: template,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generate document from template
 */
export const generateDocumentFromTemplate = async (
  request: GenerateDocumentRequest
): Promise<DocumentResponse> => {
  try {
    // Get template
    const templateResult = await getDocumentTemplate(request.templateId)
    if (!templateResult.success || !templateResult.data) {
      return {
        success: false,
        error: 'Template not found',
      }
    }

    const template = templateResult.data

    // Process template content with variables
    let processedContent = template.templateContent

    // Replace variables in content
    for (const variable of template.variables) {
      const value =
        request.variables[variable.name] || variable.defaultValue || ''
      const placeholder = `{{${variable.name}}}`
      processedContent = processedContent.replace(
        new RegExp(placeholder, 'g'),
        value
      )
    }

    // Create document from template
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      throw new Error('Authentication required')
    }

    const documentId = uuidv4()
    const now = new Date().toISOString()

    const document: Document = {
      id: documentId,
      agentId: userProfile.role === 'agent' ? userProfile.uid : '',
      clientId: userProfile.role !== 'agent' ? userProfile.uid : '',
      relatedId: request.variables.relatedId || '',
      relatedType: 'other',
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      type: template.type,
      category: template.category,
      status: 'draft',
      content: processedContent,
      htmlContent: `<div>${processedContent}</div>`,
      metadata: {
        wordCount: processedContent.split(' ').length,
        readingTime: Math.ceil(processedContent.split(' ').length / 200),
        tone: 'professional',
        language: 'en',
        keyPoints: [],
        sentiment: 'neutral',
        complexity: 'moderate',
        tags: [],
        keywords: [],
        summary: processedContent.substring(0, 200),
      },
      generatedBy: 'template',
      template: template,
      generationParams: request.generationParams,
      version: 1,
      versions: [],
      permissions: {
        ownerId: userProfile.uid,
        canView: [userProfile.uid],
        canEdit: [userProfile.uid],
        canShare: [userProfile.uid],
        canDelete: [userProfile.uid],
        isPublic: false,
      },
      createdAt: now,
      updatedAt: now,
    }

    // Save document
    await setDoc(doc(db, DOCUMENTS_COLLECTION, documentId), {
      ...document,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Update template usage count
    await updateDoc(
      doc(db, DOCUMENT_TEMPLATES_COLLECTION, request.templateId),
      {
        usageCount: increment(1),
        updatedAt: serverTimestamp(),
      }
    )

    return {
      success: true,
      data: document,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generate PDF from document
 */
export const generatePDF = async (
  request: GeneratePDFRequest
): Promise<PDFResponse> => {
  try {
    // Get document
    const documentResult = await getDocument(request.documentId)
    if (!documentResult.success || !documentResult.data) {
      return {
        success: false,
        error: 'Document not found',
      }
    }

    const document = documentResult.data

    // Mock PDF generation (in real implementation, this would use Puppeteer)
    const pdfGenerationResult: PDFGenerationResult = {
      success: true,
      pdfUrl: `https://example.com/pdfs/${request.documentId}.pdf`,
      pdfSize: 1024 * 50, // 50KB
      pdfPages: 2,
      generationTime: 1500, // 1.5 seconds
    }

    // Update document with PDF info
    await updateDoc(doc(db, DOCUMENTS_COLLECTION, request.documentId), {
      pdfUrl: pdfGenerationResult.pdfUrl,
      pdfSize: pdfGenerationResult.pdfSize,
      pdfPages: pdfGenerationResult.pdfPages,
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: pdfGenerationResult,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Share document
 */
export const shareDocument = async (
  request: ShareDocumentRequest
): Promise<DocumentShareResponse> => {
  try {
    // Get document
    const documentResult = await getDocument(request.documentId)
    if (!documentResult.success || !documentResult.data) {
      return {
        success: false,
        error: 'Document not found',
      }
    }

    const document = documentResult.data

    // Validate user has share permissions
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      throw new Error('Authentication required')
    }

    const permissions = document.permissions
    if (!permissions.canShare.includes(userProfile.uid)) {
      throw new Error('Share access denied')
    }

    // Generate share ID
    const shareId = uuidv4()

    // Create share record
    const now = new Date().toISOString()
    const share: DocumentShare = {
      id: shareId,
      documentId: request.documentId,
      agentId: document.agentId,
      shareType: request.shareType,
      sharedWith: request.sharedWith || [],
      permissions: request.permissions,
      requiresAuth: request.settings?.requiresAuth || false,
      expirationDate: request.settings?.expirationDate,
      passwordProtected: request.settings?.passwordProtected || false,
      views: [],
      downloads: [],
      createdAt: now,
      updatedAt: now,
    }

    // Save share record
    await setDoc(doc(db, DOCUMENT_SHARES_COLLECTION, shareId), {
      ...share,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      data: share,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get document templates
 */
export const getDocumentTemplates = async (options?: {
  type?: string
  category?: string
  isActive?: boolean
  limit?: number
}): Promise<{
  success: boolean
  data?: DocumentTemplate[]
  error?: string
}> => {
  try {
    // Build query
    let q = query(
      collection(db, DOCUMENT_TEMPLATES_COLLECTION),
      orderBy('createdAt', 'desc')
    )

    if (options?.type) {
      q = query(q, where('type', '==', options.type))
    }

    if (options?.category) {
      q = query(q, where('category', '==', options.category))
    }

    if (options?.isActive !== undefined) {
      q = query(q, where('isActive', '==', options.isActive))
    }

    if (options?.limit) {
      q = query(q, limit(options.limit))
    }

    const querySnapshot = await getDocs(q)
    const templates: DocumentTemplate[] = []

    for (const doc of querySnapshot.docs) {
      const templateData = doc.data()
      templates.push({
        id: doc.id,
        ...templateData,
        createdAt:
          templateData.createdAt?.toDate?.()?.toISOString() ||
          templateData.createdAt,
        updatedAt:
          templateData.updatedAt?.toDate?.()?.toISOString() ||
          templateData.updatedAt,
      } as DocumentTemplate)
    }

    return {
      success: true,
      data: templates,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get document shares for a document
 */
export const getDocumentShares = async (
  documentId: string
): Promise<{ success: boolean; data?: DocumentShare[]; error?: string }> => {
  try {
    // Get document to validate permissions
    const documentResult = await getDocument(documentId)
    if (!documentResult.success || !documentResult.data) {
      return {
        success: false,
        error: 'Document not found',
      }
    }

    // Query shares
    const q = query(
      collection(db, DOCUMENT_SHARES_COLLECTION),
      where('documentId', '==', documentId),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const shares: DocumentShare[] = []

    for (const doc of querySnapshot.docs) {
      const shareData = doc.data()
      shares.push({
        id: doc.id,
        ...shareData,
        createdAt:
          shareData.createdAt?.toDate?.()?.toISOString() || shareData.createdAt,
        updatedAt:
          shareData.updatedAt?.toDate?.()?.toISOString() || shareData.updatedAt,
      } as DocumentShare)
    }

    return {
      success: true,
      data: shares,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update document status
 */
export const updateDocumentStatus = async (
  documentId: string,
  status: Document['status']
): Promise<DocumentResponse> => {
  try {
    return await updateDocument({
      documentId,
      updates: { status },
    })
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Archive old documents
 */
export const archiveOldDocuments = async (
  agentId: string,
  olderThanDays: number = 180
): Promise<{ success: boolean; archived: number; error?: string }> => {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile || userProfile.uid !== agentId) {
      throw new Error('Access denied')
    }

    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    )

    const q = query(
      collection(db, DOCUMENTS_COLLECTION),
      where('agentId', '==', agentId),
      where('status', '==', 'final'),
      where('updatedAt', '<', cutoffDate)
    )

    const querySnapshot = await getDocs(q)
    const batch = writeBatch(db)

    for (const doc of querySnapshot.docs) {
      batch.update(doc.ref, {
        status: 'archived',
        updatedAt: serverTimestamp(),
      })
    }

    await batch.commit()

    return {
      success: true,
      archived: querySnapshot.docs.length,
    }
  } catch (error: any) {
    return {
      success: false,
      archived: 0,
      error: error.message,
    }
  }
}
