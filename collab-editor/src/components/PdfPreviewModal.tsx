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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-auto max-w-6xl max-h-[90vh] overflow-auto"
        style={{ maxWidth: `${settings.pageWidth + 100}px` }}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2 border-b dark:border-gray-700">
          <h3 className="text-lg font-medium dark:text-white">{title || 'PDF Preview'}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        <div className="flex flex-col items-center space-y-8 mb-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Total Pages: {pagesArray.length}
          </div>
          
          {pagesArray.map((pageContent, index) => (
            <div key={index} className="mb-2">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                Page {index + 1} of {pagesArray.length}
              </div>
              {/* PDF Preview always stays light for accurate representation */}
              <div className="shadow-lg">
                <PdfPreview 
                  content={pageContent} 
                  settings={settings} 
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-2 sticky bottom-0 bg-white dark:bg-gray-800 pt-2 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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