import { useEffect, useState, useRef, useCallback } from "react";
import ExportPdfButton from "./ExportPdfButton";
import PdfPreviewModal from "./PdfPreviewModal";
import { useTextPagination } from "@/hooks/useTextPagination";

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

// Default settings
const DEFAULT_SETTINGS: PageSettings = {
  pageHeight: 820,
  pageWidth: 850,
  bufferHeight: 30,
  fontSize: 16,
  lineHeight: 1.5,
};

// Constants for page management
const PAGE_HEIGHT = 820; // Reduced height to create a safety buffer
const PAGE_WIDTH = 850; // Width in pixels (standard page ratio)
const PADDING = 0; // Padding inside the page
const BUFFER_HEIGHT = 30; // Safety buffer to trigger page split before overflow

export default function PagedEditor({
  content,
  onContentChange,
  canEdit,
  placeholder = "Start writing...",
  initialSettings,
  title,
}: PagedEditorProps) {
  // Replace constants with state
  const [settings, setSettings] = useState<PageSettings>(
    initialSettings || DEFAULT_SETTINGS
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [pages, setPages] = useState<string[]>([""]);
  const [totalPages, setTotalPages] = useState(1);
  const [focusedPageIndex, setFocusedPageIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const [nextCursorPosition, setNextCursorPosition] = useState<number | null>(
    null
  );

  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const contentMeasureRef = useRef<HTMLDivElement>(null);
  const internalContent = useRef(content);

    // Use the extracted pagination hook
    const { splitIntoPages, isApproachingOverflow } = useTextPagination({
      contentMeasureRef,
      settings
    });
  

  // Function to update a single setting
  const updateSetting = (key: keyof PageSettings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };



  // Re-paginate when settings change
  useEffect(() => {
    if (isInitialized && contentMeasureRef.current) {
      const newPages = splitIntoPages(internalContent.current);
      setPages(newPages);
      setTotalPages(newPages.length);
    }
  }, [settings, splitIntoPages, isInitialized]);

  // Initialize pages from content prop
  useEffect(() => {
    const newPages = splitIntoPages(content);
    setPages(newPages);
    internalContent.current = content;
    setIsInitialized(true);
  }, [content, splitIntoPages]);

  // Handle textarea changes with continuous checking
  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    pageIndex: number
  ) => {
    if (!canEdit) return;

    const newText = e.target.value;
    const newPages = [...pages];
    newPages[pageIndex] = newText;

    console.log(
      "This is the text that I need to split:",
      newText,
      isApproachingOverflow(newText)
    );

    // Check if we're approaching the height limit
    if (isApproachingOverflow(newText)) {
      // Content overflows - need to split it
      handleOverflow(newText, pageIndex, e.target.selectionStart);
    } else {
      setPages(newPages);
      internalContent.current = newPages.join("");
      onContentChange(internalContent.current);
    }
  };

  // Handle overflow when content exceeds page height
  const handleOverflow = (
    text: string,
    pageIndex: number,
    cursorPosition: number
  ) => {
    // Split the overflowing text into pages
    const splitResult = splitIntoPages(text);

    console.log("This is the text that I need to split:", splitResult);

    // Get the content that fits on current page
    // const currentPageContent = splitResult[0];
    const currentPageContent = splitResult[0];

    // Get the overflow content
    const overflowContent = splitResult.slice(1).join("");

    // Create new pages array with updated content
    const newPages = [...pages];
    newPages[pageIndex] = currentPageContent;

    // Handle the overflow content
    if (pageIndex + 1 < newPages.length) {
      // Prepend overflow to the next page if it exists
      newPages[pageIndex + 1] = overflowContent + newPages[pageIndex + 1];
    } else {
      // Create a new page for the overflow
      newPages.push(overflowContent);
    }

    // Update pages state
    setPages(newPages);
    setTotalPages(newPages.length);

    // Update parent component with new content
    onContentChange(newPages.join(""));

    // Move focus to next page if cursor was in overflow section
    if (cursorPosition > currentPageContent.length) {
      const newPageCursorPosition = cursorPosition - currentPageContent.length;
      setNextCursorPosition(newPageCursorPosition);
      setFocusedPageIndex(pageIndex + 1);
    }
  };

  // Split content into pages when content prop changes
  useEffect(() => {
    if (!contentMeasureRef.current) return;

    // Update pages when content changes from parent
    const newPages = splitIntoPages(content);
    setPages(newPages);
    setTotalPages(newPages.length);

    // Reset textarea refs array to match page count
    textareaRefs.current = textareaRefs.current.slice(0, newPages.length);
  }, [content, textareaRefs, splitIntoPages]);

  // Focus the appropriate textarea when focusedPageIndex changes
  useEffect(() => {
    if (
      focusedPageIndex >= 0 &&
      focusedPageIndex < textareaRefs.current.length
    ) {
      const textarea = textareaRefs.current[focusedPageIndex];
      if (textarea !== null) {
        textarea.focus();
        if (focusedPageIndex > 0) {
          // Set cursor position based on whether we have a next position from overflow
          if (nextCursorPosition !== null) {
            // Use the calculated position after overflow
            textarea.selectionStart = nextCursorPosition;
            textarea.selectionEnd = nextCursorPosition;
            // Reset for next time
            setNextCursorPosition(null);
          } else if (focusedPageIndex > 0) {
            // Default behavior for other focus changes
          }
        }
      }
    }
  }, [focusedPageIndex, pages.length]);

  // Handle key events for navigation and special cases
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    pageIndex: number
  ) => {
    const textarea = e.currentTarget;

    console.log("this is important", textarea);

    // Navigate to previous page with up arrow at beginning of textarea
    if (e.key === "ArrowUp" && textarea.selectionStart === 0 && pageIndex > 0) {
      e.preventDefault();
      setFocusedPageIndex(pageIndex - 1);
      return;
    }

    // Navigate to next page with down arrow at end of textarea
    if (
      e.key === "ArrowDown" &&
      textarea.selectionStart === textarea.value.length &&
      pageIndex < pages.length - 1
    ) {
      e.preventDefault();
      setFocusedPageIndex(pageIndex + 1);
      return;
    }

    if (e.key === "Backspace" && textarea.value.length === 0) {
      // If the current page is empty and the user presses backspace, remove that page and move the user to the previous page at the end  of the previous page
      if (pageIndex > 0) {
        e.preventDefault();
        const newPages = [...pages];
        newPages.splice(pageIndex, 1);
        setPages(newPages);
        setTotalPages(newPages.length);
        onContentChange(newPages.join(""));

        // Move focus to the previous page
        setFocusedPageIndex(pageIndex - 1);

        // Set cursor position to the end of the previous page
        const prevTextarea = textareaRefs.current[pageIndex - 1];
        if (prevTextarea !== null) {
          prevTextarea.focus();
          prevTextarea.selectionStart = prevTextarea.value.length;
          prevTextarea.selectionEnd = prevTextarea.value.length;
        }
      }
    }

    if (e.key === "Delete" && textarea.value.length === 0) {
      // If the current page is empty and the user presses delete, move to the next page
      if (pageIndex < pages.length - 1) {
        e.preventDefault();
        setFocusedPageIndex(pageIndex + 1);
        return;
      }
    }

    // Special handling for Enter key
    if (e.key === "Enter" && !e.shiftKey) {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const textAfterCursor = textarea.value.substring(cursorPos);

      // Check if adding a newline would cause overflow
      if (isApproachingOverflow(textBeforeCursor + "\n" + textAfterCursor)) {
        // If we're near the end of the page, move to next page
        if (cursorPos > textarea.value.length * 0.7) {
          // More aggressive threshold
          e.preventDefault();

          // Update current page content
          const newPages = [...pages];
          newPages[pageIndex] = textBeforeCursor;

          // Handle the text after cursor
          if (pageIndex + 1 < newPages.length) {
            newPages[pageIndex + 1] = textAfterCursor + newPages[pageIndex + 1];
          } else {
            newPages.push(textAfterCursor);
          }

          // Update pages
          setPages(newPages);
          setTotalPages(newPages.length);
          onContentChange(newPages.join(""));

          // Focus next page and position cursor at start
          setFocusedPageIndex(pageIndex + 1);
          return;
        }
      }
    }
  };

  useEffect(() => {
    console.log("this is important", settings);
  }, [settings]);



  if (!isInitialized) return <div>Loading...</div>;

  return (
    <div className="w-full">
      {/* Settings Panel */}
      <div className="mb-4 mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            {showSettings ? "Hide Settings" : "Page Settings"}
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Preview PDF
          </button>

          <ExportPdfButton
            content={pages.join("\f")}
            title={title}
            settings={settings}
          />
        </div>
        <div className="text-sm text-gray-500">
          {totalPages} {totalPages === 1 ? "page" : "pages"}
        </div>
      </div>
      {/* Collapsible settings panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-100 rounded-md">
          <h3 className="text-md font-semibold mb-3">Page Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Page Width */}
            <div>
              <label className="block text-sm mb-1">
                Page Width: {settings.pageWidth}px
              </label>
              <input
                type="range"
                min="500"
                max="1200"
                step="10"
                value={settings.pageWidth}
                onChange={(e) =>
                  updateSetting("pageWidth", parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            {/* Page Height */}
            <div>
              <label className="block text-sm mb-1">
                Page Height: {settings.pageHeight}px
              </label>
              <input
                type="range"
                min="600"
                max="1200"
                step="10"
                value={settings.pageHeight}
                onChange={(e) =>
                  updateSetting("pageHeight", parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm mb-1">
                Font Size: {settings.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="24"
                step="1"
                value={settings.fontSize}
                onChange={(e) =>
                  updateSetting("fontSize", parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm mb-1">
                Line Height: {settings.lineHeight}
              </label>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) =>
                  updateSetting("lineHeight", parseFloat(e.target.value))
                }
                className="w-full"
              />
            </div>

            {/* Buffer Height */}
            <div>
              <label className="block text-sm mb-1">
                Split Buffer: {settings.bufferHeight}px
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={settings.bufferHeight}
                onChange={(e) =>
                  updateSetting("bufferHeight", parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            {/* Preset Buttons */}
            <div className="col-span-2 flex gap-2 mt-2">
              <button
                onClick={() => setSettings(DEFAULT_SETTINGS)}
                className="px-3 py-1 bg-gray-300 rounded text-sm"
              >
                Default
              </button>
              <button
                onClick={() =>
                  setSettings({
                    ...DEFAULT_SETTINGS,
                    pageWidth: 595,
                    pageHeight: 842,
                  })
                }
                className="px-3 py-1 bg-gray-300 rounded text-sm"
              >
                A4
              </button>
              <button
                onClick={() =>
                  setSettings({
                    ...DEFAULT_SETTINGS,
                    pageWidth: 612,
                    pageHeight: 792,
                  })
                }
                className="px-3 py-1 bg-gray-300 rounded text-sm"
              >
                Letter
              </button>
            </div>
          </div>
        </div>
      )}
      <PdfPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        content={pages.join("\f")}
        settings={settings}
        title={title}
      />
      {/* Multi-page editor with gap between pages */}
      <div className="mb-8 flex flex-col items-center">
        {pages.map((pageContent, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className="w-full h-full resize-none focus:outline-none border-0 overflow-hidden dark:bg-gray-900 dark:text-gray-100 relative"
              style={{
                width: `${settings.pageWidth}px`,
                height: `${settings.pageHeight}px`,
                padding: `0px`,
                // Add a faint border to visualize the page better
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              {canEdit ? (
                <textarea
                  ref={(el: any) => (textareaRefs.current[index] = el)}
                  className="w-full h-full resize-none focus:outline-none border-0 overflow-hidden"
                  value={pageContent}
                  onChange={(e) => handleTextareaChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onClick={() => setFocusedPageIndex(index)}
                  placeholder={index === 0 ? placeholder : ""}
                  style={{
                    lineHeight: settings.lineHeight.toString(),
                    fontSize: `${settings.fontSize}px`,
                    overflowY: "hidden",
                  }}
                />
              ) : (
                <div
                  className="w-full h-full overflow-hidden"
                  style={{
                    lineHeight: settings.lineHeight.toString(),
                    fontSize: `${settings.fontSize}px`,
                  }}
                >
                  {pageContent.split("\n").map((line, i) => (
                    <p key={i} className="mb-2">
                      {line || " "}
                    </p>
                  ))}
                </div>
              )}

              {/* Page number indicator - now properly positioned relative to page */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                Page {index + 1} of {totalPages}
              </div>
            </div>

            {/* Page break indicator - now between pages */}
            {index < pages.length - 1 && (
              <div
                className="flex items-center justify-center my-4"
                style={{ width: `${settings.pageWidth}px` }}
              >
                <div className="w-24 h-px bg-gray-600"></div>
                <div className="mx-2 text-gray-600 text-xs">●</div>
                <div className="w-24 h-px bg-gray-600"></div>
              </div>
            )}
          </div>
        ))}
      </div>
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
