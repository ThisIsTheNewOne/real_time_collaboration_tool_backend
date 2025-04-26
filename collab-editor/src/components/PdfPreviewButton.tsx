import { useState } from "react";
import PdfPreviewModal from "./PdfPreviewModal";
import { PageSettings } from './PageEditor';

interface PdfPreviewButtonProps {
  content: string;
  settings: PageSettings;
  title?: string;
}

export default function PdfPreviewButton({
  content,
  settings,
  title
}: PdfPreviewButtonProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowPreview(true)}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
      >
        Preview PDF
      </button>

      <PdfPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        content={content}
        settings={settings}
        title={title}
      />
    </>
  );
}