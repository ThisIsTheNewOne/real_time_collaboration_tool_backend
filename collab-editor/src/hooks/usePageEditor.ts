import { useState, useRef, useEffect } from 'react';
import { useTextPagination } from './useTextPagination';
import { PageSettings } from '../components/PageEditor';

interface UsePageEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  canEdit: boolean;
  initialSettings?: PageSettings;
}

export function usePageEditor({
  content,
  onContentChange,
  canEdit,
  initialSettings,
}: UsePageEditorProps) {
  // Default settings
  const DEFAULT_SETTINGS: PageSettings = {
    pageHeight: 820,
    pageWidth: 850,
    bufferHeight: 30,
    fontSize: 16,
    lineHeight: 1.5,
  };

  // State
  const [settings, setSettings] = useState<PageSettings>(
    initialSettings || DEFAULT_SETTINGS
  );
  const [showSettings, setShowSettings] = useState(false);
  const [pages, setPages] = useState<string[]>([""]);
  const [totalPages, setTotalPages] = useState(1);
  const [focusedPageIndex, setFocusedPageIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [nextCursorPosition, setNextCursorPosition] = useState<number | null>(null);

  // Refs
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const contentMeasureRef = useRef<HTMLDivElement>(null);
  const internalContent = useRef(content);

  // Use the pagination hook
  const { splitIntoPages, isApproachingOverflow } = useTextPagination({
    contentMeasureRef,
    settings,
  });

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

    // Get the content that fits on current page
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
          }
        }
      }
    }
  }, [focusedPageIndex, pages.length, nextCursorPosition]);

  // Handle key events for navigation and special cases
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    pageIndex: number
  ) => {
    const textarea = e.currentTarget;

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
      // If the current page is empty and the user presses backspace, remove that page
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

  return {
    // State
    settings,
    setSettings,
    showSettings,
    setShowSettings,
    pages,
    totalPages,
    focusedPageIndex,
    isInitialized,
    
    // Refs
    textareaRefs,
    contentMeasureRef,
    
    // Handlers
    handleTextareaChange,
    handleKeyDown,
    setFocusedPageIndex,
    
    // Constants
    DEFAULT_SETTINGS,
  };
}