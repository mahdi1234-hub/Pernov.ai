import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";
import * as Papa from "papaparse";
import Groq from "groq-sdk";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export interface ParsedFile {
  name: string;
  type: string;
  content: string;
  size: number;
}

async function analyzeImageWithVision(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image in detail. Describe everything you see: all text content, objects, colors, layout, data, charts, UI elements, people, scenes, and any other relevant information. Be thorough and precise.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 2048,
    });

    const description =
      response.choices[0]?.message?.content || "Unable to analyze image";
    return `[Image Analysis of ${fileName}]\nFile: ${fileName} (${mimeType}, ${buffer.length} bytes)\n\nDetailed Description:\n${description}`;
  } catch (error) {
    return `[Image file: ${fileName} (${mimeType}, ${buffer.length} bytes). Vision analysis failed: ${error instanceof Error ? error.message : "Unknown error"}]`;
  }
}

async function analyzeVideo(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const tmpBase = tmpdir();
  const timestamp = Date.now();
  const videoPath = join(tmpBase, `${timestamp}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
  const framePath = join(tmpBase, `${timestamp}_frame.jpg`);

  try {
    writeFileSync(videoPath, buffer);

    // Extract metadata with ffprobe
    let metadata = "";
    try {
      const probeOutput = execSync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`,
        { timeout: 30000 }
      ).toString();
      const probeData = JSON.parse(probeOutput);

      const format = probeData.format || {};
      const videoStream = (probeData.streams || []).find(
        (s: { codec_type: string }) => s.codec_type === "video"
      );
      const audioStream = (probeData.streams || []).find(
        (s: { codec_type: string }) => s.codec_type === "audio"
      );

      metadata += `File: ${fileName} (${mimeType}, ${buffer.length} bytes)\n`;
      metadata += `Duration: ${format.duration ? parseFloat(format.duration).toFixed(2) + " seconds" : "Unknown"}\n`;
      metadata += `Format: ${format.format_long_name || format.format_name || "Unknown"}\n`;
      metadata += `Bitrate: ${format.bit_rate ? (parseInt(format.bit_rate) / 1000).toFixed(0) + " kbps" : "Unknown"}\n`;

      if (videoStream) {
        metadata += `Video Codec: ${videoStream.codec_long_name || videoStream.codec_name || "Unknown"}\n`;
        metadata += `Resolution: ${videoStream.width || "?"}x${videoStream.height || "?"}\n`;
        metadata += `Frame Rate: ${videoStream.r_frame_rate || "Unknown"}\n`;
      }
      if (audioStream) {
        metadata += `Audio Codec: ${audioStream.codec_long_name || audioStream.codec_name || "Unknown"}\n`;
        metadata += `Sample Rate: ${audioStream.sample_rate ? audioStream.sample_rate + " Hz" : "Unknown"}\n`;
        metadata += `Channels: ${audioStream.channels || "Unknown"}\n`;
      }
    } catch {
      metadata = `File: ${fileName} (${mimeType}, ${buffer.length} bytes)\nMetadata extraction failed.\n`;
    }

    // Extract a frame for visual analysis
    let frameAnalysis = "";
    try {
      execSync(
        `ffmpeg -y -i "${videoPath}" -ss 00:00:01 -frames:v 1 -q:v 2 "${framePath}"`,
        { timeout: 30000 }
      );

      if (existsSync(framePath)) {
        const frameBuffer = readFileSync(framePath);
        frameAnalysis = await analyzeImageWithVision(
          frameBuffer,
          `${fileName}_frame.jpg`,
          "image/jpeg"
        );
        frameAnalysis = frameAnalysis.replace(
          /^\[Image Analysis of .*\]\n/,
          ""
        );
        frameAnalysis = `\nFrame Analysis (captured at 1s):\n${frameAnalysis}`;
      }
    } catch {
      frameAnalysis = "\nFrame extraction failed - could not capture a preview frame.";
    }

    return `[Video Analysis of ${fileName}]\n${metadata}${frameAnalysis}`;
  } catch (error) {
    return `[Video file: ${fileName} (${mimeType}, ${buffer.length} bytes). Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}]`;
  } finally {
    try { if (existsSync(videoPath)) unlinkSync(videoPath); } catch { /* cleanup */ }
    try { if (existsSync(framePath)) unlinkSync(framePath); } catch { /* cleanup */ }
  }
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
      const uint8 = new Uint8Array(buffer);
      const parser = new PDFParse(uint8);
      const data = await parser.getText();
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
      mimeType.startsWith("image/") ||
      ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)
    ) {
      content = await analyzeImageWithVision(buffer, fileName, mimeType || `image/${ext}`);
    } else if (
      mimeType.startsWith("video/") ||
      ["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv"].includes(ext)
    ) {
      content = await analyzeVideo(buffer, fileName, mimeType || `video/${ext}`);
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
