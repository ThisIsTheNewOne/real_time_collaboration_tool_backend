import { PageSettings } from "@/components/PageEditor";
import { jsPDF } from "jspdf";

export const generatePdf = (content: string, settings: PageSettings, title?: string) => {
  // Get the pre-paginated content from the editor
  const pages = content.split(/\f/g);
  
  // Create PDF with EXACT dimensions from settings (no scaling)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px", // Use pixels to match UI dimensions exactly
    format: [settings.pageWidth, settings.pageHeight],
    putOnlyUsedFonts: true,
    hotfixes: ["px_scaling"]
  });

  // Use exact settings without scaling
  const fontSize = settings.fontSize;
  const lineSpacing = fontSize * settings.lineHeight;
  
  // Set font and size
  pdf.setFont("Helvetica");
  pdf.setFontSize(fontSize);
  
  // Adjust margins to match UI - remove left padding
  const topMargin = 20;
  const leftMargin = 0; // Remove left padding
  const rightMargin = 30;
  
  pages.forEach((pageContent, index) => {
    if (index > 0) {
      // Add new page with EXACT dimensions (no scaling)
      pdf.addPage([900, settings.pageHeight]);
    }
    
    // Process text with proper wrapping
    const lines = pageContent.split('\n');
    let yPosition = topMargin;
    
    lines.forEach(line => {
      if (line.trim() === '') {
        // Handle empty lines
        yPosition += lineSpacing;
      } else {
        // Use textLines to properly wrap text with adjusted margins
        const wrappedText = pdf.splitTextToSize(
          line, 
          settings.pageWidth - (leftMargin + rightMargin)
        );
        
        pdf.text(wrappedText, leftMargin, yPosition);
        yPosition += lineSpacing * wrappedText.length;
      }
    });
  });
  
  pdf.save(title !== undefined ?  title : "document.pdf");
  return pdf;
};