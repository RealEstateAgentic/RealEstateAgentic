export interface IElectronAPI {
  generateReport: (fileBuffers: Buffer[], reportId: string) => Promise<void>
}

declare global {
  interface Window {
    electron: IElectronAPI
  }
} 