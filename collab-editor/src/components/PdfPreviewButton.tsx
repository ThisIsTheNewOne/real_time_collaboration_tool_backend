import { useState } from "react";
import PdfPreviewModal from "./PdfPreviewModal";
import { PageSettings } from './PageEditor';
import Button from "./atomic/Button";

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
     <Button
        variant="tertiary"
        size="sm"
        // leftIcon={<DocumentIcon className="h-4 w-4" />}
        onClick={() => setShowPreview(true)}
      >
        Preview PDF
      </Button>

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