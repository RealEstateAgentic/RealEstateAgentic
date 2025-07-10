import { contextBridge, ipcRenderer } from 'electron'
import type { AppAPI, PDFGenerateData } from '../shared/types'

const API: AppAPI = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: process.env.USER,
  
  // PDF Generation API
  pdf: {
    /**
     * Generate PDF from HTML content
     */
    generate: async (data: PDFGenerateData) => {
      return await ipcRenderer.invoke('pdf:generate', data)
    },
    
    /**
     * Open generated PDF file
     */
    openFile: async (filePath: string) => {
      return await ipcRenderer.invoke('pdf:openFile', filePath)
    },
    
    /**
     * Show PDF file in folder
     */
    showInFolder: async (filePath: string) => {
      return await ipcRenderer.invoke('pdf:showInFolder', filePath)
    }
  }
}

// Email API for renderer process
const emailAPI = {
  sendEmail: async (emailData: any) => {
    return await ipcRenderer.invoke('send-email', emailData)
  }
}

contextBridge.exposeInMainWorld('App', API)
contextBridge.exposeInMainWorld('electronAPI', emailAPI)
