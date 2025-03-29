import { useState, useRef, useCallback, useEffect } from "react";

interface SelectionInfo {
  pageIndex: number;
  startOffset: number;
  endOffset: number;
  textContent: string;
}

export function useSelectionTracking() {
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isRestoringRef = useRef(false);
  const lastSelectionRef = useRef<SelectionInfo | null>(null);
  const pendingRestoreRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track selection for a specific page
  const trackSelection = useCallback((pageIndex: number, editor: HTMLDivElement) => {
    // Skip tracking during restoration
    if (isRestoringRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // Only track selection if it's within our editor
    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return;
    
    // Calculate text offsets
    const textOffset = getTextOffset(range.startContainer, range.startOffset, editor);
    const endTextOffset = range.collapsed 
      ? textOffset 
      : getTextOffset(range.endContainer, range.endOffset, editor);
    
    // Store in our ref for immediate access
    const newSelectionInfo = {
      pageIndex,
      startOffset: textOffset,
      endOffset: endTextOffset,
      textContent: editor.textContent || ""
    };
    
    lastSelectionRef.current = newSelectionInfo;
    setSelectionInfo(newSelectionInfo);
  }, []);
  
  // Calculate text offset from a DOM node and offset
  const getTextOffset = (node: Node, offset: number, root: Node): number => {
    let totalOffset = 0;
    
    const calculateOffsetBefore = (currentNode: Node, targetNode: Node) => {
      if (currentNode === targetNode) return true;
      
      if (currentNode.nodeType === Node.TEXT_NODE) {
        totalOffset += currentNode.textContent?.length || 0;
      }
      
      for (let i = 0; i < currentNode.childNodes.length; i++) {
        if (calculateOffsetBefore(currentNode.childNodes[i], targetNode)) {
          return true;
        }
      }
      
      return false;
    };
    
    calculateOffsetBefore(root, node);
    
    if (node.nodeType === Node.TEXT_NODE) {
      totalOffset += offset;
    }
    
    return totalOffset;
  };
  
  // Find a position in the editor text content
  const findPositionAtOffset = (editor: HTMLElement, offset: number): { node: Node, offset: number } => {
    let result = { node: editor as Node, offset: 0 };
    let currentOffset = 0;
    
    const findNodeAtOffset = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const length = node.textContent?.length || 0;
        
        if (currentOffset + length >= offset) {
          result = { node, offset: offset - currentOffset };
          return true;
        }
        
        currentOffset += length;
        return false;
      }
      
      for (let i = 0; i < node.childNodes.length; i++) {
        if (findNodeAtOffset(node.childNodes[i])) {
          return true;
        }
      }
      
      return false;
    };
    
    findNodeAtOffset(editor);
    return result;
  };
  
  // Restore selection
  const restoreSelection = useCallback(() => {
    // Cancel any pending restoration
    if (pendingRestoreRef.current) {
      clearTimeout(pendingRestoreRef.current);
      pendingRestoreRef.current = null;
    }
    
    // Get the latest selection info (from ref for immediate access)
    const currentSelectionInfo = lastSelectionRef.current;
    if (!currentSelectionInfo) return;
    
    const editor = editorRefs.current[currentSelectionInfo.pageIndex];
    if (!editor) return;
    
    // Set flag to prevent tracking during restoration
    isRestoringRef.current = true;
    
    // Use a very small timeout - just enough to let React finish its work
    pendingRestoreRef.current = setTimeout(() => {
      try {
        if (!editor || !document.body.contains(editor)) return;
        
        // Don't change focus if editor isn't already focused
        if (document.activeElement === editor) {
          const selection = window.getSelection();
          if (!selection) return;
          
          // Get current text content
          const currentText = editor.textContent || "";
          
          // Calculate adjusted offsets if content changed
          const startOffset = Math.min(currentSelectionInfo.startOffset, currentText.length);
          const endOffset = Math.min(currentSelectionInfo.endOffset, currentText.length);
          
          // Find the DOM positions for our text offsets
          const startPosition = findPositionAtOffset(editor, startOffset);
          const endPosition = findPositionAtOffset(editor, endOffset);
          
          // Create and apply the range
          const range = document.createRange();
          range.setStart(startPosition.node, startPosition.offset);
          range.setEnd(endPosition.node, endPosition.offset);
          
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (e) {
        console.error("Error restoring selection:", e);
      } finally {
        isRestoringRef.current = false;
        pendingRestoreRef.current = null;
      }
    }, 0); // Minimum delay
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingRestoreRef.current) {
        clearTimeout(pendingRestoreRef.current);
      }
    };
  }, []);
  
  return {
    selectionInfo,
    trackSelection,
    restoreSelection,
    editorRefs
  };
}