import React, { RefObject } from 'react';
import { PageSettings } from './PageEditor';

interface PageRendererProps {
  pages: string[];
  settings: PageSettings;
  canEdit: boolean;
  placeholder?: string;
  totalPages: number;
  textareaRefs: RefObject<(HTMLTextAreaElement | null)[]>;
  focusedPageIndex: number;
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>, pageIndex: number) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, pageIndex: number) => void;
  setFocusedPageIndex: (index: number) => void;
}

export default function PageRenderer({
  pages,
  settings,
  canEdit,
  placeholder = "Start writing...",
  totalPages,
  textareaRefs,
  focusedPageIndex,
  handleTextareaChange,
  handleKeyDown,
  setFocusedPageIndex
}: PageRendererProps) {
  return (
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
                ref={(el) => {
                  if (textareaRefs.current) {
                    textareaRefs.current[index] = el;
                  }
                }}
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

            {/* Page number indicator - properly positioned relative to page */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              Page {index + 1} of {totalPages}
            </div>
          </div>

          {/* Page break indicator - between pages */}
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
  );
}