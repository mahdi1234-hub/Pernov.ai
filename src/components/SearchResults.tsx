"use client";

import { useState } from "react";

export interface SearchSource {
  url: string;
  title: string;
  description?: string;
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

export interface UnsplashImage {
  url: string;
  small: string;
  alt: string;
  credit: string;
}

/* ─── Sources Grid ─── */
export function SourcesGrid({
  sources,
  isLoading,
}: {
  sources: SearchSource[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Sources</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (sources.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">
          Sources ({sources.length})
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {sources.map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-lg bg-white/5 backdrop-blur-md border border-white/10 hover:border-indigo-400/50 hover:bg-white/10 transition-all duration-300 h-28"
          >
            {/* Background image */}
            {source.image && (
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={source.image}
                  alt=""
                  className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="relative p-3 flex flex-col justify-between h-full">
              {/* Favicon and domain */}
              <div className="flex items-center gap-1.5">
                <div className="flex-shrink-0 w-4 h-4 bg-white/10 rounded flex items-center justify-center overflow-hidden">
                  {source.favicon ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={source.favicon}
                      alt=""
                      className="w-3 h-3 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <svg className="w-2.5 h-2.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  )}
                </div>
                <span className="text-[10px] text-white/40 truncate flex-1">
                  {source.siteName || new URL(source.url).hostname.replace("www.", "")}
                </span>
                <span className="text-[10px] text-indigo-400/70 font-mono">[{idx + 1}]</span>
              </div>

              {/* Title */}
              <h3 className="font-medium text-xs text-white/80 line-clamp-2 group-hover:text-indigo-300 transition-colors leading-tight mt-1">
                {source.title}
              </h3>

              {/* External link icon */}
              <div className="flex items-center justify-end">
                <svg className="w-3 h-3 text-white/20 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Image Grid ─── */
export function ImageGrid({
  images,
  unsplashImages,
  isLoading,
}: {
  images: SearchImage[];
  unsplashImages: UnsplashImage[];
  isLoading: boolean;
}) {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Images</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-32 h-32 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Combine Firecrawl images and Unsplash images
  const allImages: { url: string; thumbnail: string; title: string; source?: string; credit?: string }[] = [];

  images.forEach((img) => {
    if (img.thumbnail) {
      allImages.push({
        url: img.url,
        thumbnail: img.thumbnail,
        title: img.title,
        source: img.source,
      });
    }
  });

  unsplashImages.forEach((img) => {
    allImages.push({
      url: img.url,
      thumbnail: img.small,
      title: img.alt,
      credit: img.credit,
      source: "Unsplash",
    });
  });

  if (allImages.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">
          Images ({allImages.length})
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {allImages.slice(0, 8).map((img, idx) => (
          <div
            key={idx}
            className="group flex-shrink-0 w-32 h-32 relative rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-indigo-400/50 cursor-pointer transition-all duration-300"
            onClick={() => setSelectedImage({ url: img.thumbnail, title: img.title })}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.thumbnail}
              alt={img.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-[10px] text-white line-clamp-2">{img.title}</p>
                {img.source && (
                  <p className="text-[9px] text-white/50 mt-0.5">{img.source}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="rounded-lg overflow-hidden bg-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
              />
              {selectedImage.title && (
                <div className="p-3 bg-black/60">
                  <p className="text-white/80 text-sm">{selectedImage.title}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Search Loading Skeleton ─── */
export function SearchSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/50">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-[10px] uppercase tracking-widest">Searching the web...</span>
      </div>
      <SourcesGrid sources={[]} isLoading={true} />
      <ImageGrid images={[]} unsplashImages={[]} isLoading={true} />
    </div>
  );
}
