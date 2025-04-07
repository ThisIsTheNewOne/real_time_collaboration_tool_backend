import { useCallback, RefObject } from 'react';
import { PageSettings } from '../components/PageEditor';

interface TextPaginationProps {
  contentMeasureRef: RefObject<HTMLDivElement | null>;
  settings: PageSettings;
}

/**
 * Custom hook for paginating text content based on page height constraints
 */
export const useTextPagination = ({ contentMeasureRef, settings }: TextPaginationProps) => {
  /**
   * Splits content into pages with a safety buffer to prevent overflow
   * Uses binary search to efficiently find optimal split points
   */
  const splitIntoPages = useCallback(
    (text: string) => {
      const measureDiv = contentMeasureRef.current;
      if (!measureDiv) return [text];

      let remainingText = text;
      const result: string[] = [];

      while (remainingText.length > 0) {
        // Test if current text fits in a page (with buffer)
        measureDiv.textContent = remainingText;
        const height = measureDiv.scrollHeight;

        // Using a reduced threshold to ensure we split before scrollbars appear
        if (height <= settings.pageHeight - settings.bufferHeight) {
          // All remaining text fits on one page
          result.push(remainingText);
          break;
        } else {
          // More precise split point calculation
          // Start with a binary search approach to find the optimal split point
          let low = 0;
          let high = remainingText.length;
          let bestSplitPoint = 0;
          let iterations = 0;
          const maxIterations = 20; // Prevent infinite loops

          while (low <= high && iterations < maxIterations) {
            iterations++;
            const mid = Math.floor((low + high) / 2);

            // Check if this much text fits
            measureDiv.textContent = remainingText.substring(0, mid);
            const midHeight = measureDiv.scrollHeight;

            if (midHeight <= settings.pageHeight - settings.bufferHeight) {
              // This fits, try to include more
              bestSplitPoint = mid;
              low = mid + 1;
            } else {
              // Too much text, try less
              high = mid - 1;
            }
          }

          // Once we have a good approximate split point, find a clean break
          let splitPoint = bestSplitPoint;

          // Find the nearest line break for cleaner splits
          const nearestBreak = remainingText.lastIndexOf("\n", splitPoint);
          if (nearestBreak > 0 && nearestBreak > splitPoint - 200) {
            // Only use line break if it's reasonably close to optimal split
            splitPoint = nearestBreak + 1;
          } else {
            // If no good line break, find a space
            const nearestSpace = remainingText.lastIndexOf(" ", splitPoint);
            if (nearestSpace > 0 && nearestSpace > splitPoint - 50) {
              splitPoint = nearestSpace + 1;
            }
          }

          // Ensure we're making progress
          if (splitPoint <= 0) {
            splitPoint = Math.max(1, bestSplitPoint);
          }

          // Add this page and continue with remaining text
          result.push(remainingText.substring(0, splitPoint));
          remainingText = remainingText.substring(splitPoint);
        }
      }

      return result.length === 0 ? [""] : result;
    },
    [settings.pageHeight, settings.bufferHeight, contentMeasureRef]
  );

  /**
   * Checks if content is approaching overflow threshold
   */
  const isApproachingOverflow = useCallback(
    (text: string): boolean => {
      if (!contentMeasureRef.current) return false;

      contentMeasureRef.current.textContent = text;
      // Use a lower threshold to trigger page splits before scrollbars appear
      return (
        contentMeasureRef.current.scrollHeight >
        settings.pageHeight - settings.bufferHeight
      );
    },
    [settings.pageHeight, settings.bufferHeight, contentMeasureRef]
  );

  return { splitIntoPages, isApproachingOverflow };
};