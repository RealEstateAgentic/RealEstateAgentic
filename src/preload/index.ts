import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: undefined,

  // PDF Generation API
  pdf: {
    generate: (htmlContent: string, fileName: string, options?: any) =>
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

    openFile: (filePath: string) =>
      ipcRenderer.invoke('pdf:openFile', filePath),

    showInFolder: (filePath: string) =>
      ipcRenderer.invoke('pdf:showInFolder', filePath),

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

  // Sharing API
  sharing: {
    createShare: (shareRequest: any, sharedBy: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SHARE_DOCUMENT, {
        shareRequest,
        sharedBy,
      }),

    accessShare: (
      shareId: string,
      accessedBy: string,
      action: string,
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

  // System API placeholders
  system: {
    getUserDataPath: () => Promise.resolve('/tmp'),
  },

  // Files API placeholders
  files: {
    showSaveDialog: (options: any) => Promise.resolve({ success: false }),
    read: (filePath: string) => Promise.resolve({ success: false }),
    save: (filePath: string, content: string) =>
      Promise.resolve({ success: false }),
  },

  // Analytics API placeholders
  analytics: {
    trackDocumentView: (documentId: string, metadata: any) => Promise.resolve(),
    trackDocumentDownload: (documentId: string, metadata: any) =>
      Promise.resolve(),
  },

  // Report Generation API
  report: {
    generate: (filePaths: string[], reportId: string) =>
      ipcRenderer.invoke('reports:generate', filePaths, reportId),
    onProgress: (callback: (message: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, message: string) =>
        callback(message)
      ipcRenderer.on('reports:progress', handler)
      return () => {
        ipcRenderer.removeListener('reports:progress', handler)
      }
    },
  },
}

contextBridge.exposeInMainWorld('App', API)
