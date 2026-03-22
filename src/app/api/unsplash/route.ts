import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query") || "nature";
    const count = request.nextUrl.searchParams.get("count") || "1";

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    const images = data.results.map(
      (img: { urls: { regular: string; small: string }; alt_description: string; user: { name: string } }) => ({
        url: img.urls.regular,
        small: img.urls.small,
        alt: img.alt_description || query,
        credit: img.user.name,
      })
    );

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Unsplash API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images", images: [] },
      { status: 500 }
    );
  }
}
