declare module 'html-pdf-node' {
  interface Options {
    format?: string
    orientation?: string
    border?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
    header?: {
      content?: string
      height?: string
    }
    footer?: {
      content?: string
      height?: string
    }
    quality?: string
    type?: string
    timeout?: number
  }

  interface FileData {
    content: string
  }

  export function generatePdf(file: FileData, options: Options): Promise<Buffer>
}
