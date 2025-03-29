import usePdfExport from '@/hooks/usePdfExport';
import React from 'react';
import { PageSettings } from '@/components/PageEditor';

interface ExportPdfButtonProps {
  content: string;
  settings: PageSettings;
  title?: string;
}

const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({ content, settings, title }) => {
  const { exportPdf } = usePdfExport(content, settings, title);

  return (
    <button
      onClick={exportPdf}
       className="px-3 py-1 bg-blue-500  text-white rounded hover:bg-gray-300 text-sm hover:bg-blue-600"
    >
      Export as PDF
    </button>
  );
};

export default ExportPdfButton;