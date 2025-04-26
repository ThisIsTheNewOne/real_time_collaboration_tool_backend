import usePdfExport from '@/hooks/usePdfExport';
import React from 'react';
import { PageSettings } from '@/components/PageEditor';
import Button from './atomic/Button';

interface ExportPdfButtonProps {
  content: string;
  settings: PageSettings;
  title?: string;
}

const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({ content, settings, title }) => {
  const { exportPdf } = usePdfExport(content, settings, title);

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={exportPdf}
    >
      Export as PDF
    </Button>
  );
};

export default ExportPdfButton;