import React from 'react';
import PdfPreviewButton from './PdfPreviewButton';
import ExportPdfButton from './ExportPdfButton';
import Button from './atomic/Button';
import { PageSettings } from './PageEditor';

interface EditorToolbarProps {
  pages: string[];
  settings: PageSettings;
  title?: string;
  totalPages: number;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export default function EditorToolbar({
  pages,
  settings,
  title,
  totalPages,
  showSettings,
  setShowSettings
}: EditorToolbarProps) {
  // Format content for PDF generation (join pages with form feed character)
  const pdfContent = pages.join('\f');
  
  return (
    <div className="mb-4 mt-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? "Hide Settings" : "Page Settings"}
        </Button>

        <PdfPreviewButton
          content={pdfContent}
          settings={settings}
          title={title}
        />

        <ExportPdfButton
          content={pdfContent}
          title={title}
          settings={settings}
        />
      </div>
      <div className="text-sm text-gray-500">
        {totalPages} {totalPages === 1 ? "page" : "pages"}
      </div>
    </div>
  );
}