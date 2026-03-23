import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface SearchSource {
  url: string;
  title: string;
  description?: string;
  content?: string;
  markdown?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

export interface SearchImage {
  url: string;
  title: string;
  thumbnail?: string;
  source?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query, messages } = (await request.json()) as {
      query: string;
      messages?: { role: string; content: string }[];
    };

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 1: Search with Firecrawl
    const searchResponse = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        sources: ["web", "news", "images"],
        limit: 6,
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
          maxAge: 86400000,
        },
      }),
    });

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      throw new Error(
        `Firecrawl API error: ${errorData.error || searchResponse.statusText}`
      );
    }

    const searchResult = await searchResponse.json();
    const searchData = searchResult.data || {};

    const webResults = searchData.web || [];
    const imagesData = searchData.images || [];

    // Transform web sources
    const sources: SearchSource[] = webResults
      .map(
        (item: {
          url: string;
          title?: string;
          description?: string;
          snippet?: string;
          content?: string;
          markdown?: string;
          favicon?: string;
          ogImage?: string;
          image?: string;
          metadata?: { ogImage?: string };
        }) => ({
          url: item.url,
          title: item.title || item.url,
          description: item.description || item.snippet,
          content: item.content,
          markdown: item.markdown,
          favicon: item.favicon,
          image: item.ogImage || item.image || item.metadata?.ogImage,
          siteName: new URL(item.url).hostname,
        })
      )
      .filter((item: SearchSource) => item.url);

    // Transform image results
    const imageResults: SearchImage[] = imagesData
      .map(
        (item: {
          url?: string;
          imageUrl?: string;
          title?: string;
        }) => {
          if (!item.url || !item.imageUrl) return null;
          return {
            url: item.url,
            title: item.title || "Untitled",
            thumbnail: item.imageUrl,
            source: item.url ? new URL(item.url).hostname : undefined,
          };
        }
      )
      .filter(Boolean) as SearchImage[];

    // Step 2: Fetch Unsplash images for the query
    let unsplashImages: { url: string; small: string; alt: string; credit: string }[] = [];
    if (unsplashKey) {
      try {
        const unsplashRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=4&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${unsplashKey}`,
            },
          }
        );
        if (unsplashRes.ok) {
          const unsplashData = await unsplashRes.json();
          unsplashImages = (unsplashData.results || []).map(
            (img: {
              urls: { regular: string; small: string };
              alt_description: string;
              user: { name: string };
            }) => ({
              url: img.urls.regular,
              small: img.urls.small,
              alt: img.alt_description || query,
              credit: img.user.name,
            })
          );
        }
      } catch {
        // Skip unsplash images on error
      }
    }

    // Step 3: Build context from sources for AI
    const context = sources
      .map((source: SearchSource, index: number) => {
        const content = source.markdown || source.content || "";
        const truncated =
          content.length > 2000 ? content.substring(0, 2000) + "..." : content;
        return `[${index + 1}] ${source.title}\nURL: ${source.url}\n${truncated}`;
      })
      .join("\n\n---\n\n");

    // Step 4: Stream AI response with Groq
    const systemContent = `You are NOVERA AI, a refined search assistant that provides accurate, well-sourced answers based on web search results.

RESPONSE RULES:
- Provide clear, concise answers based on the search results provided
- Include inline citations as [1], [2], etc. referencing the source order
- Use markdown for formatting (headers, bold, lists)
- Be factual and precise - only state what the sources support
- If sources don't have enough information, say so honestly
- Keep responses focused and well-organized
- NEVER use LaTeX/math syntax for regular numbers
- Write numbers as plain text: "1 million" NOT "$1$ million"`;

    const chatMessages = [
      { role: "system" as const, content: systemContent },
      ...(messages || []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user" as const,
        content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`,
      },
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: chatMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    });

    // Step 5: Stream response with sources metadata first, then AI text
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send sources and images as the first event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "sources",
                sources,
                imageResults,
                unsplashImages,
              })}\n\n`
            )
          );

          // Stream AI response
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "content", content })}\n\n`
                )
              );
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "Stream error occurred",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process search request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
