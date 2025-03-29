import React, { useEffect, useRef } from "react";
import PdfPreview from "./PdfPreview";
import { PageSettings } from "./PageEditor";
import ExportPdfButton from "./ExportPdfButton";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  settings: PageSettings;
  title?: string;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  content,
  settings,
  title,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const pagesArray = content.split(/\f/g);

  // Ensure modal scrolls to top when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-6 w-auto max-w-6xl max-h-[90vh] overflow-auto"
        style={{ maxWidth: `${settings.pageWidth + 100}px` }}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
          <h3 className="text-lg font-medium">{title || 'PDF Preview'}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        {/* Changed to flex-col for vertical layout */}
        <div className="flex flex-col items-center space-y-8 mb-4">
          {/* Display count of pages for debugging */}
          <div className="text-sm text-gray-500 mb-2">
            Total Pages: {pagesArray.length}
          </div>
          
          {/* Map through pages */}
          {pagesArray.map((pageContent, index) => (
            <div key={index} className="mb-2">
              <div className="text-center text-sm text-gray-500 mb-2">
                Page {index + 1} of {pagesArray.length}
              </div>
              <PdfPreview 
                content={pageContent} 
                settings={settings} 
              />
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-2 sticky bottom-0 bg-white pt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
          <ExportPdfButton
            content={content}
            settings={settings}
            title={title}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
