import { useState, useRef, useCallback } from "react";

export function usePageCalculation(
  content: string,
  contentWidth: number,
  contentHeight: number
) {
  const [pages, setPages] = useState<string[]>(['']);
  const measureRef = useRef<HTMLDivElement>(null);
  
  // Calculate pages based on content
  const calculatePages = useCallback(() => {
    if (!measureRef.current || !content) return [''];

    const measure = measureRef.current;
    measure.style.width = `${contentWidth}px`;
    
    // Split the text into pages
    const result: string[] = [];
    let remainingText = content;
    
    while (remainingText.length > 0) {
      // Set the entire text to measure how much would fit
      measure.textContent = remainingText;
      
      if (measure.scrollHeight <= contentHeight) {
        // All remaining text fits on this page
        result.push(remainingText);
        break;
      }
      
      // Binary search to find the maximum amount of text that fits
      let low = 0;
      let high = remainingText.length;
      let mid = 0;
      let goodBreakPoint = -1;
      
      while (low <= high) {
        mid = Math.floor((low + high) / 2);
        measure.textContent = remainingText.substring(0, mid);
        
        if (measure.scrollHeight <= contentHeight) {
          low = mid + 1;
          goodBreakPoint = mid;
        } else {
          high = mid - 1;
        }
      }
      
      // If we couldn't find a good break point, use what we have
      if (goodBreakPoint === -1) {
        goodBreakPoint = Math.max(1, high); // At least one character
      }
      
      // Find a good natural break point
      let breakPoint = findNaturalBreakPoint(remainingText, goodBreakPoint);
      
      result.push(remainingText.substring(0, breakPoint));
      remainingText = remainingText.substring(breakPoint);
    }
    
    setPages(result.length > 0 ? result : ['']);
    return result.length > 0 ? result : [''];
  }, [content, contentWidth, contentHeight]);
  
  return { pages, calculatePages, measureRef };
}

// Helper function to find natural break points
function findNaturalBreakPoint(text: string, calculatedBreakPoint: number): number {
  let breakPoint = calculatedBreakPoint;
  
  // Try to find paragraph break
  const paragraphBreak = text.lastIndexOf('\n\n', breakPoint);
  if (paragraphBreak !== -1 && paragraphBreak > breakPoint * 0.8) {
    return paragraphBreak + 2;
  }
  
  // Try to find line break
  const lineBreak = text.lastIndexOf('\n', breakPoint);
  if (lineBreak !== -1 && lineBreak > breakPoint * 0.9) {
    return lineBreak + 1;
  }
  
  // Try to find sentence end
  const sentenceBreaks = [
    text.lastIndexOf('. ', breakPoint),
    text.lastIndexOf('! ', breakPoint),
    text.lastIndexOf('? ', breakPoint)
  ];
  const sentenceBreak = Math.max(...sentenceBreaks);
  if (sentenceBreak !== -1 && sentenceBreak > breakPoint * 0.9) {
    return sentenceBreak + 2;
  }
  
  // Try to find word break
  const wordBreak = text.lastIndexOf(' ', breakPoint);
  if (wordBreak !== -1 && wordBreak > breakPoint * 0.9) {
    return wordBreak + 1;
  }
  
  // If no natural break found, use the calculated break point
  return breakPoint;
}