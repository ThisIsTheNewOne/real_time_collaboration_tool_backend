import { useEffect, useState, useRef, useCallback } from "react";

interface PagedEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  canEdit: boolean;
  placeholder?: string;
}

// Constants for page management
const PAGE_HEIGHT = 820; // Reduced height to create a safety buffer
const PAGE_WIDTH = 850;  // Width in pixels (standard page ratio)
const PADDING = 0;      // Padding inside the page
const BUFFER_HEIGHT = 40; // Safety buffer to trigger page split before overflow

export default function PagedEditor({
  content,
  onContentChange,
  canEdit,
  placeholder = "Start writing..."
}: PagedEditorProps) {
  const [pages, setPages] = useState<string[]>(['']);
  // const [totalPages, setTotalPages] = useState(1);
  const [focusedPageIndex, setFocusedPageIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const contentMeasureRef = useRef<HTMLDivElement>(null);
  const internalContent = useRef(content);

  // Function to split content into pages with a safety buffer
  const splitIntoPages = useCallback((text: string) => {
    const measureDiv = contentMeasureRef.current;
    if (!measureDiv) return [text];
    
    let remainingText = text;
    const result: string[] = [];

    console.log("this is importanttest", remainingText)
    
    while (remainingText.length > 0) {
      // Test if current text fits in a page (with buffer)
      measureDiv.textContent = remainingText;
      const height = measureDiv.scrollHeight;


      console.log("this is importanttest", measureDiv.scrollHeight)
      
      // Using a reduced threshold to ensure we split before scrollbars appear
      if (height <= (PAGE_HEIGHT - BUFFER_HEIGHT)) {
        // All remaining text fits on one page
        result.push(remainingText);
        break;
      } else {
        // Need to find a good split point
        // We're using a more aggressive approach to ensure early splitting
        const ratio = (PAGE_HEIGHT - BUFFER_HEIGHT) / height;
        let splitPoint = Math.floor(remainingText.length * ratio);
        
        // Find the nearest paragraph or line break
        const nearestBreak = remainingText.lastIndexOf('\n', splitPoint);
        if (nearestBreak > 0 && nearestBreak > splitPoint - 500) {
          splitPoint = nearestBreak + 1;
        } else {
          // If no good break point, find a space
          const nearestSpace = remainingText.lastIndexOf(' ', splitPoint);
          if (nearestSpace > 0 && nearestSpace > splitPoint - 100) {
            splitPoint = nearestSpace + 1;
          }
        }
        
        // Add this page and continue with remaining text
        result.push(remainingText.substring(0, splitPoint));
        remainingText = remainingText.substring(splitPoint);
      }
    }
    
    return result.length === 0 ? [''] : result;
  }, []);

  // Function to check if content is approaching overflow threshold
  const isApproachingOverflow = useCallback((text: string): boolean => {
    if (!contentMeasureRef.current) return false;
    
    contentMeasureRef.current.textContent = text;
    // Use a lower threshold to trigger page splits before scrollbars appear
    return contentMeasureRef.current.scrollHeight > (PAGE_HEIGHT - BUFFER_HEIGHT);
  }, []);

    // Initialize pages from content prop
    useEffect(() => {
      const newPages = splitIntoPages(content);
      setPages(newPages);
      internalContent.current = content;
      setIsInitialized(true);
    }, [content, splitIntoPages]);

  // Handle textarea changes with continuous checking
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>, pageIndex: number) => {
    if (!canEdit) return;
    
    const newText = e.target.value;
    const newPages = [...pages];
    newPages[pageIndex] = newText;

    console.log("This is the text that I need to split:", newText, isApproachingOverflow(newText))
    
    // Check if we're approaching the height limit
    if (isApproachingOverflow(newText)) {
      // Content overflows - need to split it
      handleOverflow(newText, pageIndex, e.target.selectionStart);
    } else {
      // // No overflow - update normally
      // const newPages = [...pages];
      // newPages[pageIndex] = newText;

      // console.log("This is the text that I need to split:", newPages)
  
  
      // // Update the pages state
      // setPages(newPages);
      
      // // Notify parent of content change
      // console.log("This is the text that I need to split:", newPages.join(''))
      // onContentChange(newPages.join(''));

      setPages(newPages);
      internalContent.current = newPages.join('');
      onContentChange(internalContent.current);
    }
  };

  // Handle overflow when content exceeds page height
  const handleOverflow = (text: string, pageIndex: number, cursorPosition: number) => {
    // Split the overflowing text into pages
    const splitResult = splitIntoPages(text);

    console.log("This is the text that I need to split:", splitResult)
    
    // Get the content that fits on current page
    // const currentPageContent = splitResult[0];
    const currentPageContent = splitResult[0];
    
    // Get the overflow content
    const overflowContent = splitResult.slice(1).join('');
    
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
    // setTotalPages(newPages.length);
    
    // Update parent component with new content
    onContentChange(newPages.join(''));
    
    // Move focus to next page if cursor was in overflow section
    if (cursorPosition > currentPageContent.length) {
      setFocusedPageIndex(pageIndex + 1);
    }
  };

   // Split content into pages when content prop changes
   useEffect(() => {
    if (!contentMeasureRef.current) return;
    
    // Update pages when content changes from parent
    const newPages = splitIntoPages(content);
    setPages(newPages);
    // setTotalPages(newPages.length);

    // Reset textarea refs array to match page count
    textareaRefs.current = textareaRefs.current.slice(0, newPages.length);
  }, [content, textareaRefs, splitIntoPages]);

  // Focus the appropriate textarea when focusedPageIndex changes
  useEffect(() => {
    if (focusedPageIndex >= 0 && focusedPageIndex < textareaRefs.current.length) {
      const textarea = textareaRefs.current[focusedPageIndex];
      if (textarea) {
        textarea.focus();
        if (focusedPageIndex > 0) {
          // Position cursor at the beginning of a new page
          textarea.selectionStart = 0;
          textarea.selectionEnd = 0;
        }
      }
    }
  }, [focusedPageIndex, pages.length]);

  // Handle key events for navigation and special cases
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, pageIndex: number) => {
    const textarea = e.currentTarget;

    console.log("this is important", textarea)
    
    // Navigate to previous page with up arrow at beginning of textarea
    if (e.key === 'ArrowUp' && textarea.selectionStart === 0 && pageIndex > 0) {
      e.preventDefault();
      setFocusedPageIndex(pageIndex - 1);
      return;
    }
    
    // Navigate to next page with down arrow at end of textarea
    if (e.key === 'ArrowDown' && 
        textarea.selectionStart === textarea.value.length && 
        pageIndex < pages.length - 1) {
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
        // setTotalPages(newPages.length);
        onContentChange(newPages.join(''));
        
        // Move focus to the previous page
        setFocusedPageIndex(pageIndex - 1);
        
        // Set cursor position to the end of the previous page
        const prevTextarea = textareaRefs.current[pageIndex - 1];
        if (prevTextarea) {
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
    if (e.key === 'Enter' && !e.shiftKey) {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const textAfterCursor = textarea.value.substring(cursorPos);
      
      // Check if adding a newline would cause overflow
      if (isApproachingOverflow(textBeforeCursor + '\n' + textAfterCursor)) {
        // If we're near the end of the page, move to next page
        if (cursorPos > textarea.value.length * 0.7) { // More aggressive threshold
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
          // setTotalPages(newPages.length);
          onContentChange(newPages.join(''));
          
          // Focus next page and position cursor at start
          setFocusedPageIndex(pageIndex + 1);
          return;
        }
      }
    }
  };

  useEffect(() => {
    console.log("this is important", focusedPageIndex)
  },[focusedPageIndex])

  if (!isInitialized) return <div>Loading...</div>;

  return (
    <div className="w-full">
      {/* Page counter */}
      <div className="text-sm text-gray-500 my-4 text-center">
        {/* {totalPages} {totalPages === 1 ? 'page' : 'pages'} */}
      </div>

      {/* Multi-page editor with gap between pages */}
      <div className="space-y-8 mb-8 flex flex-col items-center">
        {pages.map((pageContent, index) => (
          <div 
            key={index}
            className="w-full h-full resize-none focus:outline-none border-0 overflow-hidden dark:bg-gray-900 dark:text-gray-100"
            style={{ 
              width: `${PAGE_WIDTH}px`, 
              height: `${PAGE_HEIGHT + (PADDING * 2)}px`,
              padding: `${PADDING}px`
            }}
          >
            {canEdit ? (
              <textarea
                ref={(el: any) => textareaRefs.current[index] = el}
                className="w-full h-full resize-none focus:outline-none border-0 overflow-hidden"
                value={pageContent}
                onChange={(e) => handleTextareaChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onClick={() => setFocusedPageIndex(index)}
                placeholder={index === 0 ? placeholder : ""}
                style={{ 
                  lineHeight: '1.5',
                  fontSize: '16px',
                  overflowY: 'hidden' // Explicitly hide scrollbars
                }}
              />
            ) : (
              <div className="w-full h-full overflow-hidden">
                {pageContent.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line || ' '}</p>
                ))}
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
          width: `${PAGE_WIDTH - (PADDING * 2)}px`,
          padding: '0',
          lineHeight: '1.5',
          fontSize: '16px',
          whiteSpace: 'pre-wrap'
        }}
      ></div>
    </div>
  );
}