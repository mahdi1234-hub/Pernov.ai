"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NivoChart, NivoDashboard } from "@/components/NivoCharts";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { PdfPreview, useReportGenerator } from "@/components/PdfGenerator";

interface FileAttachment { name: string; type: string; content: string; size: number; }
interface Message { id: string; role: "user" | "assistant"; content: string; files?: FileAttachment[]; }
/* eslint-disable @typescript-eslint/no-explicit-any */
interface ChartData { type: string; title?: string; data: any[]; keys?: string[]; indexBy?: string; }
interface DashboardData { title: string; charts: ChartData[]; }
interface ReportData { title: string; subtitle?: string; sections: { heading: string; content: string; imageQuery?: string; imageUrl?: string }[]; charts?: ChartData[]; }

function parseContentBlocks(content: string) {
  const blocks: { type: string; content: string; data?: unknown }[] = [];
  const chartRegex = /```nivo-chart\s*\n([\s\S]*?)```/g;
  const dashboardRegex = /```nivo-dashboard\s*\n([\s\S]*?)```/g;
  const reportRegex = /```generate-report\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  const allMatches: { index: number; end: number; type: string; raw: string }[] = [];
  let match;
  while ((match = chartRegex.exec(content)) !== null) { allMatches.push({ index: match.index, end: match.index + match[0].length, type: "chart", raw: match[1] }); }
  while ((match = dashboardRegex.exec(content)) !== null) { allMatches.push({ index: match.index, end: match.index + match[0].length, type: "dashboard", raw: match[1] }); }
  while ((match = reportRegex.exec(content)) !== null) { allMatches.push({ index: match.index, end: match.index + match[0].length, type: "report", raw: match[1] }); }
  allMatches.sort((a, b) => a.index - b.index);
  for (const m of allMatches) {
    if (m.index > lastIndex) { const text = content.substring(lastIndex, m.index).trim(); if (text) blocks.push({ type: "text", content: text }); }
    try { const data = JSON.parse(m.raw); blocks.push({ type: m.type, content: m.raw, data }); } catch { blocks.push({ type: "text", content: m.raw }); }
    lastIndex = m.end;
  }
  if (lastIndex < content.length) { const text = content.substring(lastIndex).trim(); if (text) blocks.push({ type: "text", content: text }); }
  if (blocks.length === 0 && content.trim()) { blocks.push({ type: "text", content: content.trim() }); }
  return blocks;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { generateReport } = useReportGenerator();

  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleFileUpload = async (fileList: FileList) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(fileList).forEach((f) => formData.append("files", f));
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFiles((prev) => [...prev, ...data.files]);
    } catch (error) { console.error("Upload error:", error); } finally { setIsUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files); };
  const removeFile = (index: number) => { setFiles((prev) => prev.filter((_, i) => i !== index)); };

  const handleGenerateReport = async (reportData: ReportData) => {
    try {
      const res = await fetch("/api/generate-pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reportData) });
      const enrichedData = await res.json();
      const url = await generateReport(enrichedData);
      setPdfPreviewUrl(url);
      setPdfPreviewTitle(reportData.title);
    } catch (error) { console.error("Report generation error:", error); }
  };

  const handleDashboardPdf = async (dashboard: DashboardData) => {
    const reportData: ReportData = { title: dashboard.title, subtitle: "Dashboard Report Export",
      sections: dashboard.charts.map((chart) => ({ heading: chart.title || chart.type + " Chart", content: "This chart displays " + chart.type + " visualization with " + (Array.isArray(chart.data) ? chart.data.length : 0) + " data points.", imageQuery: chart.title || "data analytics dashboard" })),
      charts: dashboard.charts };
    await handleGenerateReport(reportData);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input.trim(), files: files.length > 0 ? [...files] : undefined };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    const currentFiles = [...files];
    setFiles([]);
    setIsStreaming(true);
    const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);
    try {
      const fileContext = currentFiles.length > 0 ? currentFiles.map((f) => "--- FILE: " + f.name + " (" + f.type + ") ---\n" + f.content).join("\n\n") : undefined;
      const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: apiMessages, fileContext }) });
      if (!response.ok) throw new Error("Failed to send message");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");
      let accumulatedContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try { const parsed = JSON.parse(data); const content = parsed.content || ""; if (content) { accumulatedContent += content; const currentContent = accumulatedContent; setMessages((prev) => prev.map((m) => m.id === assistantMessage.id ? { ...m, content: currentContent } : m)); } } catch { /* skip */ }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.map((m) => m.id === assistantMessage.id ? { ...m, content: "I apologize, but I encountered an error. Please try again." } : m));
    } finally { setIsStreaming(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "PDF";
    if (type.includes("word") || type.includes("docx")) return "DOC";
    if (type.includes("sheet") || type.includes("csv") || type.includes("xlsx")) return "XLS";
    if (type.includes("image")) return "IMG";
    if (type.includes("json")) return "JSON";
    return "FILE";
  };

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden" onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/46011e44-1f9d-4c5e-b716-300b8ce1381e_3840w.jpg" alt="Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {dragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="border-2 border-dashed border-indigo-400 rounded-2xl p-16 text-center">
            <svg className="w-16 h-16 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="text-white text-lg font-light">Drop files here to upload</p>
            <p className="text-white/40 text-sm mt-2">PDF, DOCX, CSV, XLSX, Images, and more</p>
          </div>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] uppercase tracking-widest font-medium">Back</span>
        </button>
        <div className="text-center">
          <h2 className="text-white text-sm font-light tracking-widest uppercase" style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", letterSpacing: "0.2em" }}>NOVERA</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">AI Assistant</p>
        </div>
        <button onClick={() => { setMessages([]); setFiles([]); }} className="text-white/60 hover:text-white transition-colors duration-300">
          <span className="text-[10px] uppercase tracking-widest font-medium">Clear</span>
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto chat-scroll px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
              <div className="space-y-6">
                <h3 className="text-white/80 text-2xl md:text-3xl font-light" style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", letterSpacing: "-0.03em" }}>How may I assist you?</h3>
                <p className="text-white/40 text-sm font-light max-w-md">Upload files, ask for data analysis, generate charts, create dashboards, or build professional PDF reports.</p>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  {["Analyze my uploaded file", "Generate a sales dashboard", "Create a solar energy report", "Show me a pie chart"].map((suggestion) => (
                    <button key={suggestion} onClick={() => { setInput(suggestion); inputRef.current?.focus(); }} className="text-[10px] uppercase tracking-widest text-white/40 border border-white/15 px-4 py-2 rounded-[2px] hover:text-white/80 hover:border-white/30 transition-all duration-300">{suggestion}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message-in flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-[80%] ${message.role === "user" ? "bg-white/15 backdrop-blur-md border border-white/20 text-white" : "bg-white/5 backdrop-blur-md border border-white/10 text-white/90"} px-5 py-4 rounded-lg`}>
                {message.role === "assistant" && (<span className="block text-[9px] uppercase tracking-widest text-white/30 mb-2" style={{ letterSpacing: "0.15em" }}>NOVERA</span>)}
                {message.files && message.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {message.files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/10 rounded px-3 py-1.5">
                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-400/20 px-1.5 py-0.5 rounded">{getFileIcon(file.type)}</span>
                        <span className="text-xs text-white/70 truncate max-w-[150px]">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {message.role === "assistant" && message.content ? (
                  <div>
                    {parseContentBlocks(message.content).map((block, idx) => {
                      if (block.type === "chart" && block.data) return <NivoChart key={idx} chart={block.data as ChartData} />;
                      if (block.type === "dashboard" && block.data) return <NivoDashboard key={idx} dashboard={block.data as DashboardData} onDownloadPdf={() => handleDashboardPdf(block.data as DashboardData)} />;
                      if (block.type === "report" && block.data) {
                        const reportData = block.data as ReportData;
                        return (
                          <div key={idx} className="my-4">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" /></svg>
                                <div><h4 className="text-white text-sm font-medium">{reportData.title}</h4><p className="text-white/40 text-[10px]">{reportData.sections?.length || 0} sections - PDF Report</p></div>
                              </div>
                              <button onClick={() => handleGenerateReport(reportData)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs uppercase tracking-widest px-4 py-3 rounded transition-all duration-300 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Generate and Preview PDF Report
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return <MarkdownRenderer key={idx} content={block.content} />;
                    })}
                  </div>
                ) : (
                  <div className="text-sm font-light leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {message.role === "assistant" && isStreaming && message.id === messages[messages.length - 1]?.id && !message.content && (
                      <span className="inline-flex gap-1 ml-1"><span className="typing-dot w-1.5 h-1.5 bg-white/60 rounded-full inline-block" /><span className="typing-dot w-1.5 h-1.5 bg-white/60 rounded-full inline-block" /><span className="typing-dot w-1.5 h-1.5 bg-white/60 rounded-full inline-block" /></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {files.length > 0 && (
        <div className="relative z-10 px-4 md:px-8 pt-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded px-3 py-2 group">
                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-400/20 px-1.5 py-0.5 rounded">{getFileIcon(file.type)}</span>
                  <span className="text-xs text-white/70 truncate max-w-[150px]">{file.name}</span>
                  <span className="text-[10px] text-white/30">{(file.size / 1024).toFixed(0)}KB</span>
                  <button onClick={() => removeFile(idx)} className="text-white/30 hover:text-red-400 transition-colors ml-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 px-4 md:px-8 py-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-5 py-3">
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="text-white/40 hover:text-white/80 transition-colors duration-300 pb-0.5" title="Attach files">
              {isUploading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              )}
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={(e) => e.target.files && handleFileUpload(e.target.files)} className="hidden" accept=".pdf,.docx,.doc,.csv,.xlsx,.xls,.json,.txt,.md,.xml,.html,.py,.js,.ts,.java,.c,.cpp,.css,.sql,.yaml,.yml,.png,.jpg,.jpeg,.gif,.webp,.svg" />
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything, upload files, or request charts..." rows={1} className="flex-1 bg-transparent text-white text-sm font-light placeholder-white/30 outline-none resize-none max-h-32" style={{ lineHeight: "1.6" }} disabled={isStreaming} />
            <button onClick={sendMessage} disabled={!input.trim() || isStreaming} className="text-white/40 hover:text-white disabled:opacity-30 transition-all duration-300 pb-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
          <p className="text-center text-white/20 text-[10px] mt-3 tracking-wider uppercase">Made With Love By Louati Mahdi</p>
        </div>
      </div>

      {pdfPreviewUrl && (<PdfPreview url={pdfPreviewUrl} title={pdfPreviewTitle} onClose={() => { setPdfPreviewUrl(null); setPdfPreviewTitle(""); }} />)}
    </div>
  );
}
