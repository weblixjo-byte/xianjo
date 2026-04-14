/**
 * Generates a PassPRNT URL for the given element.
 * 
 * @param elementId The ID of the HTML element to capture.
 * @param fileName The filename for the PDF (optional).
 * @returns A promise that resolves to the starpassprnt:// URL.
 */
export async function generatePassPrntUrl(elementId: string): Promise<string> {
  if (typeof window === 'undefined') return '';

  const [html2canvas, jspdfModule] = await Promise.all([
    import('html2canvas').then(m => m.default),
    import('jspdf')
  ]);
  const { jsPDF } = jspdfModule;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found.`);
  }

  // Ensure the element is visible for capture (temporarily if needed)
  const originalStyle = element.style.display;
  const originalPosition = element.style.position;
  const originalLeft = element.style.left;
  
  // We need it to be visible but off-screen for html2canvas to work reliably if it's currently hidden
  if (originalStyle === 'none' || element.classList.contains('hidden')) {
    element.style.display = 'block';
    element.style.position = 'fixed';
    element.style.left = '-9999px';
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // Higher quality for thermal printing
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Reset styles
    element.style.display = originalStyle;
    element.style.position = originalPosition;
    element.style.left = originalLeft;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Thermal paper 80mm
    const pdfWidth = 80;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // Get base64 string (remove data:application/pdf;base64, prefix)
    const pdfBase64 = pdf.output('datauristring').split(',')[1];
    
    // RFC3986 compliant encoding
    const rfc3986Encode = (str: string) => {
      return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    };

    const encodedPdf = rfc3986Encode(pdfBase64);
    const backUrl = rfc3986Encode(window.location.href);

    // Construct PassPRNT URL
    // v1/print/nopreview means print immediately without preview in PassPRNT app
    return `starpassprnt://v1/print/nopreview?pdf=${encodedPdf}&back=${backUrl}`;
  } catch (error) {
    // Reset styles even on error
    element.style.display = originalStyle;
    element.style.position = originalPosition;
    element.style.left = originalLeft;
    throw error;
  }
}
