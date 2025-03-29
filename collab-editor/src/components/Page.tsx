import React, { useState, useEffect, useRef } from "react";

interface PageProps {
  index: number;
  content: string;
  isActive: boolean;
  canEdit: boolean;
  placeholder: string;
  pageWidth: number;
  pageHeight: number;
  padding: number;
  fontSize: number;
  lineHeight: number;
  contentHeight: number;
  onActivate: () => void;
  onContentChange: (newText: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  trackSelection: (pageIndex: number, editor: HTMLDivElement) => void;
  editorRef: (el: HTMLDivElement | null) => void;
}

export const Page: React.FC<PageProps> = ({
  index,
  content,
  isActive,
  canEdit,
  placeholder,
  pageWidth,
  pageHeight,
  padding,
  fontSize,
  lineHeight,
  contentHeight,
  onActivate,
  onContentChange,
  onKeyDown,
  trackSelection,
  editorRef,
}) => {
  const [localContent, setLocalContent] = useState(content);
  const previousContentRef = useRef(content);
  const editorDivRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local content when prop changes, but only if it's different
  // and not during active editing
  useEffect(() => {
    if (content !== previousContentRef.current) {
      previousContentRef.current = content;
      setLocalContent(content);
    }
  }, [content]);

  // Handle ref assignment
  const setRef = (el: HTMLDivElement | null) => {
    editorDivRef.current = el;
    editorRef(el);
  };

  // Handle content changes
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerText;
    setLocalContent(newText);
    
    // Track selection to preserve cursor position
    if (editorDivRef.current) {
      trackSelection(index, editorDivRef.current);
    }
    
    // Debounce the notification to parent component
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      previousContentRef.current = newText;
      onContentChange(newText);
    }, 300); // 300ms debounce
  };

  // Handle focus events
  const handleFocus = () => {
    if (editorDivRef.current) {
      trackSelection(index, editorDivRef.current);
    }
  };

  // Handle blur events
  const handleBlur = () => {
    if (editorDivRef.current) {
      trackSelection(index, editorDivRef.current);
    }
    
    // On blur, ensure content is synced
    if (localContent !== previousContentRef.current) {
      previousContentRef.current = localContent;
      onContentChange(localContent);
    }
  };

  return (
    <div
      className="bg-white border shadow-md page-container"
      style={{
        width: `${pageWidth}px`,
        minHeight: `${pageHeight}px`,
        padding: `${padding}px`,
        position: "relative",
      }}
      onClick={onActivate}
    >
      {/* Page Number Indicator */}
      <div className="absolute bottom-2 right-2 text-gray-400 text-xs">
        Page {index + 1}
      </div>

      {canEdit ? (
        <div
          ref={setRef}
          data-page-index={index}
          className="w-full h-full focus:outline-none"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            wordBreak: "break-word",
            minHeight: `${contentHeight}px`,
            overflowY: "hidden",
            whiteSpace: "pre-wrap",
          }}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={onKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          dangerouslySetInnerHTML={{ __html: localContent || placeholder }}
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {localContent || placeholder}
        </div>
      )}
    </div>
  );
};