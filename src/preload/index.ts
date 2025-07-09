import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'

declare global {
  interface Window {
    App: typeof API
  }
}

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: process.env.USER,

  // PDF Generation API
  pdf: {
    generateFromHTML: (htmlContent: string, fileName: string, options?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.GENERATE_PDF_FROM_HTML, {
        htmlContent,
        fileName,
        options,
      }),

    generateDocument: (
      content: any,
      agentProfile: any,
      clientProfile?: any,
      options?: any
    ) =>
      ipcRenderer.invoke(IPC_CHANNELS.GENERATE_PDF, {
        content,
        agentProfile,
        clientProfile,
        options,
      }),

    mergePDFs: (pdfPaths: string[], outputPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.MERGE_PDFS, {
        pdfPaths,
        outputPath,
      }),

    openPDF: (filePath: string) => ipcRenderer.invoke('pdf:open', filePath),

    cleanup: () => ipcRenderer.invoke('pdf:cleanup'),
  },

  // Document Management API
  documents: {
    save: (document: any, filePath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SAVE_DOCUMENT, {
        document,
        filePath,
      }),

    load: (filePath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.LOAD_DOCUMENT, filePath),

    delete: (filePath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.DELETE_DOCUMENT, filePath),

    list: (directoryPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_DOCUMENTS, directoryPath),
  },

  // Template Management API
  templates: {
    get: (templateName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_TEMPLATE, templateName),

    save: (templateName: string, content: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SAVE_TEMPLATE, {
        templateName,
        content,
      }),

    list: () => ipcRenderer.invoke(IPC_CHANNELS.LIST_TEMPLATES),
  },

  // File Operations API
  files: {
    save: (filePath: string, content: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SAVE_FILE, {
        filePath,
        content,
      }),

    read: (filePath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.READ_FILE, filePath),

    delete: (filePath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.DELETE_FILE, filePath),

    showSaveDialog: (options?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.SHOW_SAVE_DIALOG, options),

    showOpenDialog: (options?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.SHOW_OPEN_DIALOG, options),
  },

  // System API
  system: {
    getAppPath: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_PATH),

    getUserDataPath: () => ipcRenderer.invoke(IPC_CHANNELS.GET_USER_DATA_PATH),

    openExternal: (url: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL, url),
  },

  // Analytics API
  analytics: {
    trackDocumentView: (documentId: string, metadata?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.TRACK_DOCUMENT_VIEW, {
        documentId,
        metadata,
      }),

    trackDocumentDownload: (documentId: string, metadata?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.TRACK_DOCUMENT_DOWNLOAD, {
        documentId,
        metadata,
      }),

    getAnalytics: (filters?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_ANALYTICS, filters),
  },

  // Document Sharing API
  sharing: {
    createShare: (shareRequest: any, sharedBy: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SHARE_DOCUMENT, {
        shareRequest,
        sharedBy,
      }),

    accessShare: (
      shareId: string,
      accessedBy: string,
      action: 'view' | 'download' | 'print',
      password?: string,
      metadata?: any
    ) =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_SHARED_DOCUMENT, {
        shareId,
        accessedBy,
        action,
        password,
        metadata,
      }),

    revokeShare: (shareId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.REVOKE_SHARE, shareId),

    getActiveShares: (userId: string) =>
      ipcRenderer.invoke('sharing:get-active-shares', userId),

    getAnalytics: (shareId: string) =>
      ipcRenderer.invoke('sharing:get-analytics', shareId),

    cleanup: () => ipcRenderer.invoke('sharing:cleanup'),
  },
}

contextBridge.exposeInMainWorld('App', API)
