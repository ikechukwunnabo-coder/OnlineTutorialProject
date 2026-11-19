"use client";

import { useState } from "react";

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="surface-strong overflow-hidden">
      <div className="aspect-video w-full">
        {playing ? (
          <iframe
            src={url}
            title={title}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${title}`}
            className="grid h-full w-full place-items-center bg-[var(--code-bg)] p-6 text-left text-code-text"
          >
            <span className="max-w-md">
              <span className="mx-auto grid size-16 place-items-center border-2 border-code-text">
                <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="mt-5 block text-center font-display text-xl font-bold tracking-[-0.03em]">
                {title}
              </span>
              <span className="meta-text mt-2 block text-center text-code-muted">
                Click to play · video is not loaded until you choose it
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
