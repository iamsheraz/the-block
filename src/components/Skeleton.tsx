import { clsx } from 'clsx';

type SkeletonBoxProps = {
  className?: string;
  ariaHidden?: boolean;
};

// Single primitive. Composing skeletons stack these into card / panel shapes.
// `animate-pulse` is the Tailwind preset; the global motion-reduce rule in
// index.css disables the keyframe for users with reduced-motion enabled.
function SkeletonBox({ className, ariaHidden = true }: SkeletonBoxProps) {
  return (
    <div
      aria-hidden={ariaHidden}
      className={clsx('animate-pulse rounded bg-slate-200', className)}
    />
  );
}

// Inventory grid skeleton: six card-shaped placeholders in the same responsive
// grid as the real listings, so layout reservation matches and the page doesn't
// jump when real cards arrive.
export function InventoryGridSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading inventory" className="mx-auto max-w-7xl px-6 py-8">
      <SkeletonBox className="h-12 w-full" />
      <div className="mt-3 flex gap-2">
        <SkeletonBox className="h-8 w-20" />
        <SkeletonBox className="h-8 w-20" />
        <SkeletonBox className="h-8 w-24" />
      </div>
      <SkeletonBox className="mt-4 h-px w-full" />
      <section
        aria-hidden="true"
        className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder cells, never reordered
          <SkeletonCard key={idx} />
        ))}
      </section>
    </main>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <SkeletonBox className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-1/2" />
        <div className="border-t border-slate-100 pt-3">
          <SkeletonBox className="h-3 w-1/3" />
          <SkeletonBox className="mt-2 h-5 w-2/5" />
        </div>
        <SkeletonBox className="h-5 w-24" />
      </div>
    </div>
  );
}

// Detail-page skeleton: header + gallery (left) + condition triptych (right)
// + bid panel band. Mirrors the real triptych layout from UX.md so the
// reserved space matches the lazy-loaded route's actual frame.
export function DetailPageSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading vehicle detail"
      className="mx-auto max-w-7xl px-6 py-6"
    >
      <header className="mb-6 space-y-2">
        <SkeletonBox className="h-3 w-32" />
        <SkeletonBox className="h-7 w-72" />
        <SkeletonBox className="h-3 w-56" />
      </header>
      <section aria-hidden="true" className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SkeletonBox className="aspect-[4/3] w-full rounded-xl" />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder thumbnails
              <SkeletonBox key={idx} className="aspect-[4/3] rounded-md" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <SkeletonBox className="h-12 w-2/3" />
            <SkeletonBox className="aspect-[3/2] w-full rounded-lg" />
            <SkeletonBox className="h-20 w-full" />
          </div>
        </div>
      </section>
      <SkeletonBox className="mt-5 h-44 w-full rounded-xl" />
    </main>
  );
}
