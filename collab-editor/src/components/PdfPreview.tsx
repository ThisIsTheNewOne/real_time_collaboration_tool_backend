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
        width: `${settings.pageWidth}px`,
        height: `${settings.pageHeight}px`,
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight.toString(),
        border: '1px solid #ccc',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        padding: '20px',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
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