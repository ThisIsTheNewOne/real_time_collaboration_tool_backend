import React from 'react';
import { PageSettings } from './PageEditor';

interface PdfPreviewProps {
  content: string;
  settings: PageSettings;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ content, settings }) => {
  return (
    <div
      style={{
        width: `${settings.pageWidth - 245}px`,
        height: `${settings.pageHeight + 150}px`,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight.toString(),
        // Always keep the preview with white background regardless of theme
        // since PDFs typically use light background
        backgroundColor: 'white',
        color: 'black',
        border: '1px solid #ccc',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        padding: '0px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
      className="pdf-preview"
    >
      {content.split('\n').map((line, index) => (
        <p key={index} style={{ margin: '0' }}>
          {line || " "}
        </p>
      ))}
    </div>
  );
};

export default PdfPreview;