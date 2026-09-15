import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportPdfOptions {
  /** The HTML element or element ID to export */
  elementOrId: string | HTMLElement;
  /** File name for the downloaded PDF (default: "report.pdf") */
  fileName?: string;
  /** PDF Page orientation: 'portrait' | 'landscape' (default: "landscape") */
  orientation?: "portrait" | "landscape";
  /** PDF Page format: 'a4' | 'letter' | 'a3' (default: "a4") */
  format?: "a4" | "letter" | "a3";
  /** Resolution scaling factor for html2canvas (default: 1.5 for optimal speed and HD quality) */
  scale?: number;
  /** Margin around page content in mm (default: 10) */
  margin?: number;
  /** Background color for canvas capture */
  backgroundColor?: string;
  /** Callback triggered before PDF generation starts */
  onStart?: () => void;
  /** Callback triggered when PDF generation succeeds */
  onSuccess?: () => void;
  /** Callback triggered when PDF generation fails */
  onError?: (error: Error) => void;
}

/**
 * Robust JavaScript/TypeScript function to export specified HTML content or page section as a PDF file.
 * Preserves content layout, text, tables, charts/images, and styling.
 * Automatically triggers browser download via Blob URL for maximum cross-browser compatibility.
 */
export async function exportElementToPdf(
  options: ExportPdfOptions,
): Promise<boolean> {
  const {
    elementOrId,
    fileName = "report.pdf",
    orientation = "landscape",
    format = "a4",
    scale = 1.5,
    margin = 10,
    backgroundColor = "#F1F5F9",
    onStart,
    onSuccess,
    onError,
  } = options;

  try {
    if (onStart) onStart();

    const targetElement =
      typeof elementOrId === "string"
        ? document.getElementById(elementOrId)
        : elementOrId;

    if (!targetElement) {
      throw new Error(
        `Target element '${typeof elementOrId === "string" ? elementOrId : "DOM Element"}' was not found.`,
      );
    }

    // Capture target element via html2canvas
    const canvas = await html2canvas(targetElement, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: backgroundColor,
      windowWidth: document.documentElement.clientWidth || 1200,
      onclone: (clonedDoc) => {
        // 1. Hide no-print elements and modal backdrops in clone
        const noPrintEls = clonedDoc.querySelectorAll(".no-print");
        noPrintEls.forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });

        // 2. Fix SVG element dimensions (e.g. Recharts charts) for html2canvas compatibility
        const svgs = clonedDoc.querySelectorAll("svg");
        svgs.forEach((svg) => {
          try {
            const rect = svg.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              svg.setAttribute("width", `${Math.round(rect.width)}`);
              svg.setAttribute("height", `${Math.round(rect.height)}`);
            }
          } catch (error) {
            console.error("[exportElementToPdf Error]:", error);
            // Ignore SVG bbox measurement errors
          }
        });
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas rendering produced an empty screenshot.");
    }

    // Convert canvas snapshot to PNG base64 string
    const imgData = canvas.toDataURL("image/png");

    // Initialize jsPDF document instance
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const printableWidth = pdfWidth - margin * 2;
    const printableHeight = pdfHeight - margin * 2;

    const imgWidth = printableWidth;
    const imgHeight = (canvas.height * printableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // Render first page
    pdf.addImage(
      imgData,
      "PNG",
      margin,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST",
    );
    heightLeft -= printableHeight;

    // Multipage slicing for larger content
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(
        imgData,
        "PNG",
        margin,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST",
      );
      heightLeft -= printableHeight;
    }

    const cleanFileName = fileName.endsWith(".pdf")
      ? fileName
      : `${fileName}.pdf`;

    // Force automatic browser file download using Blob URL
    try {
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = cleanFileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch (error) {
      console.error("[exportElementToPdf Error]:", error);
      pdf.save(cleanFileName);
    }

    if (onSuccess) onSuccess();
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[exportElementToPdf Error]:", err);
    if (onError) {
      onError(err);
    } else {
      alert(`Export PDF Error: ${err.message}`);
    }
    return false;
  }
}
