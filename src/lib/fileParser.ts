import * as pdf from "pdf-parse";
import * as mammoth from "mammoth";
import * as Papa from "papaparse";

export interface ParsedFile {
  name: string;
  type: string;
  content: string;
  size: number;
}

export async function parseFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedFile> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  let content = "";

  try {
    if (mimeType === "application/pdf" || ext === "pdf") {
      const pdfParse = (pdf as unknown as { default: (buf: Buffer) => Promise<{ text: string }> }).default || pdf;
      const data = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer);
      content = data.text;
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else if (
      mimeType === "text/csv" ||
      ext === "csv"
    ) {
      const text = buffer.toString("utf-8");
      const parsed = Papa.parse(text, { header: true });
      content = JSON.stringify(parsed.data, null, 2);
    } else if (
      mimeType === "application/json" ||
      ext === "json"
    ) {
      content = buffer.toString("utf-8");
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      ext === "xlsx" ||
      ext === "xls"
    ) {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheets: Record<string, unknown[]> = {};
      for (const sheetName of workbook.SheetNames) {
        sheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      }
      content = JSON.stringify(sheets, null, 2);
    } else if (
      mimeType.startsWith("text/") ||
      ext === "txt" ||
      ext === "md" ||
      ext === "log" ||
      ext === "xml" ||
      ext === "html" ||
      ext === "htm" ||
      ext === "yaml" ||
      ext === "yml" ||
      ext === "ini" ||
      ext === "cfg" ||
      ext === "conf" ||
      ext === "js" ||
      ext === "ts" ||
      ext === "py" ||
      ext === "java" ||
      ext === "c" ||
      ext === "cpp" ||
      ext === "h" ||
      ext === "css" ||
      ext === "scss" ||
      ext === "sql"
    ) {
      content = buffer.toString("utf-8");
    } else if (mimeType.startsWith("image/")) {
      content = `[Image file: ${fileName} (${mimeType}, ${buffer.length} bytes). Image content cannot be read as text but was received.]`;
    } else {
      // Try to read as text
      try {
        content = buffer.toString("utf-8");
        // Check if it looks like binary
        const nonPrintable = content
          .split("")
          .filter((c) => {
            const code = c.charCodeAt(0);
            return code < 32 && code !== 10 && code !== 13 && code !== 9;
          }).length;
        if (nonPrintable > content.length * 0.1) {
          content = `[Binary file: ${fileName} (${mimeType}, ${buffer.length} bytes)]`;
        }
      } catch {
        content = `[Binary file: ${fileName} (${mimeType}, ${buffer.length} bytes)]`;
      }
    }
  } catch (error) {
    content = `[Error parsing file ${fileName}: ${error instanceof Error ? error.message : "Unknown error"}]`;
  }

  // Truncate very large content
  if (content.length > 50000) {
    content = content.substring(0, 50000) + "\n\n[Content truncated - showing first 50000 characters]";
  }

  return {
    name: fileName,
    type: mimeType,
    content,
    size: buffer.length,
  };
}
