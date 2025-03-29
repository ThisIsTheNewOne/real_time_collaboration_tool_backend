import { useCallback } from 'react';
import { generatePdf } from '../utils/pdfExport';
import { PageSettings } from '@/components/PageEditor';

const usePdfExport = (content: string, settings: PageSettings, title?: string) => {
  const exportPdf = useCallback(() => {
    generatePdf(content, settings, title);
  }, [content, settings, title]);

  return { exportPdf };
};

export default usePdfExport;