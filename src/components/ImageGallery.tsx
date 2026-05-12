import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';

type ImageGalleryProps = {
  images: string[];
  title: string;
};

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [erroredIndices, setErroredIndices] = useState<ReadonlySet<number>>(() => new Set());
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Clamp the active index whenever the image list shrinks. Also drop stale
  // errored indices so a new image list doesn't carry placeholders forward.
  useEffect(() => {
    if (activeIndex >= images.length && images.length > 0) {
      setActiveIndex(0);
    }
    setErroredIndices((prev) => {
      const next = new Set<number>();
      for (const i of prev) {
        if (i < images.length) next.add(i);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [images.length, activeIndex]);

  function markErrored(idx: number) {
    setErroredIndices((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }

  function step(delta: number, fromIndex: number) {
    if (images.length === 0) return;
    const nextIndex = (fromIndex + delta + images.length) % images.length;
    setActiveIndex(nextIndex);
    // WAI-ARIA tab pattern: move focus along with selection.
    queueMicrotask(() => thumbRefs.current[nextIndex]?.focus());
  }

  function onThumbKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, fromIndex: number) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1, fromIndex);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1, fromIndex);
    }
  }

  const activeSrc = images[activeIndex];
  const noImages = images.length === 0;
  const activeErrored = !noImages && (activeSrc === undefined || erroredIndices.has(activeIndex));

  return (
    <section aria-label={`Image gallery for ${title}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-slate-200">
        {noImages ? (
          <NoImagesPlaceholder title={title} />
        ) : activeErrored ? (
          <HeroPlaceholder title={title} />
        ) : (
          <img
            src={activeSrc}
            alt={title}
            data-testid="gallery-hero"
            className="h-full w-full object-cover"
            onError={() => markErrored(activeIndex)}
          />
        )}
        <span className="pointer-events-none absolute bottom-3 right-3 rounded bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur tabular-nums">
          {noImages ? '0 photos' : `${activeIndex + 1} / ${images.length}`}
        </span>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2" role="tablist" aria-label="Gallery thumbnails">
          {images.map((src, idx) => {
            const isActive = idx === activeIndex;
            const errored = erroredIndices.has(idx);
            return (
              <button
                key={`${idx}-${src}`}
                ref={(el) => {
                  thumbRefs.current[idx] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                aria-label={`View ${idx + 1} of ${images.length}`}
                onClick={() => setActiveIndex(idx)}
                onKeyDown={(e) => onThumbKeyDown(e, idx)}
                className={clsx(
                  'relative aspect-[4/3] overflow-hidden rounded-md ring-1 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
                  isActive ? 'ring-2 ring-slate-900' : 'ring-slate-200 hover:ring-slate-300',
                )}
              >
                {errored ? (
                  <ThumbPlaceholder />
                ) : (
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => markErrored(idx)}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function HeroPlaceholder({ title }: { title: string }) {
  return (
    <div
      role="img"
      aria-label={`Image unavailable for ${title}`}
      className="flex h-full w-full items-end bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 p-4"
    >
      <span aria-hidden="true" className="text-[11px] font-medium text-slate-300">
        {title}
      </span>
    </div>
  );
}

function NoImagesPlaceholder({ title }: { title: string }) {
  return (
    <div
      role="img"
      aria-label={`No photos on file for ${title}`}
      className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-500"
    >
      <CameraOffIcon />
      <p className="mt-2 text-xs font-medium">No photos on file</p>
    </div>
  );
}

function ThumbPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="h-full w-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950"
    />
  );
}

function CameraOffIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 4h5l2 3H21v12.5M3 3l18 18M3 7h2l1-2M3 7v12h12" />
    </svg>
  );
}
