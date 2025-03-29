declare module 'pdf-lib' {
    export interface PDFOptions {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string;
      creator?: string;
      pageWidth?: number;
      pageHeight?: number;
      fontSize?: number;
      lineHeight?: number;
    }
  
    export interface PDFContent {
      text: string;
      options?: PDFOptions;
    }
  
    export function createPDF(contents: PDFContent[]): Promise<Uint8Array>;
  }