/**
 * Document Sharing Service
 *
 * Secure document sharing service for real estate professionals
 * with access controls, expiration management, sharing analytics,
 * and secure link generation. Runs in the main process for security.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { app } from 'electron'
import { randomBytes } from 'node:crypto'
import type { SHARE_PERMISSIONS } from '../../shared/constants'
import { FILE_PATHS } from '../../shared/constants'

// ========== SHARING TYPES ==========

export interface ShareLink {
  id: string
  documentId: string
  documentPath: string
  sharedBy: string
  sharedWith: string[]
  permission: keyof typeof SHARE_PERMISSIONS
  expiresAt: string
  createdAt: string
  accessCount: number
  maxAccess?: number
  password?: string
  allowDownload: boolean
  allowPrint: boolean
  trackViews: boolean
  metadata: {
    documentTitle: string
    documentType: string
    fileSize: number
    shareMessage?: string
    clientName?: string
    propertyAddress?: string
  }
}

export interface ShareRequest {
  documentId: string
  documentPath: string
  sharedWith: string[]
  permission: keyof typeof SHARE_PERMISSIONS
  expiresIn: number // hours
  maxAccess?: number
  password?: string
  allowDownload: boolean
  allowPrint: boolean
  shareMessage?: string
  metadata?: Record<string, any>
}

export interface ShareAccess {
  shareId: string
  accessedBy: string
  accessedAt: string
  ipAddress?: string
  userAgent?: string
  action: 'view' | 'download' | 'print'
  duration?: number
}

export interface ShareAnalytics {
  shareId: string
  totalViews: number
  totalDownloads: number
  totalPrints: number
  uniqueViewers: number
  lastAccessed: string
  accessHistory: ShareAccess[]
  geographicDistribution: Record<string, number>
  deviceTypes: Record<string, number>
}

// ========== DOCUMENT SHARING SERVICE ==========

export class DocumentSharingService {
  private sharesPath: string
  private analyticsPath: string
  private activeShares: Map<string, ShareLink> = new Map()

  constructor() {
    const userDataPath = app.getPath('userData')
    this.sharesPath = path.join(userDataPath, FILE_PATHS.SHARED)
    this.analyticsPath = path.join(userDataPath, FILE_PATHS.ANALYTICS)

    // Ensure directories exist
    this.ensureDirectories()
    this.loadActiveShares()
  }

  // ========== DIRECTORY MANAGEMENT ==========

  private ensureDirectories(): void {
    for (const dir of [this.sharesPath, this.analyticsPath]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  private loadActiveShares(): void {
    try {
      const sharesFile = path.join(this.sharesPath, 'active-shares.json')
      if (fs.existsSync(sharesFile)) {
        const shares = JSON.parse(fs.readFileSync(sharesFile, 'utf-8'))
        this.activeShares = new Map(
          shares.map((share: ShareLink) => [share.id, share])
        )

        // Clean up expired shares
        this.cleanupExpiredShares()
      }
    } catch (error) {
      console.error('Error loading active shares:', error)
    }
  }

  private saveActiveShares(): void {
    try {
      const sharesFile = path.join(this.sharesPath, 'active-shares.json')
      const shares = Array.from(this.activeShares.values())
      fs.writeFileSync(sharesFile, JSON.stringify(shares, null, 2))
    } catch (error) {
      console.error('Error saving active shares:', error)
    }
  }

  // ========== SHARE CREATION ==========

  async createShare(
    request: ShareRequest,
    sharedBy: string
  ): Promise<{ success: boolean; shareLink?: ShareLink; error?: string }> {
    try {
      // Validate document exists
      if (!fs.existsSync(request.documentPath)) {
        return { success: false, error: 'Document not found' }
      }

      // Generate unique share ID
      const shareId = this.generateShareId()

      // Get document metadata
      const stats = fs.statSync(request.documentPath)
      const documentTitle = path.basename(request.documentPath, '.pdf')

      // Calculate expiration
      const expiresAt = new Date(
        Date.now() + request.expiresIn * 60 * 60 * 1000
      ).toISOString()

      // Create share link
      const shareLink: ShareLink = {
        id: shareId,
        documentId: request.documentId,
        documentPath: request.documentPath,
        sharedBy,
        sharedWith: request.sharedWith,
        permission: request.permission,
        expiresAt,
        createdAt: new Date().toISOString(),
        accessCount: 0,
        maxAccess: request.maxAccess,
        password: request.password,
        allowDownload: request.allowDownload,
        allowPrint: request.allowPrint,
        trackViews: true,
        metadata: {
          documentTitle,
          documentType: request.metadata?.documentType || 'document',
          fileSize: stats.size,
          shareMessage: request.shareMessage,
          clientName: request.metadata?.clientName,
          propertyAddress: request.metadata?.propertyAddress,
        },
      }

      // Store share link
      this.activeShares.set(shareId, shareLink)
      this.saveActiveShares()

      // Create analytics entry
      await this.initializeAnalytics(shareId)

      return { success: true, shareLink }
    } catch (error) {
      console.error('Error creating share:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ========== SHARE ACCESS ==========

  async accessShare(
    shareId: string,
    accessedBy: string,
    action: 'view' | 'download' | 'print',
    password?: string,
    metadata?: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<{ success: boolean; shareLink?: ShareLink; error?: string }> {
    try {
      const shareLink = this.activeShares.get(shareId)

      if (!shareLink) {
        return { success: false, error: 'Share not found' }
      }

      // Check expiration
      if (new Date() > new Date(shareLink.expiresAt)) {
        return { success: false, error: 'Share has expired' }
      }

      // Check access limits
      if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) {
        return { success: false, error: 'Access limit reached' }
      }

      // Check password if required
      if (shareLink.password && shareLink.password !== password) {
        return { success: false, error: 'Invalid password' }
      }

      // Check permissions
      if (action === 'download' && !shareLink.allowDownload) {
        return { success: false, error: 'Download not allowed' }
      }

      if (action === 'print' && !shareLink.allowPrint) {
        return { success: false, error: 'Print not allowed' }
      }

      // Check if user is authorized (if specific users were specified)
      if (
        shareLink.sharedWith.length > 0 &&
        !shareLink.sharedWith.includes(accessedBy)
      ) {
        return { success: false, error: 'Access denied' }
      }

      // Update access count
      shareLink.accessCount++
      this.activeShares.set(shareId, shareLink)
      this.saveActiveShares()

      // Track access
      await this.trackAccess(shareId, {
        shareId,
        accessedBy,
        accessedAt: new Date().toISOString(),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        action,
      })

      return { success: true, shareLink }
    } catch (error) {
      console.error('Error accessing share:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ========== SHARE MANAGEMENT ==========

  async revokeShare(
    shareId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.activeShares.has(shareId)) {
        return { success: false, error: 'Share not found' }
      }

      this.activeShares.delete(shareId)
      this.saveActiveShares()

      return { success: true }
    } catch (error) {
      console.error('Error revoking share:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getActiveShares(userId: string): Promise<ShareLink[]> {
    return Array.from(this.activeShares.values())
      .filter(share => share.sharedBy === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }

  async getShare(shareId: string): Promise<ShareLink | null> {
    return this.activeShares.get(shareId) || null
  }

  // ========== ANALYTICS ==========

  private async initializeAnalytics(shareId: string): Promise<void> {
    try {
      const analyticsFile = path.join(this.analyticsPath, `${shareId}.json`)
      const analytics: ShareAnalytics = {
        shareId,
        totalViews: 0,
        totalDownloads: 0,
        totalPrints: 0,
        uniqueViewers: 0,
        lastAccessed: new Date().toISOString(),
        accessHistory: [],
        geographicDistribution: {},
        deviceTypes: {},
      }

      fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2))
    } catch (error) {
      console.error('Error initializing analytics:', error)
    }
  }

  private async trackAccess(
    shareId: string,
    access: ShareAccess
  ): Promise<void> {
    try {
      const analyticsFile = path.join(this.analyticsPath, `${shareId}.json`)

      let analytics: ShareAnalytics
      if (fs.existsSync(analyticsFile)) {
        analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf-8'))
      } else {
        await this.initializeAnalytics(shareId)
        analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf-8'))
      }

      // Update analytics
      analytics.lastAccessed = access.accessedAt
      analytics.accessHistory.push(access)

      // Update counters
      switch (access.action) {
        case 'view':
          analytics.totalViews++
          break
        case 'download':
          analytics.totalDownloads++
          break
        case 'print':
          analytics.totalPrints++
          break
      }

      // Update unique viewers
      const uniqueViewers = new Set(
        analytics.accessHistory.map(a => a.accessedBy)
      )
      analytics.uniqueViewers = uniqueViewers.size

      // Update device types (basic detection)
      if (access.userAgent) {
        const deviceType = this.detectDeviceType(access.userAgent)
        analytics.deviceTypes[deviceType] =
          (analytics.deviceTypes[deviceType] || 0) + 1
      }

      // Save analytics
      fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2))
    } catch (error) {
      console.error('Error tracking access:', error)
    }
  }

  async getAnalytics(shareId: string): Promise<ShareAnalytics | null> {
    try {
      const analyticsFile = path.join(this.analyticsPath, `${shareId}.json`)

      if (fs.existsSync(analyticsFile)) {
        return JSON.parse(fs.readFileSync(analyticsFile, 'utf-8'))
      }

      return null
    } catch (error) {
      console.error('Error getting analytics:', error)
      return null
    }
  }

  // ========== UTILITY METHODS ==========

  private generateShareId(): string {
    return randomBytes(16).toString('hex')
  }

  private detectDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase()

    if (
      ua.includes('mobile') ||
      ua.includes('android') ||
      ua.includes('iphone')
    ) {
      return 'mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }

  private cleanupExpiredShares(): void {
    const now = new Date()
    const expired: string[] = []

    for (const [shareId, shareLink] of this.activeShares) {
      if (new Date(shareLink.expiresAt) < now) {
        expired.push(shareId)
      }
    }

    for (const shareId of expired) {
      this.activeShares.delete(shareId)
    }

    if (expired.length > 0) {
      this.saveActiveShares()
    }
  }

  // ========== CLEANUP ==========

  async performCleanup(): Promise<void> {
    this.cleanupExpiredShares()
  }

  async cleanupAnalytics(olderThanDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(
        Date.now() - olderThanDays * 24 * 60 * 60 * 1000
      )

      const files = fs.readdirSync(this.analyticsPath)
      for (const file of files) {
        const filePath = path.join(this.analyticsPath, file)
        const stats = fs.statSync(filePath)

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
        }
      }
    } catch (error) {
      console.error('Error cleaning up analytics:', error)
    }
  }
}

// ========== SINGLETON INSTANCE ==========

export const documentSharingService = new DocumentSharingService()
