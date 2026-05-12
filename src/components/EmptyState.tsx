import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'panel' | 'inset' | 'page';

type EmptyStateProps = {
  title: string;
  description?: string;
  // Eyebrow renders as a small uppercase kicker above the title. Useful for
  // not-found framing where the user needs to clock the failure type before
  // the supporting sentence.
  eyebrow?: string;
  action?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  // Anchor for assistive tech. Defaults to a section landmark; pages pass 'page'
  // to render their own main without nesting another landmark.
  as?: 'section' | 'div';
  ariaLabel?: string;
};

// Single empty-state primitive used wherever the app has nothing to show:
// inventory filter zero-results, no bid history, no damage notes, no images.
// The tone variants tune density to fit each surface.
export function EmptyState({
  title,
  description,
  eyebrow,
  action,
  icon,
  tone = 'panel',
  as = 'section',
  ariaLabel,
}: EmptyStateProps) {
  const Tag = as;
  return (
    <Tag
      aria-label={ariaLabel ?? title}
      className={clsx(
        'text-center',
        tone === 'panel' && 'rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16',
        tone === 'inset' &&
          'rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6',
        tone === 'page' && 'mx-auto max-w-3xl px-6 py-24',
      )}
    >
      {icon ? <div className="flex justify-center text-slate-400">{icon}</div> : null}
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={clsx(
          'font-semibold text-slate-900',
          tone === 'inset' ? 'mt-2 text-sm' : 'mt-3 text-base',
          tone === 'page' && 'text-2xl tracking-tight',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={clsx(
            'mt-1 text-slate-500',
            tone === 'page' ? 'text-sm text-slate-600' : 'text-sm',
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className={tone === 'inset' ? 'mt-3' : 'mt-5'}>{action}</div> : null}
    </Tag>
  );
}
