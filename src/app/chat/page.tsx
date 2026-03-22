"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_MESSAGE = {
  role: "system" as const,
  content:
    "You are NOVERA AI, a refined and sophisticated assistant. You communicate with elegance and precision, offering thoughtful, well-structured responses. You are knowledgeable across many domains and always maintain a warm yet professional tone. Keep responses concise but insightful.",
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const apiMessages = [
        SYSTEM_MESSAGE,
        ...updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
        }),
      });

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

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                accumulatedContent += content;
                const currentContent = accumulatedContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: currentContent }
                      : m
                  )
                );
              }
            } catch {
              // skip malformed JSON chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content:
                  "I apologize, but I encountered an error. Please try again.",
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/46011e44-1f9d-4c5e-b716-300b8ce1381e_3840w.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-300"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-[10px] uppercase tracking-widest font-medium">
            Back
          </span>
        </button>

        <div className="text-center">
          <h2
            className="text-white text-sm font-light tracking-widest uppercase"
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              letterSpacing: "0.2em",
            }}
          >
            NOVERA
          </h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">
            AI Assistant
          </p>
        </div>

        <button
          onClick={() => {
            setMessages([]);
          }}
          className="text-white/60 hover:text-white transition-colors duration-300"
        >
          <span className="text-[10px] uppercase tracking-widest font-medium">
            Clear
          </span>
        </button>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto chat-scroll px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
              <div className="space-y-6">
                <h3
                  className="text-white/80 text-2xl md:text-3xl font-light"
                  style={{
                    fontFamily:
                      "var(--font-dm-sans), 'DM Sans', sans-serif",
                    letterSpacing: "-0.03em",
                  }}
                >
                  How may I assist you?
                </h3>
                <p className="text-white/40 text-sm font-light max-w-md">
                  Ask me anything. I&apos;m here to provide thoughtful,
                  refined answers to your questions.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  {[
                    "Tell me about architecture",
                    "Explain quantum computing",
                    "Write a poem",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="text-[10px] uppercase tracking-widest text-white/40 border border-white/15 px-4 py-2 rounded-[2px] hover:text-white/80 hover:border-white/30 transition-all duration-300"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-in flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] ${
                  message.role === "user"
                    ? "bg-white/15 backdrop-blur-md border border-white/20 text-white"
                    : "bg-white/5 backdrop-blur-md border border-white/10 text-white/90"
                } px-5 py-4 rounded-[2px]`}
              >
                {message.role === "assistant" && (
                  <span
                    className="block text-[9px] uppercase tracking-widest text-white/30 mb-2"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    NOVERA
                  </span>
                )}
                <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">
                  {message.content}
                  {message.role === "assistant" &&
                    isStreaming &&
                    message.id ===
                      messages[messages.length - 1]?.id &&
                    !message.content && (
                      <span className="inline-flex gap-1 ml-1">
                        <span className="typing-dot w-1.5 h-1.5 bg-white/60 rounded-full inline-block" />
                        <span className="typing-dot w-1.5 h-1.5 bg-white/60 rounded-full inline-block" />
                        <span className="typing-dot w-1.5 h-1.5 bg-white/60 rounded-full inline-block" />
                      </span>
                    )}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 px-4 md:px-8 py-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2px] px-5 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 bg-transparent text-white text-sm font-light placeholder-white/30 outline-none resize-none max-h-32"
              style={{ lineHeight: "1.6" }}
              disabled={isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="text-white/40 hover:text-white disabled:opacity-30 transition-all duration-300 pb-0.5"
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
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <p className="text-center text-white/20 text-[10px] mt-3 tracking-wider uppercase">
            Made With Love With Louati Mahdi
          </p>
        </div>
      </div>
    </div>
  );
}
