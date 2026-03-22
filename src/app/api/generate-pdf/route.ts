import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { title, subtitle, sections, charts } = await request.json();

    // Fetch Unsplash images for each section
    const sectionsWithImages = await Promise.all(
      (sections || []).map(
        async (section: { heading: string; content: string; imageQuery?: string }) => {
          let imageUrl = "";
          if (section.imageQuery) {
            try {
              const res = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(section.imageQuery)}&per_page=1&orientation=landscape`,
                {
                  headers: {
                    Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
                  },
                }
              );
              if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                  imageUrl = data.results[0].urls.regular;
                }
              }
            } catch {
              // Skip image if fetch fails
            }
          }
          return { ...section, imageUrl };
        }
      )
    );

    return NextResponse.json({
      title,
      subtitle,
      sections: sectionsWithImages,
      charts: charts || [],
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report data" },
      { status: 500 }
    );
  }
}
