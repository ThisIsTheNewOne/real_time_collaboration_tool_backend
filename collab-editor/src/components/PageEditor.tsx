import PageSettingsPanel from "./PageSettingsPanel";
import EditorToolbar from "./EditorToolbar";
import PageRenderer from "./PageRendere";
import { usePageEditor } from "@/hooks/usePageEditor";

interface PagedEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  canEdit: boolean;
  placeholder?: string;
  initialSettings?: PageSettings;
  title?: string;
}

// Define a settings interface
export interface PageSettings {
  pageHeight: number;
  pageWidth: number;
  bufferHeight: number;
  fontSize: number;
  lineHeight: number;
}

export default function PagedEditor({
  content,
  onContentChange,
  canEdit,
  placeholder = "Start writing...",
  initialSettings,
  title,
}: PagedEditorProps) {
  const {
    settings,
    setSettings,
    showSettings,
    setShowSettings,
    pages,
    totalPages,
    focusedPageIndex,
    isInitialized,
    textareaRefs,
    contentMeasureRef,
    handleTextareaChange,
    handleKeyDown,
    setFocusedPageIndex,
    DEFAULT_SETTINGS,
  } = usePageEditor({
    content,
    onContentChange,
    canEdit,
    initialSettings,
  });

  if (!isInitialized) return <div>Loading...</div>;

  return (
    <div className="w-full">
      {/* Settings Panel */}
      <EditorToolbar
        pages={pages}
        settings={settings}
        title={title}
        totalPages={totalPages}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />

      {/* Collapsible settings panel */}
      <PageSettingsPanel
        settings={settings}
        onSettingsChange={setSettings}
        defaultSettings={DEFAULT_SETTINGS}
        isVisible={showSettings}
      />
      {/* Multi-page editor with gap between pages */}
      <PageRenderer
        pages={pages}
        settings={settings}
        canEdit={canEdit}
        placeholder={placeholder}
        totalPages={totalPages}
        textareaRefs={textareaRefs}
        focusedPageIndex={focusedPageIndex}
        handleTextareaChange={handleTextareaChange}
        handleKeyDown={handleKeyDown}
        setFocusedPageIndex={setFocusedPageIndex}
      />

      {/* Hidden div to measure content */}
      <div
        ref={contentMeasureRef}
        className="absolute opacity-0 pointer-events-none"
        style={{
          width: `${settings.pageWidth}px`,
          padding: "0",
          lineHeight: settings.lineHeight.toString(),
          fontSize: `${settings.fontSize}px`,
          whiteSpace: "pre-wrap",
        }}
      ></div>
    </div>
  );
}
