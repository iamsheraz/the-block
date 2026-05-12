import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

type ImageGalleryProps = {
  images: string[];
  title: string;
};

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [erroredIndices, setErroredIndices] = useState<ReadonlySet<number>>(() => new Set());

  // Clamp the active index whenever the image list shrinks.
  useEffect(() => {
    if (activeIndex >= images.length && images.length > 0) {
      setActiveIndex(0);
    }
  }, [images.length, activeIndex]);

  function markErrored(idx: number) {
    setErroredIndices((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }

  function step(delta: number) {
    if (images.length === 0) return;
    setActiveIndex((prev) => (prev + delta + images.length) % images.length);
  }

  function onThumbKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    }
  }

  const activeSrc = images[activeIndex];
  const activeErrored = activeSrc === undefined || erroredIndices.has(activeIndex);

  return (
    <section aria-label={`Image gallery for ${title}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-slate-200">
        {activeErrored ? (
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
          {images.length === 0 ? '0 photos' : `${activeIndex + 1} / ${images.length}`}
        </span>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2" role="tablist" aria-label="Gallery thumbnails">
          {images.slice(0, 5).map((src, idx) => {
            const isActive = idx === activeIndex;
            const errored = erroredIndices.has(idx);
            return (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`View ${idx + 1} of ${images.length}`}
                onClick={() => setActiveIndex(idx)}
                onKeyDown={onThumbKeyDown}
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
          {images.length > 5 ? (
            <div className="relative grid aspect-[4/3] place-items-center rounded-md bg-slate-100 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
              +{images.length - 5}
            </div>
          ) : null}
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
      <span className="text-[11px] font-medium text-slate-300">{title}</span>
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
