"use client";

import { useCallback } from "react";
import jsPDF from "jspdf";

interface ReportSection {
  heading: string;
  content: string;
  imageQuery?: string;
  imageUrl?: string;
}

interface ChartData {
  type: string;
  title?: string;
  data: Record<string, unknown>[];
  keys?: string[];
  indexBy?: string;
}

interface ReportData {
  title: string;
  subtitle?: string;
  sections: ReportSection[];
  charts?: ChartData[];
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    const wrapped = doc.splitTextToSize(paragraph, maxWidth);
    lines.push(...wrapped);
  }
  return lines;
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Powered With Louati Mahdi", 20, pageHeight - 12);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pageHeight - 12, {
    align: "right",
  });
}

export function useReportGenerator() {
  const generateReport = useCallback(
    async (reportData: ReportData): Promise<string> => {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let currentY = 0;
      const tocEntries: { title: string; page: number }[] = [];
      let currentPage = 1;

      // === COVER PAGE ===
      // Background gradient effect
      doc.setFillColor(26, 26, 46);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Decorative elements
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageWidth, 4, "F");

      // Try to fetch cover image
      let coverImageData: string | null = null;
      if (reportData.sections[0]?.imageQuery) {
        try {
          const res = await fetch(
            `/api/unsplash?query=${encodeURIComponent(reportData.sections[0].imageQuery)}&count=1`
          );
          const data = await res.json();
          if (data.images && data.images[0]) {
            coverImageData = await fetchImageAsBase64(data.images[0].url);
          }
        } catch {
          // Skip cover image
        }
      }

      if (coverImageData) {
        doc.addImage(coverImageData, "JPEG", 0, 0, pageWidth, pageHeight * 0.5);
        // Overlay gradient
        doc.setFillColor(26, 26, 46);
        doc.setGState(new (doc as unknown as { GState: new (opts: { opacity: number }) => unknown }).GState({ opacity: 0.7 }));
        doc.rect(0, 0, pageWidth, pageHeight * 0.5, "F");
        doc.setGState(new (doc as unknown as { GState: new (opts: { opacity: number }) => unknown }).GState({ opacity: 1 }));
      }

      // Title
      currentY = coverImageData ? pageHeight * 0.35 : pageHeight * 0.3;
      doc.setFontSize(32);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      const titleLines = wrapText(doc, reportData.title, contentWidth);
      for (const line of titleLines) {
        doc.text(line, pageWidth / 2, currentY, { align: "center" });
        currentY += 14;
      }

      // Subtitle
      if (reportData.subtitle) {
        currentY += 5;
        doc.setFontSize(14);
        doc.setTextColor(180, 180, 220);
        doc.setFont("helvetica", "normal");
        const subLines = wrapText(doc, reportData.subtitle, contentWidth);
        for (const line of subLines) {
          doc.text(line, pageWidth / 2, currentY, { align: "center" });
          currentY += 7;
        }
      }

      // Decorative line
      currentY += 10;
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 30, currentY, pageWidth / 2 + 30, currentY);

      // Date
      currentY += 10;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 180);
      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        pageWidth / 2,
        currentY,
        { align: "center" }
      );

      // Footer on cover
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 130);
      doc.text("Powered With Louati Mahdi", pageWidth / 2, pageHeight - 15, {
        align: "center",
      });

      // === TABLE OF CONTENTS ===
      doc.addPage();
      currentPage = 2;
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      currentY = 40;
      doc.setFontSize(24);
      doc.setTextColor(26, 26, 46);
      doc.setFont("helvetica", "bold");
      doc.text("Table of Contents", margin, currentY);

      currentY += 5;
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(1);
      doc.line(margin, currentY, margin + 50, currentY);
      currentY += 15;

      // We'll fill in page numbers after generating content
      const tocStartY = currentY;
      const tocPageNum = currentPage;

      // === CONTENT SECTIONS ===
      let sectionStartPage = currentPage + 1;

      for (let i = 0; i < reportData.sections.length; i++) {
        const section = reportData.sections[i];
        doc.addPage();
        currentPage++;
        sectionStartPage = currentPage;
        tocEntries.push({ title: section.heading, page: sectionStartPage });

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        // Section header accent bar
        doc.setFillColor(99, 102, 241);
        doc.rect(margin, 25, 4, 20, "F");

        currentY = 30;
        doc.setFontSize(20);
        doc.setTextColor(26, 26, 46);
        doc.setFont("helvetica", "bold");
        const headingLines = wrapText(doc, section.heading, contentWidth - 10);
        for (const line of headingLines) {
          doc.text(line, margin + 10, currentY);
          currentY += 10;
        }

        currentY += 5;
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;

        // Section image
        if (section.imageUrl) {
          try {
            const imgData = await fetchImageAsBase64(section.imageUrl);
            if (imgData) {
              const imgHeight = 60;
              if (currentY + imgHeight > pageHeight - 30) {
                doc.addPage();
                currentPage++;
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, pageWidth, pageHeight, "F");
                currentY = 30;
              }
              doc.addImage(imgData, "JPEG", margin, currentY, contentWidth, imgHeight);
              currentY += imgHeight + 8;
            }
          } catch {
            // Skip image
          }
        }

        // Section content
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 80);
        doc.setFont("helvetica", "normal");
        const contentLines = wrapText(doc, section.content, contentWidth);
        for (const line of contentLines) {
          if (currentY > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            currentY = 30;
          }
          doc.text(line, margin, currentY);
          currentY += 6;
        }
      }

      // === ADD PAGE NUMBERS AND FOOTERS ===
      const totalPages = currentPage;
      for (let p = 2; p <= totalPages; p++) {
        doc.setPage(p);
        addFooter(doc, p, totalPages);
      }

      // === FILL IN TOC ===
      doc.setPage(tocPageNum);
      let tocY = tocStartY;
      doc.setFontSize(12);
      for (const entry of tocEntries) {
        doc.setTextColor(60, 60, 80);
        doc.setFont("helvetica", "normal");
        doc.text(entry.title, margin + 5, tocY);

        // Dotted line
        const titleWidth = doc.getTextWidth(entry.title);
        const pageNumStr = entry.page.toString();
        const pageNumWidth = doc.getTextWidth(pageNumStr);
        const dotsStart = margin + 5 + titleWidth + 3;
        const dotsEnd = pageWidth - margin - pageNumWidth - 3;

        doc.setTextColor(180, 180, 180);
        let dotX = dotsStart;
        while (dotX < dotsEnd) {
          doc.text(".", dotX, tocY);
          dotX += 2;
        }

        doc.setTextColor(99, 102, 241);
        doc.setFont("helvetica", "bold");
        doc.text(pageNumStr, pageWidth - margin, tocY, { align: "right" });

        tocY += 10;
      }

      // Generate PDF blob URL
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      return url;
    },
    []
  );

  return { generateReport };
}

export function PdfPreview({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[90vh] bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              <path d="M14 2v6h6" />
            </svg>
            <div>
              <h3 className="text-white text-sm font-medium">{title}</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">
                PDF Report Preview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={url}
              download={`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs uppercase tracking-widest px-4 py-2 rounded transition-all duration-300"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </a>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        </div>
        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 text-center">
          <p className="text-white/30 text-[10px] tracking-widest uppercase">
            Powered With Louati Mahdi
          </p>
        </div>
      </div>
    </div>
  );
}
